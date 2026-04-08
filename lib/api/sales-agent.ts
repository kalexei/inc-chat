import type { ChatApiResponse, SessionApiResponse } from "@/lib/chat-types";
import { getApiBase } from "@/lib/api-base";
import { API_ROUTES, buildHeaders, requestJson } from "./client";

export function createSession() {
  return requestJson<{ sessionId?: string; error?: string }>(
    API_ROUTES.session,
    { method: "POST" },
  );
}

export function fetchSession(id: string) {
  return requestJson<SessionApiResponse>(`${API_ROUTES.session}/${id}`);
}

export async function deleteSessionApi(id: string): Promise<void> {
  await fetch(`${getApiBase()}${API_ROUTES.session}/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
}

export function sendChat(body: { message: string; sessionId?: string }) {
  return requestJson<ChatApiResponse>(API_ROUTES.chat, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchGreeting() {
  return requestJson<{ message?: string }>(API_ROUTES.greeting);
}

export function refreshCacheApi() {
  return requestJson<{ timestamp?: string; error?: string }>(
    API_ROUTES.cacheRefresh,
    { method: "POST" },
  );
}
