import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CalendarStatus } from "@/components/dashboard/calendar-status";
import { PhoneDisplay } from "@/components/dashboard/phone-display";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { NewsTopicsForm } from "@/components/dashboard/news-topics-form";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  return (
    <div className="w-full px-4 py-8 sm:py-16 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your daily briefing settings
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <CalendarStatus />
        <PhoneDisplay />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <NewsTopicsForm />
        <PreferencesForm />
      </div>
    </div>
  );
}
