"use client";

import {
  coerceMessageFromApi,
  ensureMessageSentAt,
} from "@/lib/chat/message-timestamps";
import { loadStoredSessions } from "@/lib/chat/sessions";
import { API_ROUTES } from "@/lib/api/client";
import {
  createSession,
  deleteSessionApi,
  fetchSession,
} from "@/lib/api/sales-agent";
import type { ChatState } from "./use-chat-state";
import type { GreetingState } from "./use-greeting";
import type { SessionStore } from "../use-session-store";
import { useCallback } from "react";

const DEFAULT_GREETING =
  "Hi there \u{1F44B}\nYou are now speaking with Innovi. How can I help?";

export function useSessionActions(
  state: ChatState,
  store: SessionStore,
  greeting: GreetingState,
) {
  const {
    sessionIdRef,
    isSending,
    sessionId,
    log,
    setIsSending,
    setInputEnabled,
    setMessages,
    setSessionId,
    setSessionLabel,
    resetState,
    updateSlots,
    updateRaw,
  } = state;

  const setSessionAndStore = useCallback(
    (id: string, firstUserMessage?: string, isNew?: boolean) => {
      setSessionId(id);
      setSessionLabel(id);
      if (isNew) {
        const hint =
          firstUserMessage && firstUserMessage.length > 48
            ? firstUserMessage.slice(0, 45) + "\u2026"
            : firstUserMessage || "";
        store.pushSession(id, hint);
      } else {
        store.sync();
      }
    },
    [store, setSessionId, setSessionLabel],
  );

  const newSession = useCallback(async (): Promise<boolean> => {
    if (isSending) return false;
    setIsSending(true);
    setInputEnabled(false);
    resetState();
    setSessionId(null);
    sessionIdRef.current = null;
    setSessionLabel("Creating\u2026");
    store.sync();

    log(`\u2192 POST ${API_ROUTES.session}`, "log-dim");
    try {
      const { res, data } = await createSession();
      if (!res.ok) {
        log(
          `HTTP ${res.status}: ${data.error || JSON.stringify(data)}`,
          "log-error",
        );
        setSessionLabel(
          data.error ? `Error: ${data.error}` : `Error (${res.status})`,
        );
        setIsSending(false);
        return false;
      }
      const sid = data.sessionId!;
      sessionIdRef.current = sid;
      setSessionAndStore(sid, "", true);
      setInputEnabled(true);
      log(`Session created: ${sid}`, "log-success");
      setMessages([
        {
          role: "assistant",
          content: greeting.cachedGreeting || DEFAULT_GREETING,
          sentAt: Date.now(),
        },
      ]);
      setIsSending(false);
      return true;
    } catch (e) {
      log(`Failed to create session: ${(e as Error).message}`, "log-error");
      setSessionLabel("Error creating session");
      setIsSending(false);
      return false;
    }
  }, [
    isSending, greeting.cachedGreeting, log, store,
    resetState, setSessionAndStore, sessionIdRef,
    setIsSending, setInputEnabled, setSessionId, setSessionLabel, setMessages,
  ]);

  const loadSession = useCallback(
    async (id: string): Promise<boolean> => {
      if (isSending) return false;
      log(`Loading session ${id}\u2026`, "log-info");
      try {
        const { res, data } = await fetchSession(id);
        if (!res.ok) {
          log(`Session not found: ${id}`, "log-error");
          return false;
        }
        setMessages([]);
        sessionIdRef.current = id;
        setSessionId(id);
        setSessionLabel(id);
        store.sync();

        const rawMsgs = data.messages || [];
        const msgs = rawMsgs.map(coerceMessageFromApi);
        const stored = loadStoredSessions().find((s) => s.id === id);
        const anchorMs =
          stored?.createdAt ?? Date.now() - Math.max(1, msgs.length) * 60_000;
        const normalized = ensureMessageSentAt(msgs, anchorMs);
        setMessages(
          normalized.length > 0
            ? normalized
            : [
                {
                  role: "assistant",
                  content: greeting.cachedGreeting || DEFAULT_GREETING,
                  sentAt: Date.now(),
                },
              ],
        );

        const merged = {
          ...(data.leadData || {}),
          ...(data.dynamicData || {}),
        };
        const submitted = Boolean(
          (data.chatMetadata as { submitted?: boolean } | undefined)
            ?.submitted,
        );
        updateSlots(merged, submitted);
        updateRaw(
          (data.chatMetadata || {}) as Record<string, unknown>,
          (data.leadData || {}) as Record<string, unknown>,
          (data.dynamicData || {}) as Record<string, unknown>,
        );
        setInputEnabled(true);
        log(`Session loaded: ${msgs.length} messages`, "log-success");
        return true;
      } catch (e) {
        log(`Failed to load session: ${(e as Error).message}`, "log-error");
        return false;
      }
    },
    [
      isSending, log, store, updateSlots, updateRaw,
      sessionIdRef, setMessages, setSessionId, setSessionLabel, setInputEnabled,
      greeting.cachedGreeting,
    ],
  );

  const deleteSession = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteSessionApi(id);
      } catch {
        /* best-effort */
      }
      store.removeSession(id);
      if (id === sessionId) {
        sessionIdRef.current = null;
        setSessionId(null);
        resetState();
        setSessionLabel("Not started");
        setInputEnabled(false);
        log("Active session deleted", "log-info");
      }
    },
    [
      sessionId, log, store, resetState,
      sessionIdRef, setSessionId, setSessionLabel, setInputEnabled,
    ],
  );

  return { newSession, loadSession, deleteSession, setSessionAndStore };
}

export type SessionActions = ReturnType<typeof useSessionActions>;
