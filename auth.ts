import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      return session;
    },
    async signIn({ account, profile }) {
      // When user signs in, send tokens to backend
      if (account && profile && profile.email) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
          const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

          // Check if user exists, if not create
          const response = await fetch(`${apiUrl}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": apiKey,
            },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name || "",
              google_access_token: account.access_token,
              google_refresh_token: account.refresh_token,
              token_expires_at: account.expires_at
                ? new Date(account.expires_at * 1000).toISOString()
                : null,
            }),
          });

          if (!response.ok && response.status !== 400) {
            // 400 might mean user already exists, which is ok
            console.error("Failed to create/update user in backend");
          }
        } catch (error) {
          console.error("Error syncing user with backend:", error);
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
