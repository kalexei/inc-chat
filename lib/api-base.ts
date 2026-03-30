/**
 * Base URL for the sales-agent API.
 * Empty string = same origin (`/api/...`), matching `index.html` with `API_BASE = ""`.
 * Use `SALES_AGENT_API_ORIGIN` in `next.config.ts` rewrites so Next proxies to your backend,
 * or set `NEXT_PUBLIC_API_BASE_URL` to call the API host directly from the browser.
 */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
}
