import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  return auth(request as any);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
