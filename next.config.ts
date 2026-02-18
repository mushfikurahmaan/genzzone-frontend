import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const apiUrl = new URL(API_URL);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
        ...(apiUrl.port && { port: apiUrl.port }),
        pathname: '/media/**',
      },
      // Keep localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      // Media CDN / static assets (e.g. hero images)
      {
        protocol: 'https',
        hostname: 'media.genzzone.com',
        pathname: '/**',
      },
    ],
    unoptimized: false, // Set to true if you want to disable image optimization
  },
};

export default nextConfig;
