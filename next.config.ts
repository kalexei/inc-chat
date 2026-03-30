import type { NextConfig } from "next";

/**
 * Same-origin `/api/*` as in `index.html` (`API_BASE = ""`).
 * Set `SALES_AGENT_API_ORIGIN` to your backend (e.g. `http://localhost:3001`) so
 * Next proxies `/api/...` → backend. Leave unset if you use
 * `NEXT_PUBLIC_API_BASE_URL` to call the API directly instead.
 */
const salesAgentOrigin = process.env.SALES_AGENT_API_ORIGIN?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!salesAgentOrigin) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${salesAgentOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
