import { NextResponse } from "next/server";
import { devLoginEnabled } from "@/auth";
import { BackendError, syncUser } from "@/lib/server/backend";
import { mobileToken, verifyGoogleIdToken } from "@/lib/server/mobile-auth";

// The mobile app swaps a Google ID token for a Callio token (see lib/server/mobile-auth.ts).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id_token?: string; dev?: boolean };
  try {
    if (body.dev && devLoginEnabled) {
      const user = await syncUser({ email: "test@callio.local", name: "Test User", image: null, google_sub: "dev", locale: null });
      return NextResponse.json({ token: await mobileToken(user.id), user });
    }
    if (!body.id_token) return NextResponse.json({ detail: "Sign in with Google to continue." }, { status: 400 });
    const profile = await verifyGoogleIdToken(body.id_token);
    if (!profile) return NextResponse.json({ detail: "That Google sign-in didn't work. Please try again." }, { status: 401 });
    // Same rule as the website: only verified Google emails can create accounts.
    if (profile.email_verified === false) {
      return NextResponse.json({ detail: "Verify your Google email first, then try again." }, { status: 403 });
    }
    const user = await syncUser({
      email: profile.email,
      name: profile.name ?? profile.email,
      image: profile.picture ?? null,
      google_sub: profile.sub,
      locale: profile.locale ?? null,
    });
    return NextResponse.json({ token: await mobileToken(user.id), user });
  } catch (err) {
    const status = err instanceof BackendError ? err.status : 500;
    if (!(err instanceof BackendError)) console.error("mobile sign-in failed", err);
    return NextResponse.json({ detail: "Callio is having trouble right now. Try again in a moment." }, { status });
  }
}
