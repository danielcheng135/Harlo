import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (shouldRouteToMetaLandingPage(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/meta";
    return NextResponse.redirect(redirectUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

function shouldRouteToMetaLandingPage(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname !== "/") {
    return false;
  }

  if (searchParams.has("fbclid")) {
    return true;
  }

  const source = searchParams.get("utm_source")?.toLowerCase() ?? "";
  const medium = searchParams.get("utm_medium")?.toLowerCase() ?? "";
  const campaign = searchParams.get("utm_campaign")?.toLowerCase() ?? "";

  const isMetaSource = ["meta", "facebook", "fb", "instagram", "ig"].some((value) => source.includes(value));
  const looksLikeMetaCampaign = campaign.includes("meta") || campaign.includes("facebook") || campaign.includes("instagram");

  return isMetaSource || (looksLikeMetaCampaign && (medium.includes("paid") || medium.includes("social") || medium.includes("cpc")));
}
