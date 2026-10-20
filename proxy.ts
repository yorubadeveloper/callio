import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Signed-out visitors to the app go to sign-in, then come back where they were.
// Pages still check the session themselves; this just saves a round trip.
export const proxy = auth((req) => {
  if (req.auth) return NextResponse.next();
  const url = new URL("/signin", req.nextUrl);
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/app/:path*", "/call/:path*", "/welcome"],
};
