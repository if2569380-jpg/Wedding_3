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
  // Keep default `.next` output so Vercel can find Next build artifacts.
  transpilePackages: ['motion'],
  turbopack: {
    // Pin workspace root so Turbopack does not infer from parent lockfiles.
    root: process.cwd(),
  },
};

export default nextConfig;
