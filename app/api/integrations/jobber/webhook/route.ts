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

  if (!verifyJobberWebhookSignature(rawBody, signature, secret)) {
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

export function verifyJobberWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature.trim(), "base64");

  return received.length === expected.length && timingSafeEqual(received, expected);
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

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
