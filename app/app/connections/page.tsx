import type { Metadata } from "next";
import { ConnectionsView } from "@/components/app/connections";
import { currentUser } from "@/lib/server/backend";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ calendar?: string }> }) {
  return <ConnectionsView user={(await currentUser())!} result={(await searchParams).calendar} />;
}
