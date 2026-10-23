import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
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
