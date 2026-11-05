import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { personalize } from "@/lib/agents/personalize";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { ChatMessage, UserAgent } from "@/lib/types";
import { ChatRoom } from "./chat-room";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default async function ChatPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/chat/${agentId}`)}`);
  if (!user.onboarded) redirect("/welcome");

  const call = await userBackend();
  const agents = await call<UserAgent[]>("/v1/agents");
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) notFound();
  const history = await call<{ messages: ChatMessage[]; has_more: boolean }>(`/v1/agents/${agent.id}/chat`);

  return (
    <ChatRoom
      agent={personalize(agent)}
      initial={history.messages}
      hasMore={history.has_more}
      credits={user.credits.total}
      timezone={user.timezone}
      locale={user.locale}
    />
  );
}
