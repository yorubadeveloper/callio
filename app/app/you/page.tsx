import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { YouView } from "@/components/app/you";
import { currentUser } from "@/lib/server/backend";

export const metadata: Metadata = { title: "You" };

export default async function YouPage({ searchParams }: { searchParams: Promise<{ calendar?: string }> }) {
  // Google Calendar used to live here; its OAuth return may still land on this page.
  const { calendar } = await searchParams;
  if (calendar) redirect(`/app/connections?calendar=${encodeURIComponent(calendar)}`);
  return <YouView user={(await currentUser())!} />;
}
