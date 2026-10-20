import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { currentUser } from "@/lib/server/backend";

// Private: keep the signed-in app out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/app");
  if (!user.onboarded) redirect("/welcome");
  return <AppShell user={user}>{children}</AppShell>;
}
