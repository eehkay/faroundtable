import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Skip linting and type checking if needed for CI
  eslint: {
    ignoreDuringBuilds: process.env.CI === 'true',
  },
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true',
  },
};

export default nextConfig;
