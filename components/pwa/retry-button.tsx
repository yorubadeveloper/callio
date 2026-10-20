"use client";

import { btn } from "@/components/app/ui";

export function RetryButton() {
  return (
    <button type="button" onClick={() => window.location.reload()} className={`${btn.primary} mt-8`}>
      Try again
    </button>
  );
}
