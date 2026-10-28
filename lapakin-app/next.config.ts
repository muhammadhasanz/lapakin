import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/invoices/:path*',
        destination: '/orders/:path*',
        permanent: true,
      },
      {
        source: '/invoices',
        destination: '/orders',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

