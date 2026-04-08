"use client";

import { logToolCalls } from "@/lib/chat/log-tool-calls";
import { API_ROUTES } from "@/lib/api/client";
import {
  fetchGreeting,
  refreshCacheApi,
  sendChat,
} from "@/lib/api/sales-agent";
import type { ChatState } from "./use-chat-state";
import type { GreetingState } from "./use-greeting";
import type { SessionActions } from "./use-session-actions";
import { useCallback, useState } from "react";

export function useChatActions(
  state: ChatState,
  greeting: GreetingState,
  sessions: SessionActions,
) {
  const {
    textareaRef,
    sessionIdRef,
    isSending,
    inputEnabled,
    log,
    setMessages,
    setTyping,
    setIsSending,
    updateSlots,
    updateRaw,
    autoResize,
  } = state;
  const { setSessionAndStore, newSession } = sessions;

  const [refreshBusy, setRefreshBusy] = useState(false);

  const sendMessage = useCallback(async () => {
    const input = textareaRef.current;
    if (!input) return;
    const message = input.value.trim();
    if (!message || isSending) return;

    setIsSending(true);
    input.value = "";
    autoResize();
    setMessages((m) => [
      ...m,
      { role: "user", content: message, sentAt: Date.now() },
    ]);
    setTyping(true);

    const body: { message: string; sessionId?: string } = { message };
    const sidForChat = sessionIdRef.current;
    if (sidForChat) body.sessionId = sidForChat;
    log(
      `\u2192 POST ${API_ROUTES.chat} | session=${sidForChat || "new"}`,
      "log-dim",
    );

    try {
      const { res, data } = await sendChat(body);
      setTyping(false);

      if (res.status === 429) {
        log(
          `Token budget exceeded: ${data.message || data.error}`,
          "log-error",
        );
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "\u26A0 Hourly token limit reached. Please wait before sending more messages.",
            sentAt: Date.now(),
          },
        ]);
      } else if (!res.ok) {
        log(
          `HTTP ${res.status}: ${data.error || JSON.stringify(data)}`,
          "log-error",
        );
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `\u26A0 Error: ${data.error || "Unknown error"}`,
            sentAt: Date.now(),
          },
        ]);
      } else {
        const isNewSession = data.sessionId !== sidForChat;
        setSessionAndStore(data.sessionId, message, isNewSession);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.reply || "(empty response)",
            sentAt: Date.now(),
          },
        ]);
        updateSlots(
          (data.slots || {}) as Record<string, unknown>,
          Boolean(data.leadSubmitted),
        );
        updateRaw(
          (data.chatMetadata || {}) as Record<string, unknown>,
          (data.leadData || {}) as Record<string, unknown>,
          (data.dynamicData || {}) as Record<string, unknown>,
        );
        logToolCalls(log, data.toolCalls);
        log("\u2190 reply received", "log-success");
        if (data.leadSubmitted)
          log("Lead submitted to Salesforce!", "log-success");
      }
    } catch (e) {
      setTyping(false);
      log(`Request failed: ${(e as Error).message}`, "log-error");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "\u26A0 Connection error. Is the server running?",
        },
      ]);
    }

    setIsSending(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [
    isSending, log, setSessionAndStore, updateSlots, updateRaw, autoResize,
    textareaRef, sessionIdRef, setMessages, setTyping, setIsSending,
  ]);

  const sendSuggestedPrompt = useCallback(
    async (text: string) => {
      const input = textareaRef.current;
      if (!input || isSending) return;
      if (!inputEnabled) {
        const ok = await newSession();
        if (!ok) return;
      }
      const trimmed = text.trim();
      if (!trimmed) return;
      input.value = trimmed;
      autoResize();
      await sendMessage();
    },
    [isSending, inputEnabled, newSession, sendMessage, autoResize, textareaRef],
  );

  const refreshCache = useCallback(async () => {
    setRefreshBusy(true);
    log(`\u2192 POST ${API_ROUTES.cacheRefresh}`, "log-dim");
    try {
      const { res, data } = await refreshCacheApi();
      if (res.ok) {
        log(
          `Cache refreshed at ${data.timestamp || new Date().toISOString()}`,
          "log-success",
        );
        const { data: g } = await fetchGreeting();
        if (g.message) greeting.setCachedGreeting(g.message);
      } else {
        log(`Cache refresh failed: ${data.error || res.status}`, "log-error");
      }
    } catch (e) {
      log(`Cache refresh error: ${(e as Error).message}`, "log-error");
    }
    setRefreshBusy(false);
  }, [log, greeting]);

  return { sendMessage, sendSuggestedPrompt, refreshCache, refreshBusy };
}
