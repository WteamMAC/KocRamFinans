import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-sdk/google", "ai", "yahoo-finance2", "lucide-react"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
};

export default nextConfig;
