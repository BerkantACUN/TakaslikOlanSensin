import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // oracledb native bir modül; webpack ile bundle edilmemeli, Node tarafında
  // require edilmeli.
  serverExternalPackages: ["oracledb"],
  // Kozmetik react/no-unescaped-entities kuralı build'i bloklamasın.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
