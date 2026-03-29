/** Base URL for the sales-agent API (empty = same origin, e.g. Next rewrites). */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
}
