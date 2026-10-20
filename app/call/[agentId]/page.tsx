import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { personalize } from "@/lib/agents/personalize";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { UserAgent } from "@/lib/types";
import { CallRoom } from "./call-room";

export const metadata: Metadata = { title: "Call" };

export default async function CallPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ purpose?: string }>;
}) {
  const [{ agentId }, { purpose }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user) redirect(`/signin?next=/call/${agentId}`);
  if (!user.onboarded) redirect("/welcome");

  const call = await userBackend();
  const agents = await call<UserAgent[]>("/v1/agents");
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) notFound();

  return <CallRoom agent={personalize(agent)} credits={user.credits.total} purpose={purpose} />;
}
