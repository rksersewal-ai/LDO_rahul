import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "bullmq", "ioredis", "bcryptjs", "pdf-parse", "sharp"],
};

export default nextConfig;
