import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Callio",
    short_name: "Callio",
    description: "Agents that pick up the phone.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F2EE",
    theme_color: "#F3F2EE",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
