import { NextResponse } from "next/server";
import { auth } from "@/auth";

// City suggestions for the "Where are you?" field. Runs on our server so only the typed place name reaches
// Open-Meteo, never the visitor's IP (see the privacy policy). Each place carries its time zone.
export async function GET(req: Request) {
  if (!(await auth())?.userId) return NextResponse.json({ detail: "Sign in to continue." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 80) return NextResponse.json([]);

  const params = new URLSearchParams({ name: q, count: "6", language: "en", format: "json" });
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return NextResponse.json([]);
    const data = (await res.json()) as {
      results?: { id: number; name: string; admin1?: string; country?: string; timezone?: string }[];
    };
    const places = (data.results ?? [])
      .filter((r) => r.timezone)
      .map((r) => ({
        id: r.id,
        name: r.name,
        region: r.admin1 ?? null,
        country: r.country ?? null,
        timezone: r.timezone,
      }));
    return NextResponse.json(places);
  } catch {
    return NextResponse.json([]);
  }
}
