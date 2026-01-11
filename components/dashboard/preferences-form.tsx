"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { UserPreferences } from "@/types/preferences";

interface PreferencesFormProps {
  userId?: string;
  preferences: UserPreferences | null;
  onUpdate: () => void;
}

export function PreferencesForm({ userId, preferences: userPrefs, onUpdate }: PreferencesFormProps) {
  const [preferences, setPreferences] = useState({
    includeCalendar: true,
    includeWeather: true,
    includeNews: true,
  });

  useEffect(() => {
    if (userPrefs) {
      setPreferences({
        includeCalendar: userPrefs.include_calendar,
        includeWeather: userPrefs.include_weather,
        includeNews: userPrefs.include_news,
      });
    }
  }, [userPrefs]);

  const handleToggle = async (key: keyof typeof preferences) => {
    if (!userId) return;

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);

    try {
      await api.preferences.update(userId, {
        include_calendar: newPreferences.includeCalendar,
        include_weather: newPreferences.includeWeather,
        include_news: newPreferences.includeNews,
      });
      toast.success("Preferences updated");
      onUpdate();
    } catch (error) {
      // Revert on error
      setPreferences(preferences);
      toast.error("Failed to update preferences");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Briefing Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose what to include in your daily briefing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="calendar">Calendar Events</Label>
            <p className="text-sm text-muted-foreground">
              Include today's calendar events
            </p>
          </div>
          <Switch
            id="calendar"
            checked={preferences.includeCalendar}
            onCheckedChange={() => handleToggle("includeCalendar")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weather">Weather</Label>
            <p className="text-sm text-muted-foreground">
              Include current weather forecast
            </p>
          </div>
          <Switch
            id="weather"
            checked={preferences.includeWeather}
            onCheckedChange={() => handleToggle("includeWeather")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="news">News Headlines</Label>
            <p className="text-sm text-muted-foreground">
              Include news on your selected topics
            </p>
          </div>
          <Switch
            id="news"
            checked={preferences.includeNews}
            onCheckedChange={() => handleToggle("includeNews")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
