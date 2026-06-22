import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getMetaAttributionFromRequest, getMetaAttributionFromUserMetadata, mergeMetaAttribution } from "@/lib/meta/attribution";
import { sendMetaCapiEventOnce } from "@/lib/meta/capi";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNext(url.searchParams.get("next"));
  const isRegistrationCallback = url.searchParams.get("registration") === "1";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.session?.user ?? null;

    if (isRegistrationCallback && user && shouldTrackCompleteRegistration(user)) {
      await trackCompleteRegistration(request, user);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

async function trackCompleteRegistration(request: NextRequest, user: User) {
  const requestAttribution = getMetaAttributionFromRequest(request);
  const storedAttribution = getMetaAttributionFromUserMetadata(user.user_metadata);
  const attribution = mergeMetaAttribution(requestAttribution, storedAttribution);

  await sendMetaCapiEventOnce({
    event_name: "CompleteRegistration",
    event_id: `supabase:${user.id}:complete-registration`,
    event_source_url: attribution.eventSourceUrl,
    user_data: {
      email: user.email,
      externalId: user.id,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      clientIpAddress: attribution.clientIpAddress,
      clientUserAgent: attribution.clientUserAgent
    },
    custom_data: {
      content_name: "Harlo account registration",
      method: getRegistrationMethod(user)
    }
  });
}

function shouldTrackCompleteRegistration(user: User) {
  if (!user.email) {
    return false;
  }

  return isRecentTimestamp(user.email_confirmed_at ?? user.confirmed_at, 24 * 60 * 60 * 1000) ||
    isRecentTimestamp(user.created_at, 15 * 60 * 1000);
}

function isRecentTimestamp(value: string | undefined, windowMs: number) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) && Math.abs(Date.now() - timestamp) <= windowMs;
}

function getRegistrationMethod(user: User) {
  const provider = user.app_metadata?.provider;

  return typeof provider === "string" && provider ? provider : "email";
}
