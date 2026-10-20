import { NextRequest, NextResponse } from "next/server";
import { sessionUserId } from "@/lib/server/backend";
import { mockBackend, mockEnabled, MockError } from "@/lib/server/mock-backend";

// Forwards the browser's /api/v1/* requests to the backend as the signed-in user.
// The API key and user id are added here; the browser never sees them.

const BASE = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
// Server-to-server only: the frontend's auth flow calls these directly.
const BLOCKED = new Set(["users/sync"]);

async function forward(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (BLOCKED.has(path)) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ detail: "Sign in to continue." }, { status: 401 });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  if (mockEnabled()) {
    try {
      const body = hasBody ? await req.json().catch(() => undefined) : undefined;
      const data = await mockBackend(req.method, `/v1/${path}${req.nextUrl.search}`, body, userId);
      return data === undefined ? new NextResponse(null, { status: 204 }) : NextResponse.json(data);
    } catch (err) {
      const status = err instanceof MockError ? err.status : 500;
      return NextResponse.json({ detail: err instanceof Error ? err.message : "Mock error" }, { status });
    }
  }

  const url = `${BASE}/v1/${path}${req.nextUrl.search}`;
  try {
    const res = await fetch(url, {
      method: req.method,
      headers: {
        "X-API-Key": process.env.API_KEY ?? "",
        "X-User-Id": userId,
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
    // Stream the body through untouched so JSON and screenshots both work.
    return new NextResponse(res.status === 204 ? null : res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ detail: "Callio is having trouble right now. Try again in a moment." }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
