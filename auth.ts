import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_BASE_URL = process.env.API_URL || "http://localhost:8000/api/v1";
const API_KEY = process.env.API_KEY || "";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        // Mark that we have fresh tokens to sync
        token.needsTokenSync = true;
      }
      // Store email for later user creation
      if (profile?.email) {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      session.email = token.email as string;
      session.needsTokenSync = token.needsTokenSync as boolean;
      return session;
    },
    async signIn({ account, profile }) {
      // Create or get user in backend on every sign-in
      if (profile?.email && account) {
        try {
          // 1. Create user (idempotent — returns existing if already exists)
          const createRes = await fetch(`${API_BASE_URL}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": API_KEY,
            },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name || profile.email,
            }),
          });

          if (!createRes.ok) {
            console.error("Failed to create/get user in backend:", await createRes.text());
            // Don't block sign-in
            return true;
          }

          const user = await createRes.json();

          // 2. Sync calendar tokens to backend
          if (account.access_token && account.refresh_token) {
            const tokenRes = await fetch(`${API_BASE_URL}/users/${user.id}/calendar`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": API_KEY,
              },
              body: JSON.stringify({
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: new Date((account.expires_at || 0) * 1000).toISOString(),
              }),
            });

            if (!tokenRes.ok) {
              console.error("Failed to sync calendar tokens:", await tokenRes.text());
            }
          }
        } catch (error) {
          console.error("Error syncing user to backend on sign-in:", error);
          // Don't block sign-in
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
});
