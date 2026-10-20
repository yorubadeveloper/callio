import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { currentUser } from "@/lib/server/backend";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/welcome");
  if (user.onboarded) redirect("/app");
  return <OnboardingFlow user={user} />;
}
