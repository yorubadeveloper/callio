"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarStatus } from "@/components/dashboard/calendar-status";
import { PhoneDisplay } from "@/components/dashboard/phone-display";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { NewsTopicsForm } from "@/components/dashboard/news-topics-form";
import { LanguageSelector } from "@/components/dashboard/language-selector";
import { CallScheduleForm } from "@/components/dashboard/call-schedule-form";
import { ContextDialog } from "@/components/dashboard/context-dialog";
import { Button } from "@/components/ui/button";
import { Article } from "@phosphor-icons/react/dist/ssr";
import { api } from "@/lib/api";
import type { User } from "@/types/user";
import type { UserPreferences } from "@/types/preferences";

interface DashboardClientProps {
  email: string;
  name: string;
}

export function DashboardClient({ email, name }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showContextDialog, setShowContextDialog] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await api.users.getByEmail(email);
      setUser(userData);

      // Auto-detect and sync timezone on first load
      if (userData.id) {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTz && userData.timezone !== browserTz) {
          try {
            await api.users.update(userData.id, { timezone: browserTz });
          } catch {
            // Non-critical, ignore
          }
        }
      }

      // Load preferences
      try {
        const prefsData = await api.preferences.get(userData.id);
        setPreferences(prefsData);
      } catch {
        // No preferences found yet
      }
    } catch {
      // User doesn't exist in backend yet — shouldn't happen with new flow
      // but handle gracefully
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (isLoading) {
    return (
      <div className="w-full px-6 py-12 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground font-light">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContextDialog
        open={showContextDialog}
        onOpenChange={setShowContextDialog}
        userId={user?.id}
        currentContext={preferences?.additional_context}
        onUpdate={loadUserData}
      />

      <div className="w-full px-6 py-12 space-y-12 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 font-light">
              Manage your daily briefing settings
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContextDialog(true)}
            className="flex items-center gap-2 h-9 rounded-full px-4"
          >
            <Article className="h-4 w-4" />
            <span className="hidden sm:inline">Context</span>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CalendarStatus userId={user?.id} user={user} onUpdate={loadUserData} />
          <PhoneDisplay user={user} onUpdate={loadUserData} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <NewsTopicsForm
            userId={user?.id}
            preferences={preferences}
            onUpdate={loadUserData}
          />
          <LanguageSelector
            userId={user?.id}
            preferences={preferences}
            onUpdate={loadUserData}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PreferencesForm
            userId={user?.id}
            preferences={preferences}
            onUpdate={loadUserData}
          />
          <CallScheduleForm userId={user?.id} />
        </div>
      </div>
    </>
  );
}
