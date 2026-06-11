import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type DashboardNotificationCounts = {
  conversations: number;
  leads: number;
};

export type DashboardNotificationSection = keyof DashboardNotificationCounts;

export const emptyDashboardNotificationCounts: DashboardNotificationCounts = {
  conversations: 0,
  leads: 0
};

type NotificationState = {
  organizationId: string;
  counts: DashboardNotificationCounts;
};

type NotificationMembership = {
  organization_id: string;
  conversations_last_viewed_at: string;
  leads_last_viewed_at: string;
};

export async function getDashboardNotificationState(
  userId: string,
  organizationId?: string
): Promise<NotificationState | null> {
  const service = createSupabaseServiceClient();
  let membershipQuery = service
    .from("memberships")
    .select("organization_id, conversations_last_viewed_at, leads_last_viewed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (organizationId) {
    membershipQuery = membershipQuery.eq("organization_id", organizationId);
  }

  const { data: membership, error: membershipError } = await membershipQuery.maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const [conversations, leads] = await Promise.all([
    getUnreadItemIds(service, userId, membership, "conversations"),
    getUnreadItemIds(service, userId, membership, "leads")
  ]);

  return {
    organizationId: membership.organization_id,
    counts: {
      conversations: conversations.length,
      leads: leads.length
    }
  };
}

export async function getUnreadDashboardItemIds(
  userId: string,
  organizationId: string,
  section: DashboardNotificationSection,
  visibleItemIds: string[]
) {
  const service = createSupabaseServiceClient();
  const { data: membership } = await service
    .from("memberships")
    .select("organization_id, conversations_last_viewed_at, leads_last_viewed_at")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!membership || visibleItemIds.length === 0) {
    return [];
  }

  const unreadItemIds = await getUnreadItemIds(service, userId, membership, section);
  const visibleIds = new Set(visibleItemIds);

  return unreadItemIds.filter((itemId) => visibleIds.has(itemId));
}

export async function markDashboardNotificationItemRead(
  userId: string,
  organizationId: string,
  section: DashboardNotificationSection,
  itemId: string
) {
  const service = createSupabaseServiceClient();
  const table = section === "conversations" ? "conversations" : "leads";
  const { data: item } = await service
    .from(table)
    .select("id")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!item) {
    return { error: new Error("Notification item not found.") };
  }

  return service
    .from("dashboard_notification_item_reads")
    .upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        section,
        item_id: itemId,
        read_at: new Date().toISOString()
      },
      { onConflict: "user_id,section,item_id" }
    );
}

async function getUnreadItemIds(
  service: ReturnType<typeof createSupabaseServiceClient>,
  userId: string,
  membership: NotificationMembership,
  section: DashboardNotificationSection
) {
  const table = section === "conversations" ? "conversations" : "leads";
  const baseline =
    section === "conversations"
      ? membership.conversations_last_viewed_at
      : membership.leads_last_viewed_at;
  const { data: items, error: itemsError } = await service
    .from(table)
    .select("id")
    .eq("organization_id", membership.organization_id)
    .gt("created_at", baseline);

  if (itemsError || !items?.length) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const { data: reads, error: readsError } = await service
    .from("dashboard_notification_item_reads")
    .select("item_id")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", userId)
    .eq("section", section)
    .in("item_id", itemIds);

  if (readsError) {
    return [];
  }

  const readIds = new Set((reads ?? []).map((read) => read.item_id));
  return itemIds.filter((itemId) => !readIds.has(itemId));
}
