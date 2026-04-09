"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { useCallback, useEffect, useRef, useState } from "react";

export function useChatState() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const didAutoCreateRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("Not started");
  const [isSending, setIsSending] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);

  const [, setSlots] = useState<Record<string, unknown>>({});
  const [, setLeadSubmitted] = useState(false);
  const [, setChatMetadata] = useState<Record<string, unknown>>({});
  const [, setLeadData] = useState<Record<string, unknown>>({});
  const [, setDynamicData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const log = useCallback((msg: string, _cls?: string) => {
    void _cls;
    if (process.env.NODE_ENV === "development")
      console.debug(`[sales-agent] ${msg}`);
  }, []);

  const updateSlots = useCallback(
    (s: Record<string, unknown> | undefined, submitted: boolean) => {
      setSlots(s || {});
      setLeadSubmitted(submitted);
    },
    [],
  );

  const updateRaw = useCallback(
    (
      meta: Record<string, unknown>,
      lead: Record<string, unknown>,
      dyn: Record<string, unknown>,
    ) => {
      setChatMetadata(meta);
      setLeadData(lead);
      setDynamicData(dyn);
    },
    [],
  );

  const resetState = useCallback(() => {
    setMessages([]);
    updateSlots({}, false);
    updateRaw({}, {}, {});
    didAutoCreateRef.current = false;
  }, [updateSlots, updateRaw]);

  const markAutoCreated = useCallback(() => {
    didAutoCreateRef.current = true;
  }, []);

  const hasAutoCreated = useCallback(() => didAutoCreateRef.current, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  return {
    textareaRef,
    sessionIdRef,
    markAutoCreated,
    hasAutoCreated,
    messages,
    setMessages,
    typing,
    setTyping,
    sessionId,
    setSessionId,
    sessionLabel,
    setSessionLabel,
    isSending,
    setIsSending,
    inputEnabled,
    setInputEnabled,
    log,
    updateSlots,
    updateRaw,
    resetState,
    autoResize,
  };
}

export type ChatState = ReturnType<typeof useChatState>;
