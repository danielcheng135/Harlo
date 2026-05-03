import { NextRequest, NextResponse } from "next/server";
import { getPublicBotConfig, isAllowedWidgetOrigin } from "@/lib/widget/config";

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get("botId");

  if (!botId) {
    return NextResponse.json({ error: "Missing botId." }, { status: 400 });
  }

  let config;

  try {
    config = await getPublicBotConfig(botId);
  } catch {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }
  const origin = request.headers.get("origin") ?? request.headers.get("referer");

  if (!isAllowedWidgetOrigin(config, origin)) {
    return NextResponse.json({ error: "Widget domain is not allowed." }, { status: 403 });
  }

  return NextResponse.json(config);
}
