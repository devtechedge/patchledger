import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // imported scanner JSON is pasted through a server action; allow room
      // for large monorepo audit outputs (the app still caps input itself)
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
