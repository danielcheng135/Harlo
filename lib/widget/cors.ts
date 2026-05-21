import { NextRequest, NextResponse } from "next/server";

export function getWidgetCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  });

  headers.set("Access-Control-Allow-Origin", origin ?? "*");

  return headers;
}

export function widgetCorsPreflight(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getWidgetCorsHeaders(request)
  });
}

export function widgetJson<T>(request: NextRequest, body: T, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  const corsHeaders = getWidgetCorsHeaders(request);

  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}
