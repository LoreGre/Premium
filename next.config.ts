import 'dotenv/config' // <-- importa .env.local esplicitamente
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.silanpromozioni.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn1.midocean.com',
        pathname: '/**'
      }
    ]
  },
  env: {
    NEXT_PUBLIC_ENV: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_ENV || 'Loc',
    NEXT_PUBLIC_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_GIT_COMMIT_REF || 'local',
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || 'local',
  },
}

export default nextConfig


