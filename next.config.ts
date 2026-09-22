import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Gallery and logo uploads go through server actions.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
