export interface UserPreferences {
  id: string;
  user_id: string;
  news_topic_1: string | null;
  news_topic_2: string | null;
  additional_context: string | null;
  preferred_language: string;
  include_calendar: boolean;
  include_weather: boolean;
  include_news: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreferencesUpdate {
  news_topic_1?: string | null;
  news_topic_2?: string | null;
  additional_context?: string | null;
  preferred_language?: string;
  include_calendar?: boolean;
  include_weather?: boolean;
  include_news?: boolean;
}
