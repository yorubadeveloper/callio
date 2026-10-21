import type { Metadata } from "next";
import { AgentCard } from "@/components/app/agent-card";
import { NewAgentButton } from "@/components/app/new-agent-button";
import { PageTitle } from "@/components/app/ui";
import { personalize } from "@/lib/agents/personalize";
import { when } from "@/lib/format";
import { plan } from "@/lib/pricing";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Call, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsPage() {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [agents, calls] = await Promise.all([call<UserAgent[]>("/v1/agents"), call<Call[]>("/v1/calls?limit=50")]);
  const limit = plan(user.plan).agents;
  const lastTalked = (id: string) => {
    const c = calls.find((x) => x.agent_id === id);
    return c ? when(c.started_at, user.timezone, user.locale).toLowerCase() : null;
  };

  return (
    <>
      <PageTitle
        title="Your agents"
        subtitle={
          limit === "unlimited"
            ? "Make as many as you like."
            : `${agents.length} of ${limit} on your ${plan(user.plan).name} plan.`
        }
        action={<NewAgentButton count={agents.length} plan={user.plan} />}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={personalize(a)} lastTalked={lastTalked(a.id)} />
        ))}
      </div>
    </>
  );
}
