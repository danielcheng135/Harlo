import { redirect } from "next/navigation";
import type { Route } from "next";

type InboxPageProps = {
  searchParams?: Promise<{
    conversation?: string;
  }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const target = params?.conversation
    ? `/dashboard/conversations?conversation=${params.conversation}`
    : "/dashboard/conversations";

  redirect(target as Route);
}
