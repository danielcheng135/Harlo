import { NextRequest, NextResponse } from "next/server";
import type { LeadCaptureRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LeadCaptureRequest;

  if (!body.botId || !body.name || !body.email || !body.question) {
    return NextResponse.json({ error: "botId, name, email, and question are required." }, { status: 400 });
  }

  // Replace with Supabase insert and notification workflow.
  return NextResponse.json({
    ok: true,
    leadId: "lead_demo",
    message: "Lead captured."
  });
}
