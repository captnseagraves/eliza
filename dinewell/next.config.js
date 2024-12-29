/** @type {import('next').NextConfig} */
const nextConfig = {
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
  }
};

module.exports = nextConfig;
