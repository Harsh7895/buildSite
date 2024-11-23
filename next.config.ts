import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "uploadthing.com",
      "utfs.io",
      "img.clerk.com",
      "subdomain",
      "files.stripe.com",
      "images.remotePatterns"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sea1.ingest.uploadthing.com",
        pathname: "/**",
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
