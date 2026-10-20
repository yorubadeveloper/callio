import type { MetadataRoute } from "next";
import { LEGAL } from "@/lib/legal";

const BASE = "https://callio.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(LEGAL.lastUpdated);
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/demo/laura`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/signin`, changeFrequency: "yearly", priority: 0.5 },
    ...["privacy", "terms", "refunds", "acceptable-use", "imprint"].map((p) => ({
      url: `${BASE}/${p}`,
      lastModified: updated,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
