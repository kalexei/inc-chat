import { STORAGE_KEY } from "@/lib/chat-constants";
import type { StoredSession } from "@/lib/chat-types";

export function loadStoredSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch {
    return [];
  }
}

export function persistSessions(sessions: StoredSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
}

export function sessionTitle(s: StoredSession): string {
  if (s.title) return s.title;
  const id = s.id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function formatSessionAge(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
