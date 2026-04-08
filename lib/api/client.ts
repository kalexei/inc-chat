import { getApiBase } from "@/lib/api-base";
import { applySalesAgentApiKey } from "@/lib/sales-agent-auth";

const API_PREFIX = "/agent/api";

export const API_ROUTES = {
  greeting: `${API_PREFIX}/greeting`,
  session: `${API_PREFIX}/session`,
  chat: `${API_PREFIX}/chat`,
  cacheRefresh: `${API_PREFIX}/cache/refresh`,
} as const;

export function buildHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  h.set("Content-Type", "application/json");
  applySalesAgentApiKey(h);
  return h;
}

function fullUrl(path: string): string {
  return `${getApiBase()}${path}`;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; data: T }> {
  const res = await fetch(fullUrl(path), {
    ...init,
    headers: buildHeaders(init?.headers),
  });
  const data = (await res.json()) as T;
  return { res, data };
}
