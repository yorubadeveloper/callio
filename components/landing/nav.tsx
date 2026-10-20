import { auth } from "@/auth";
import { AfterIntro } from "./motion";
import { NavBar } from "./nav-bar";

export async function LandingNav() {
  const session = await auth();
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AfterIntro y={-14} delay={0.6}>
        <NavBar signedIn={Boolean(session?.userId)} />
      </AfterIntro>
    </header>
  );
}
