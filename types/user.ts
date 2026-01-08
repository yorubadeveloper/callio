export interface User {
  id: string;
  phone_number: string | null;
  email: string;
  name: string;
  location: string | null;
  timezone: string | null;
  is_active: boolean;
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
  google_access_token: string;
  google_refresh_token: string;
  token_expires_at: string;
}
