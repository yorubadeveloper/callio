"use client";

import { useEffect, useState } from "react";
import { CalendarStatus } from "@/components/dashboard/calendar-status";
import { PhoneDisplay } from "@/components/dashboard/phone-display";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { NewsTopicsForm } from "@/components/dashboard/news-topics-form";
import { PhoneSetupDialog } from "@/components/dashboard/phone-setup-dialog";
import { api } from "@/lib/api";
import type { User } from "@/types/user";
import type { UserPreferences } from "@/types/preferences";

interface DashboardClientProps {
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export function DashboardClient({ email, name, accessToken, refreshToken, expiresAt }: DashboardClientProps) {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const loadUserData = async () => {
    try {
      // Try to get user by email
      const userData = await api.users.getByEmail(email);
      setUser(userData);
      setNeedsSetup(false);

      // Load preferences
      try {
        const prefsData = await api.preferences.get(userData.id);
        setPreferences(prefsData);
      } catch (error) {
        console.log("No preferences found yet");
      }
    } catch (error) {
      // User doesn't exist, show setup dialog
      setNeedsSetup(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [email]);

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    setIsChecking(true);
    loadUserData();
  };

  if (isChecking) {
    return (
      <div className="w-full px-4 py-8 sm:py-16 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PhoneSetupDialog
        open={needsSetup}
        email={email}
        name={name}
        accessToken={accessToken}
        refreshToken={refreshToken}
        expiresAt={expiresAt}
        onComplete={handleSetupComplete}
      />

      <div className="w-full px-4 py-8 sm:py-16 space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your daily briefing settings
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <CalendarStatus />
          <PhoneDisplay user={user} onUpdate={loadUserData} />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <NewsTopicsForm
            userId={user?.id}
            preferences={preferences}
            onUpdate={loadUserData}
          />
          <PreferencesForm
            userId={user?.id}
            preferences={preferences}
            onUpdate={loadUserData}
          />
        </div>
      </div>
    </>
  );
}
