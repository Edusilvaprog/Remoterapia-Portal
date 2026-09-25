import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_PUBLIC_MODE === 'desktop' ? '.next-desktop' : '.next',
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      }
    ],
  },
};

export default nextConfig;
