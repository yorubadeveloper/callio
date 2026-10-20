import type { Metadata } from "next";
import { MemoryBoard } from "@/components/app/memory-board";
import { personalize } from "@/lib/agents/personalize";
import { userBackend } from "@/lib/server/backend";
import type { Memory, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Memory" };

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ import?: string }> }) {
  const call = await userBackend();
  const [memories, agents] = await Promise.all([call<Memory[]>("/v1/memory"), call<UserAgent[]>("/v1/agents")]);
  return (
    <MemoryBoard
      memories={memories}
      agents={agents.map(personalize)}
      openImport={(await searchParams).import === "1"}
    />
  );
}
