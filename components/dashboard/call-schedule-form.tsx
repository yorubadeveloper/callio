"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneCall } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CallSchedule } from "@/types/schedule";

interface CallScheduleFormProps {
  userId?: string;
}

const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
];

export function CallScheduleForm({ userId }: CallScheduleFormProps) {
  const [schedule, setSchedule] = useState<CallSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadSchedule = async () => {
      try {
        const data = await api.schedule.get(userId);
        setSchedule(data);
      } catch {
        // Schedule doesn't exist yet, will be auto-created on first update
        setSchedule(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [userId]);

  const updateSchedule = async (updates: Partial<CallSchedule>) => {
    if (!userId) return;

    // Optimistic update
    const prev = schedule;
    if (schedule) {
      setSchedule({ ...schedule, ...updates });
    }

    try {
      const updated = await api.schedule.update(userId, updates);
      setSchedule(updated);
      toast.success("Call schedule updated");
    } catch {
      // Revert on error
      setSchedule(prev);
      toast.error("Failed to update call schedule");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            <CardTitle>Proactive Calls</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-light">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PhoneCall className="h-5 w-5" />
          <CardTitle>Proactive Calls</CardTitle>
        </div>
        <CardDescription>
          Callio can call you with your daily briefing or before meetings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Briefing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-briefing" className="text-base font-medium">Daily Briefing Call</Label>
              <p className="text-sm text-muted-foreground font-light">
                Receive a morning call with your daily briefing
              </p>
            </div>
            <Switch
              id="daily-briefing"
              checked={schedule?.daily_briefing_enabled ?? false}
              onCheckedChange={(checked) =>
                updateSchedule({ daily_briefing_enabled: checked })
              }
            />
          </div>

          {schedule?.daily_briefing_enabled && (
            <div className="ml-0 space-y-2">
              <Label htmlFor="briefing-time" className="text-sm font-medium">Briefing Time</Label>
              <Input
                id="briefing-time"
                type="time"
                value={schedule.briefing_time ?? "08:00"}
                onChange={(e) =>
                  updateSchedule({ briefing_time: e.target.value })
                }
                className="w-32"
              />
              <p className="text-xs text-muted-foreground font-light">
                Time in your local timezone
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Meeting Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="meeting-reminders" className="text-base font-medium">Meeting Reminders</Label>
              <p className="text-sm text-muted-foreground font-light">
                Get a call before meetings you might forget
              </p>
            </div>
            <Switch
              id="meeting-reminders"
              checked={schedule?.meeting_reminders_enabled ?? false}
              onCheckedChange={(checked) =>
                updateSchedule({ meeting_reminders_enabled: checked })
              }
            />
          </div>

          {schedule?.meeting_reminders_enabled && (
            <div className="ml-0 space-y-2">
              <Label htmlFor="reminder-minutes" className="text-sm font-medium">Remind me</Label>
              <Select
                value={String(schedule.reminder_minutes_before ?? 10)}
                onValueChange={(value) =>
                  updateSchedule({
                    reminder_minutes_before: parseInt(value, 10),
                  })
                }
              >
                <SelectTrigger className="w-40" id="reminder-minutes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} before
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
