import { NextRequest, NextResponse } from "next/server";
import {
  getDashboardNotificationState,
  markDashboardNotificationItemRead,
  type DashboardNotificationSection
} from "@/lib/dashboard/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const validSections = new Set<DashboardNotificationSection>(["conversations", "leads"]);

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  }

  const state = await getDashboardNotificationState(user.id);

  if (!state) {
    return NextResponse.json({ error: "No organization found for this account." }, { status: 404 });
  }

  return NextResponse.json({ counts: state.counts });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to update notifications." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { section?: string; itemId?: string } | null;
  const section = body?.section as DashboardNotificationSection | undefined;
  const itemId = body?.itemId;

  if (!section || !validSections.has(section) || !itemId) {
    return NextResponse.json({ error: "Choose a valid notification item." }, { status: 400 });
  }

  const state = await getDashboardNotificationState(user.id);

  if (!state) {
    return NextResponse.json({ error: "No organization found for this account." }, { status: 404 });
  }

  const { error } = await markDashboardNotificationItemRead(
    user.id,
    state.organizationId,
    section,
    itemId
  );

  if (error) {
    return NextResponse.json({ error: "Unable to update notifications." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}
