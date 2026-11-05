import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory otherwise makes Turbopack pick the wrong root.
  turbopack: { root: __dirname },
  async redirects() {
    return [{ source: "/imprint", destination: "/contact", permanent: true }];
  },
};

export default nextConfig;
