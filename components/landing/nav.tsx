"use client";

import { useSession } from "next-auth/react";
import { AfterIntro } from "./motion";
import { NavBar } from "./nav-bar";

// The session is read in the browser so the landing page itself stays static and fast.
export function LandingNav() {
  const { status } = useSession();
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AfterIntro y={-14} delay={0.6}>
        <NavBar signedIn={status === "authenticated"} />
      </AfterIntro>
    </header>
  );
}
