import type { NextConfig } from "next";

// `output: "standalone"` is for self-hosted (Docker/VPS) deployments.
// Vercel has its own build pipeline and doesn't need standalone output.
// Detect Vercel via VERCEL env var (automatically set by Vercel platform).
const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  // Only enable standalone output for self-hosted deployments.
  // On Vercel, omit this so Vercel's build pipeline handles output.
  ...(isVercel ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Vercel serverless functions have a max duration:
  //   - Hobby: 10s (default), 60s (with config)
  //   - Pro: 300s (with config)
  // Set 60s for API routes that poll Casper RPC (deploy confirmation).
  // Casper testnet block time ~16s, so 60s covers ~3 blocks.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
