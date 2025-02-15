import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  build: {
    transpile: ['@jose/dist/types']
  },
  reactStrictMode: false
};

export default nextConfig;
