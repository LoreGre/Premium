import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos', 'www.silanpromozioni.com'],
  },
  env: {
    NEXT_PUBLIC_ENV: process.env.VERCEL_ENV || 'Loc',
    NEXT_PUBLIC_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || 'local',
    NEXT_PUBLIC_GIT_COMMIT_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'local',
  },
};

export default nextConfig;
