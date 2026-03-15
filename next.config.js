const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'pub-5deecadad4ab46f9bf12b2691c52ec6d.r2.dev' },
      { protocol: 'https', hostname: 'pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev' },
      { protocol: 'https', hostname: 'cdn.virel.co.uk' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.railway.app' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      {
        source: '/catalog',
        destination: '/companions',
        permanent: true,
      },
      {
        source: '/catalog/:slug',
        destination: '/companions/:slug',
        permanent: true,
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
});
