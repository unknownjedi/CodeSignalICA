import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be reached over both localhost and IPv4 loopback.
  allowedDevOrigins: ["localhost", "127.0.0.1", "127.0.2.2", "127.0.2.3"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
