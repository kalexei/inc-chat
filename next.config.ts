import type { NextConfig } from "next";

const SALES_AGENT_ORIGIN =
  "https://proc-sales-agent-impl-5eeid8.internal-5i32o8.deu-c1.eu1.cloudhub.io";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${SALES_AGENT_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
