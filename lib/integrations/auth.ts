import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type IntegrationAuth = {
  userId: string;
  organizationId: string;
  role: string;
};

export async function getIntegrationAdminAuth(): Promise<IntegrationAuth | { response: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.redirect(new URL("/auth/sign-in?next=/dashboard/integrations", getFallbackUrl())) };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { response: NextResponse.json({ error: "Finish onboarding before connecting integrations." }, { status: 409 }) };
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return { response: NextResponse.json({ error: "Only owners and admins can manage integrations." }, { status: 403 }) };
  }

  return {
    userId: user.id,
    organizationId: membership.organization_id,
    role: membership.role
  };
}

function getFallbackUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
