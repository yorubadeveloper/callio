// Human-friendly dates and durations, always in the person's own timezone.

export function greeting(timezone: string, now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(now),
  );
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function duration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

/** "Today, 18:05", "Yesterday", "Tue 21 Oct". */
export function when(iso: string, timezone: string, locale = "en-GB", now = new Date()) {
  const date = new Date(iso);
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(d);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(date);
  const diffDays = Math.round((Date.parse(day(date)) - Date.parse(day(now))) / 86_400_000);
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === -1) return `Yesterday, ${time}`;
  if (diffDays === 1) return `Tomorrow, ${time}`;
  return (
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: timezone }).format(
      date,
    ) + `, ${time}`
  );
}

/** "Today", "Tomorrow", "Thursday 23 October": headings for lists grouped by day. */
export function dayLabel(iso: string, timezone: string, locale = "en-GB", now = new Date()) {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(d);
  const diffDays = Math.round((Date.parse(day(new Date(iso))) - Date.parse(day(now))) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(
    new Date(iso),
  );
}

export function clockTime(iso: string, timezone: string, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(
    new Date(iso),
  );
}
