import type { Metadata } from "next";
import { UpcomingView } from "@/components/app/upcoming";
import { personalize } from "@/lib/agents/personalize";
import { currentUser, userBackend } from "@/lib/server/backend";
import type { AppNotification, Schedule, UserAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Upcoming" };

export default async function UpcomingPage() {
  const user = (await currentUser())!;
  const call = await userBackend();
  const [schedules, notifications, agents] = await Promise.all([
    call<Schedule[]>("/v1/schedules"),
    call<AppNotification[]>("/v1/notifications?limit=50"),
    call<UserAgent[]>("/v1/agents"),
  ]);
  return (
    <UpcomingView
      schedules={schedules}
      notifications={notifications}
      agents={agents.map(personalize)}
      timezone={user.timezone}
      locale={user.locale}
    />
  );
}
