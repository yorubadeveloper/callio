import type { Metadata } from "next";
import { ConnectionsView } from "@/components/app/connections";
import { personalize } from "@/lib/agents/personalize";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { Connector, MorningCall, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ calendar?: string }> }) {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [connectors, morning, agents, { calendar }] = await Promise.all([
    call<Connector[]>("/v1/connectors"),
    call<MorningCall>("/v1/briefing"),
    call<UserAgent[]>("/v1/agents"),
    searchParams,
  ]);
  return (
    <ConnectionsView
      user={user}
      result={calendar}
      connectors={connectors}
      morning={morning}
      agents={agents.map(personalize)}
    />
  );
}
