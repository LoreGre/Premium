import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ENV:
      process.env.NEXT_PUBLIC_ENV || process.env.VERCEL_ENV || 'Pro',
    NEXT_PUBLIC_GIT_COMMIT_REF:
      process.env.NEXT_PUBLIC_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_REF,
    NEXT_PUBLIC_GIT_COMMIT_SHA:
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
      'unknown',
  },
};

export default nextConfig;
