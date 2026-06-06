import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type JobberWebhookPayload = {
  data?: {
    webHookEvent?: {
      accountId?: string;
      topic?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.JOBBER_CLIENT_SECRET?.trim();
  const signature = request.headers.get("x-jobber-hmac-sha256");

  if (!secret || !signature) {
    return NextResponse.json({ error: "Jobber webhook authentication is not configured." }, { status: 401 });
  }

  const rawBody = await request.text();
  const contentType = request.headers.get("content-type");
  const verification = verifyJobberWebhookSignature(rawBody, signature, secret, contentType);

  if (!verification.valid) {
    const diagnostic = {
      contentType,
      bodyFormat: getJobberWebhookBodyFormat(rawBody),
      signatureLength: signature.length,
      signatureEncoding: verification.signatureEncoding,
      secretFingerprint: createHash("sha256").update(secret).digest("hex").slice(0, 12)
    };

    console.error("Rejected Jobber webhook signature", diagnostic);
    return NextResponse.json({
      error: "Invalid Jobber webhook signature.",
      diagnostic
    }, { status: 401 });
  }

  const payload = parseJobberWebhookPayload(rawBody);
  const event = payload?.data?.webHookEvent;

  if (!event || event.topic !== "APP_DISCONNECT") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const accountId = cleanString(event.accountId);

  if (!accountId) {
    return NextResponse.json({ error: "Missing Jobber account ID." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("integrations")
    .update({
      status: "disconnected",
      credentials_encrypted: null,
      connected_by: null,
      connected_at: null,
      last_error: null,
      updated_at: now
    })
    .eq("provider", "jobber")
    .contains("config", { provider_account_id: accountId });

  if (error) {
    console.error("Could not process Jobber app disconnect webhook", error);
    return NextResponse.json({ error: "Could not update the Jobber integration." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export function verifyJobberWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
  contentType?: string | null
) {
  const receivedSignatures = decodeJobberSignatures(signature);
  let signatureEncoding = "unknown";

  const valid = getJobberSignedPayloadCandidates(rawBody, contentType).some((payload) => {
    const expected = createHmac("sha256", secret).update(payload).digest();

    return receivedSignatures.some(({ encoding, value }) => {
      const matches = value.length === expected.length && timingSafeEqual(value, expected);

      if (matches) {
        signatureEncoding = encoding;
      }

      return matches;
    });
  });

  return {
    valid,
    signatureEncoding: valid ? signatureEncoding : receivedSignatures.map(({ encoding }) => encoding).join(",") || "unknown"
  };
}

function parseJobberWebhookPayload(rawBody: string): JobberWebhookPayload | null {
  try {
    return JSON.parse(rawBody) as JobberWebhookPayload;
  } catch {
    const encodedPayload = new URLSearchParams(rawBody).get("data");

    if (!encodedPayload) {
      return null;
    }

    try {
      return JSON.parse(encodedPayload) as JobberWebhookPayload;
    } catch {
      return null;
    }
  }
}

function getJobberSignedPayloadCandidates(rawBody: string, contentType?: string | null) {
  const candidates = [rawBody];

  if (contentType?.includes("application/x-www-form-urlencoded") || rawBody.startsWith("data=")) {
    const encodedPayload = new URLSearchParams(rawBody).get("data");

    if (encodedPayload && encodedPayload !== rawBody) {
      candidates.push(encodedPayload);
    }
  }

  return candidates;
}

function decodeJobberSignatures(signature: string) {
  const normalized = signature.trim().replace(/^sha256=/i, "");
  const candidates: Array<{ encoding: string; value: Buffer }> = [];

  if (/^[a-f0-9]{64}$/i.test(normalized)) {
    candidates.push({ encoding: "hex", value: Buffer.from(normalized, "hex") });
  }

  candidates.push({ encoding: "base64", value: Buffer.from(normalized, "base64") });

  if (/^[A-Za-z0-9_-]+={0,2}$/.test(normalized)) {
    candidates.push({ encoding: "base64url", value: Buffer.from(normalized, "base64url") });
  }

  return candidates;
}

function getJobberWebhookBodyFormat(rawBody: string) {
  if (rawBody.trimStart().startsWith("{")) {
    return "json";
  }

  if (rawBody.startsWith("data=")) {
    return "form";
  }

  return "unknown";
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
