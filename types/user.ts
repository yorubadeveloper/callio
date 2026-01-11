export interface User {
  id: string;
  phone_number: string | null;
  email: string;
  name: string;
  location: string | null;
  timezone: string | null;
  is_active: boolean;
  has_calendar_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  name?: string;
  phone_number?: string;
  location?: string;
  timezone?: string;
}

export interface CalendarTokenUpdate {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}
