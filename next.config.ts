import type { NextConfig } from "next";

const mediaUrl = new URL(process.env.API_MEDIA_URL ?? "http://localhost:8000");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: mediaUrl.protocol === "https:" ? "https" : "http",
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: "/storage/**",
      },
    ],
    // Local development serves photos from localhost, which Next.js will not optimize.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
  },
};

export default nextConfig;
