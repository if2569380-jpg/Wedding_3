import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yxcirytftaeyokldsphx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  // output: 'export' removed - API routes require server-side rendering
  distDir: 'dist',
  transpilePackages: ['motion'],
  turbopack: {
    // Turbopack configuration for Next.js 16
  },
};

export default nextConfig;
