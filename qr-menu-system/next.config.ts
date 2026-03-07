/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // For default images
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // ALLOW ALL SUPABASE PROJECTS
      },
    ],
  },
}

module.exports = nextConfig