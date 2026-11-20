import { NextResponse } from "next/server";
import { devLoginEnabled } from "@/auth";
import { BackendError, syncUser } from "@/lib/server/backend";
import { mobileToken, verifyAppleIdToken, verifyGoogleIdToken } from "@/lib/server/mobile-auth";

// The mobile app swaps a Google ID token (or, on iOS, an Apple identity token) for a Callio token
// (see lib/server/mobile-auth.ts).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    id_token?: string;
    apple_identity_token?: string;
    apple_name?: string;
    dev?: boolean;
  };
  try {
    if (body.dev && devLoginEnabled) {
      const user = await syncUser({ email: "test@callio.local", name: "Test User", image: null, google_sub: "dev", locale: null });
      return NextResponse.json({ token: await mobileToken(user.id), user });
    }
    if (body.apple_identity_token) {
      const apple = await verifyAppleIdToken(body.apple_identity_token);
      if (!apple) return NextResponse.json({ detail: "That Apple sign-in didn't work. Please try again." }, { status: 401 });
      // Apple always verifies the address (it may be a private relay address, which is fine).
      if (!apple.email) {
        return NextResponse.json({ detail: "Share your email with Callio to sign in with Apple." }, { status: 403 });
      }
      const name = body.apple_name?.trim().slice(0, 120);
      const user = await syncUser({
        email: apple.email,
        // Apple only sends the name on the very first sign-in; the backend keeps the stored name when this is empty.
        name: name || "",
        image: null,
        // The backend keeps one sign-in subject per user; Apple's is namespaced so it can never clash with Google's.
        google_sub: `apple:${apple.sub}`,
        locale: null,
      });
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
