import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Local-disk uploads go through server actions in development. On Vercel,
      // images upload directly to Blob storage, so forms stay small.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
