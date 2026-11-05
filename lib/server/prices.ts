import "server-only";
import type { LivePrices } from "@/lib/pricing";
import { mockEnabled } from "@/lib/server/mock-backend";

const BASE = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** Today's prices from the backend (set in the admin dashboard), refreshed every 5 minutes. Null means use the defaults. */
export async function livePrices(): Promise<LivePrices | null> {
  if (mockEnabled() || !process.env.API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/v1/billing/prices`, {
      headers: { "X-API-Key": process.env.API_KEY },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { items: LivePrices }).items;
  } catch {
    return null;
  }
}
