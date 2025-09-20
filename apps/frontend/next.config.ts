import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/angel/:path*',
        destination: `${process.env.NEXT_PUBLIC_ANGEL_HTTP_API_BASE}/:path*`,
      },
    ];
  },
};

export default nextConfig;
