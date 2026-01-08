"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export function PreferencesForm() {
  const [preferences, setPreferences] = useState({
    includeCalendar: true,
    includeWeather: true,
    includeNews: true,
  });

  const handleToggle = async (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);

    try {
      // TODO: Save to backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Preferences updated");
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
