import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aytdeqjxxjxbgiyslubx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
