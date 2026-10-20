import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import type { User } from "@/lib/types";
import { mockBackend, mockEnabled, MockError } from "./mock-backend";

// The FastAPI backend (voice-bot repo, on Dokploy) is only reachable from this
// server: every request carries the shared API key and, for user data, the
// signed-in user's backend id. Browsers never see either.

const BASE = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  userId?: string;
}

export async function backend<T>(path: string, { method = "GET", body, userId }: RequestOptions = {}): Promise<T> {
  if (mockEnabled()) {
    try {
      return (await mockBackend(method, path, body as Record<string, unknown> | undefined, userId)) as T;
    } catch (err) {
      throw err instanceof MockError ? new BackendError(err.status, err.message) : err;
    }
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "X-API-Key": process.env.API_KEY ?? "",
      ...(userId ? { "X-User-Id": userId } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res
      .json()
      .then((d: { detail?: unknown }) => (typeof d.detail === "string" ? d.detail : null))
      .catch(() => null);
    throw new BackendError(res.status, detail ?? "Callio is having trouble right now. Try again in a moment.");
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const syncUser = (body: {
  email: string;
  name: string;
  image: string | null;
  google_sub: string;
  locale: string | null;
}) => backend<User>("/v1/users/sync", { method: "POST", body });

/** The signed-in user's backend id, or null when signed out. */
export const sessionUserId = cache(async () => (await auth())?.userId ?? null);

/** The signed-in user, fetched once per request. Null when signed out. */
export const currentUser = cache(async (): Promise<User | null> => {
  const userId = await sessionUserId();
  if (!userId) return null;
  try {
    return await backend<User>("/v1/me", { userId });
  } catch (err) {
    // A deleted account with a still-valid cookie behaves like signed out.
    if (err instanceof BackendError && err.status === 404) return null;
    throw err;
  }
});

/** Backend calls scoped to the signed-in user. Throws 401 when signed out. */
export async function userBackend() {
  const userId = await sessionUserId();
  if (!userId) throw new BackendError(401, "Sign in to continue.");
  return <T>(path: string, opts: Omit<RequestOptions, "userId"> = {}) => backend<T>(path, { ...opts, userId });
}
