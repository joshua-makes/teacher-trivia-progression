import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Serve WebP/AVIF instead of PNG/JPEG — the 1.6 MB logo becomes ~80–150 KB
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Tree-shake large packages so only imported symbols end up in the bundle
  experimental: {
    optimizePackageImports: ['sonner', '@clerk/nextjs', 'drizzle-orm'],
  },
}

export default nextConfig
