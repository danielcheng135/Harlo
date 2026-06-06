import { createHmac, timingSafeEqual } from "crypto";
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

  if (!verifyJobberWebhookSignature(rawBody, signature, secret, contentType)) {
    console.warn("Rejected Jobber webhook signature", {
      contentType,
      bodyFormat: getJobberWebhookBodyFormat(rawBody),
      signatureLength: signature.length
    });
    return NextResponse.json({ error: "Invalid Jobber webhook signature." }, { status: 401 });
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
  const received = decodeJobberSignature(signature);

  return getJobberSignedPayloadCandidates(rawBody, contentType).some((payload) => {
    const expected = createHmac("sha256", secret).update(payload).digest();

    return received.length === expected.length && timingSafeEqual(received, expected);
  });
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

function decodeJobberSignature(signature: string) {
  const normalized = signature.trim().replace(/^sha256=/i, "");

  return Buffer.from(normalized, "base64");
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
