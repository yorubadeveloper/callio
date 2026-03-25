export interface CallSchedule {
  id: string;
  user_id: string;
  daily_briefing_enabled: boolean;
  briefing_time: string;
  meeting_reminders_enabled: boolean;
  reminder_minutes_before: number;
  created_at: string;
  updated_at: string;
}

export interface CallScheduleUpdate {
  daily_briefing_enabled?: boolean;
  briefing_time?: string;
  meeting_reminders_enabled?: boolean;
  reminder_minutes_before?: number;
}

export interface CallLog {
  id: string;
  user_id: string;
  call_type: string;
  call_sid: string | null;
  status: string;
  duration_seconds: number | null;
  meeting_summary: string | null;
  meeting_start_time: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CallLogList {
  calls: CallLog[];
  total: number;
}
