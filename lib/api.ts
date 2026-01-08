import type { User, UserUpdate, CalendarTokenUpdate } from "@/types/user";
import type { UserPreferences, PreferencesUpdate } from "@/types/preferences";
import { ApiException } from "@/types/api";

// Use Next.js API route as proxy (keeps API_KEY secure)
const API_BASE_URL = "/api/backend";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Set default headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiException(
        errorData.detail || errorData.error || errorData.message || "An error occurred",
        response.status
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      error instanceof Error ? error.message : "Network error",
      500
    );
  }
}

// Users API
export const users = {
  create: async (data: {
    email: string;
    name: string;
    google_access_token?: string;
    google_refresh_token?: string;
    token_expires_at?: string | null;
  }): Promise<User> => {
    return fetchApi<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  get: async (userId: string): Promise<User> => {
    return fetchApi<User>(`/users/${userId}`);
  },

  getByEmail: async (email: string): Promise<User> => {
    return fetchApi<User>("/users", {
      params: { email },
    });
  },

  update: async (userId: string, data: UserUpdate): Promise<User> => {
    return fetchApi<User>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (userId: string): Promise<void> => {
    return fetchApi<void>(`/users/${userId}`, {
      method: "DELETE",
    });
  },

  updateCalendarTokens: async (
    userId: string,
    data: CalendarTokenUpdate
  ): Promise<User> => {
    return fetchApi<User>(`/users/${userId}/calendar`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  disconnectCalendar: async (userId: string): Promise<User> => {
    return fetchApi<User>(`/users/${userId}/calendar`, {
      method: "DELETE",
    });
  },
};

// Preferences API
export const preferences = {
  get: async (userId: string): Promise<UserPreferences> => {
    return fetchApi<UserPreferences>(`/preferences/${userId}`);
  },

  update: async (
    userId: string,
    data: PreferencesUpdate
  ): Promise<UserPreferences> => {
    return fetchApi<UserPreferences>(`/preferences/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// Briefing API
export const briefing = {
  preview: async (userId: string): Promise<{ briefing: string }> => {
    return fetchApi<{ briefing: string }>(`/briefing/preview/${userId}`);
  },
};

// Health check
export const health = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    return fetchApi<{ status: string; timestamp: string }>("/health");
  },
};

// Export all as api object
export const api = {
  users,
  preferences,
  briefing,
  health,
};
