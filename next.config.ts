import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pg",
    "bcryptjs",
    "bullmq",
    "ioredis",
    "sharp",
    "pdf-parse",
    "tesseract.js",
    "nodemailer",
  ],
};

export default nextConfig;
