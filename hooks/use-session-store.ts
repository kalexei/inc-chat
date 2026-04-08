"use client";

import {
  loadStoredSessions,
  persistSessions,
  sessionTitle,
} from "@/lib/chat/sessions";
import type { StoredSession } from "@/lib/chat-types";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SessionStore = ReturnType<typeof useSessionStore>;

export function useSessionStore() {
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setStoredSessions(loadStoredSessions());
    });
  }, []);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return storedSessions;
    return storedSessions.filter(
      (s) =>
        sessionTitle(s).toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [storedSessions, sessionSearch]);

  const pushSession = useCallback((id: string, titleHint: string) => {
    const next = loadStoredSessions().filter((s) => s.id !== id);
    next.unshift({ id, createdAt: Date.now(), userId: null, title: titleHint });
    persistSessions(next);
    setStoredSessions(next);
  }, []);

  const removeSession = useCallback((id: string) => {
    const next = loadStoredSessions().filter((s) => s.id !== id);
    persistSessions(next);
    setStoredSessions(next);
  }, []);

  const sync = useCallback(() => setStoredSessions(loadStoredSessions()), []);

  return {
    storedSessions,
    sessionSearch,
    setSessionSearch,
    showSearch,
    setShowSearch,
    filteredSessions,
    pushSession,
    removeSession,
    sync,
  };
}
