import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/call", "/welcome", "/api"] }],
    sitemap: "https://callio.site/sitemap.xml",
    host: "https://callio.site",
  };
}
