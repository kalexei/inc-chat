import type { NextConfig } from "next";

const SALES_AGENT_ORIGIN =
  process.env.SALES_AGENT_API_ORIGIN?.trim() ||
  "https://sales-sandbox.innovationcity.com";
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/agent/api/:path*",
        destination: `${SALES_AGENT_ORIGIN}/agent/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
