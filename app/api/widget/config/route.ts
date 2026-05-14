import { NextRequest, NextResponse } from "next/server";
import { getPublicWidgetConfig, isAllowedWidgetOrigin } from "@/lib/widget/config";

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get("botId");
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const pageUrl = request.nextUrl.searchParams.get("pageUrl");

  if (!botId && !organizationId) {
    return NextResponse.json({ error: "Missing widget identifier." }, { status: 400 });
  }

  let config;

  try {
    config = await getPublicWidgetConfig({ botId, organizationId, pageUrl });
  } catch {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 });
  }
  const origin = request.headers.get("origin") ?? request.headers.get("referer");

  if (!isAllowedWidgetOrigin(config, origin)) {
    return NextResponse.json({ error: "Widget domain is not allowed." }, { status: 403 });
  }

  return NextResponse.json(config);
}
