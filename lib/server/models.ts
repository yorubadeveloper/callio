import "server-only";

/** Real-time voice for calls. GA since 2026-09-15. */
export const LIVE_MODEL = "gemini-3.8-live";
/** Cheap model for post-call summaries and memory extraction. */
export const SUMMARY_MODEL = "gemini-3.1-flash-lite";

export function geminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}
