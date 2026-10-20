import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { currentUser } from "@/lib/server/backend";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/app");
  if (!user.onboarded) redirect("/welcome");
  return <AppShell user={user}>{children}</AppShell>;
}
