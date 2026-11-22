import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hidden: the badge overlaps sticky mobile CTAs. Errors are still surfaced.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
