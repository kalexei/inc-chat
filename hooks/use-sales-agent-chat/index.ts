"use client";

import { loadStoredSessions } from "@/lib/chat/sessions";
import { useSessionStore } from "../use-session-store";
import { useChatState } from "./use-chat-state";
import { useGreeting } from "./use-greeting";
import { FALLBACK_GREETING, useSessionActions } from "./use-session-actions";
import { useChatActions } from "./use-chat-actions";
import { useEffect } from "react";

export function useSalesAgentChat() {
  const state = useChatState();
  const store = useSessionStore();
  const greeting = useGreeting();
  const sessions = useSessionActions(state, store);
  const chat = useChatActions(state, greeting, sessions);

  useEffect(() => {
    if (state.hasAutoCreated()) return;
    if (state.inputEnabled) return;
    state.markAutoCreated();
    void (async () => {
      await Promise.resolve();
      const stored = loadStoredSessions();
      if (stored.length > 0) {
        const ok = await sessions.loadSession(stored[0]!.id);
        if (!ok) void sessions.newSession();
      } else {
        void sessions.newSession();
      }
    })();
  }, [sessions, state.inputEnabled, sessions.loadSession, sessions.newSession, state]);

  useEffect(() => {
    if (
      greeting.cachedGreeting &&
      state.messages.length === 1 &&
      state.messages[0]?.content === FALLBACK_GREETING
    ) {
      state.setMessages([
        {
          role: "assistant",
          content: greeting.cachedGreeting,
          sentAt: state.messages[0].sentAt,
        },
      ]);
    }
  }, [greeting.cachedGreeting, state.messages, state]);

  return {
    refs: { textareaRef: state.textareaRef },
    initials: greeting.initials,
    greetingMessage: greeting.cachedGreeting,
    showSearch: store.showSearch,
    setShowSearch: store.setShowSearch,
    sessionSearch: store.sessionSearch,
    setSessionSearch: store.setSessionSearch,
    filteredSessions: store.filteredSessions,
    sessionId: state.sessionId,
    userId: "",
    sessionLabel: state.sessionLabel,
    refreshBusy: chat.refreshBusy,
    hasMessages: state.messages.length > 0,
    heroLine: greeting.heroLine,
    heroSub: greeting.heroSub,
    messages: state.messages,
    typing: state.typing,
    inputEnabled: state.inputEnabled,
    isSending: state.isSending,
    newSession: sessions.newSession,
    loadSession: sessions.loadSession,
    deleteSession: sessions.deleteSession,
    sendMessage: chat.sendMessage,
    sendSuggestedPrompt: chat.sendSuggestedPrompt,
    refreshCache: chat.refreshCache,
    autoResize: state.autoResize,
    syncSessionsFromStorage: store.sync,
  };
}
