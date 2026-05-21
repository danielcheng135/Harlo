import { NextRequest } from "next/server";
import { widgetCorsPreflight, widgetJson } from "@/lib/widget/cors";
import { WidgetRouteExcludedError, getPublicWidgetConfig, isAllowedWidgetOrigin } from "@/lib/widget/config";

export function OPTIONS(request: NextRequest) {
  return widgetCorsPreflight(request);
}

export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get("botId");
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const pageUrl = request.nextUrl.searchParams.get("pageUrl");

  if (!botId && !organizationId) {
    return widgetJson(request, { error: "Missing widget identifier." }, { status: 400 });
  }

  let config;

  try {
    config = await getPublicWidgetConfig({ botId, organizationId, pageUrl });
  } catch (error) {
    if (error instanceof WidgetRouteExcludedError) {
      return widgetJson(request, { disabled: true });
    }

    return widgetJson(request, { error: "Chatbot not found." }, { status: 404 });
  }
  const origin = request.headers.get("origin") ?? request.headers.get("referer");

  if (!isAllowedWidgetOrigin(config, origin)) {
    return widgetJson(request, { error: "Widget domain is not allowed." }, { status: 403 });
  }

  return widgetJson(request, config);
}
