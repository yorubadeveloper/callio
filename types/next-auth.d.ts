import "next-auth";

declare module "next-auth" {
  interface Session {
    /** The Callio backend user id. */
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
