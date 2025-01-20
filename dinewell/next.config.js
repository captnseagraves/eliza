/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',        
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: '/agents',
        destination: 'http://localhost:8080/agents',
      },
      {
        source: '/agents/:path*',
        destination: 'http://localhost:8080/agents/:path*',
      },
      {
        source: '/:agentId/message',
        destination: 'http://localhost:8080/:agentId/message',
      }
    ]
  },
};

const path = require('path');
module.exports = nextConfig;
