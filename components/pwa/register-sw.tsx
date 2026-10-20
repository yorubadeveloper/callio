"use client";

import { useEffect } from "react";

/** Registers the service worker on every visit (not only when turning on notifications), so Callio installs. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
