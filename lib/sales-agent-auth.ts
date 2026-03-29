/**
 * Static sales-agent API key from build-time env (not user input).
 * Set `NEXT_PUBLIC_SALES_AGENT_API_KEY` in `.env.local`; sent as `X-API-Key` when set.
 */
export function applySalesAgentApiKey(headers: Headers): void {
  const key = process.env.NEXT_PUBLIC_SALES_AGENT_API_KEY?.trim();
  if (key) headers.set("X-API-Key", key);
}
