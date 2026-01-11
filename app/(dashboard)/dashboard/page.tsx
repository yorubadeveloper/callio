import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  return (
    <DashboardClient
      email={session.email || session.user.email!}
      name={session.user.name || ""}
      accessToken={session.accessToken}
      refreshToken={session.refreshToken}
      expiresAt={session.expiresAt}
    />
  );
}
