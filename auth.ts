import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { syncUser } from "@/lib/server/backend";

/**
 * A one-tap test account for local development, so the app can be explored
 * without Google credentials. Only exists when running `next dev` with
 * DEV_LOGIN=1; production builds never register it.
 */
export const devLoginEnabled = process.env.NODE_ENV === "development" && process.env.DEV_LOGIN === "1";

// Google is the only way in. We ask for the basic profile only: calendar access
// is a separate, optional step inside the app, so sign-up stays one tap.
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev",
            name: "Test user",
            credentials: {},
            authorize: async () => ({ id: "dev", email: "test@callio.local", name: "Test User" }),
          }),
        ]
      : []),
  ],
  pages: { signIn: "/signin", error: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "dev") return devLoginEnabled;
      // Only verified Google emails can create accounts.
      return Boolean(profile?.email && profile.email_verified !== false);
    },
    async jwt({ token, account, profile, user }) {
      // First sign-in on this device: create or fetch the Callio user and remember its id.
      if (account?.provider === "dev" && user?.email) {
        const synced = await syncUser({
          email: user.email,
          name: user.name ?? "Test User",
          image: null,
          google_sub: "dev",
          locale: null,
        });
        token.userId = synced.id;
      } else if (account && profile?.email) {
        const synced = await syncUser({
          email: profile.email,
          name: profile.name ?? profile.email,
          image: (profile.picture as string | undefined) ?? null,
          google_sub: account.providerAccountId,
          locale: (profile.locale as string | undefined) ?? null,
        });
        token.userId = synced.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") session.userId = token.userId;
      return session;
    },
  },
});
