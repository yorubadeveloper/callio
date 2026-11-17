import "server-only";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";

// Sign-in for the Callio mobile app. The app gets a Google ID token from the phone's
// native account picker; we check it with Google and hand back our own token, which
// the app sends as `Authorization: Bearer …` to /api/v1 and /api/calls/session.

const GOOGLE_KEYS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const ISSUER = "callio";
const AUDIENCE = "callio-mobile";
const LIFETIME = "90d";

/** Client IDs a Google ID token may be issued to: the web client (the app asks for it as serverClientId) and any extra mobile clients. */
function googleAudiences() {
  return [process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID, ...(process.env.GOOGLE_MOBILE_CLIENT_IDS ?? "").split(",")]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));
}

function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  // Derived, so a mobile token can never pass as an Auth.js cookie or the other way round.
  return new TextEncoder().encode(`callio-mobile:${secret}`);
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  locale?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_KEYS, { issuer: GOOGLE_ISSUERS, audience: googleAudiences() });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return payload as unknown as GoogleProfile;
  } catch {
    return null;
  }
}

export function mobileToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(signingKey());
}

/** The user id in a mobile app token, or null when it's missing, expired or forged. */
export async function userIdFromMobileToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer: ISSUER, audience: AUDIENCE, algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
