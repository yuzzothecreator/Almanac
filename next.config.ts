import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;
