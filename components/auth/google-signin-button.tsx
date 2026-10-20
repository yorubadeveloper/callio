"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Spinner } from "@/components/brand/logo-loader";

/** Google's sign-in button, following their branding guidelines (white, full-colour G). */
export function GoogleSignInButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setLoading(true);
        void signIn("google", { redirectTo: next && next.startsWith("/") ? next : "/app" });
      }}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white text-[16px] font-semibold text-[#1F1F1F] shadow-[0_1px_2px_rgb(0_0_0/0.08),0_8px_24px_-12px_rgb(0_0_0/0.25)] ring-1 ring-black/10 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80"
    >
      {loading ? <Spinner className="size-5" /> : <GoogleG className="size-5" />}
      {loading ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** Local development only: signs in as a throwaway test account. */
export function DevSignInButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setLoading(true);
        void signIn("dev", { redirectTo: next && next.startsWith("/") ? next : "/app" });
      }}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-amber text-[15px] font-semibold text-ink"
    >
      {loading && <Spinner className="size-4" />} Continue as test user (dev only)
    </button>
  );
}
