import type { NextConfig } from "next";

const SALES_AGENT_ORIGIN =
  "https://exp-gateway-impl-5eeid8.5i32o8.deu-c1.eu1.cloudhub.io";

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
