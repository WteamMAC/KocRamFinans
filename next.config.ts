import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-sdk/google", "ai", "yahoo-finance2", "lucide-react"],
};

export default nextConfig;
