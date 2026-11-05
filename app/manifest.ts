import type { MetadataRoute } from "next";

// Installs as an app: opens straight into /app (signed-out people land on sign-in), full screen,
// with long-press shortcuts on Android.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Callio",
    short_name: "Callio",
    description: "Agents that pick up the phone.",
    start_url: "/app?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#F3F2EE",
    theme_color: "#F3F2EE",
    categories: ["productivity", "lifestyle"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Upcoming",
        short_name: "Upcoming",
        url: "/app/upcoming",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Agents",
        short_name: "Agents",
        url: "/app/agents",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Calls",
        short_name: "Calls",
        url: "/app/calls",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
