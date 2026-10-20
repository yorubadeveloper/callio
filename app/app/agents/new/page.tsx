import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewAgentFlow } from "@/components/app/new-agent-flow";
import { plan } from "@/lib/pricing";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "New agent" };

export default async function NewAgentPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const user = (await currentUser())!;
  const agents = await (await userBackend())<UserAgent[]>("/v1/agents");
  const limit = plan(user.plan).agents;
  if (limit !== "unlimited" && agents.length >= limit) redirect("/app/agents");
  return <NewAgentFlow initialTemplate={(await searchParams).template} />;
}
