"use client";

import { getApiBase } from "@/lib/api-base";
import { applySalesAgentApiKey } from "@/lib/sales-agent-auth";
import { logToolCalls } from "@/lib/chat/log-tool-calls";
import {
  loadStoredSessions,
  persistSessions,
  sessionTitle,
} from "@/lib/chat/sessions";
import type {
  ChatApiResponse,
  ChatMessage,
  SessionApiResponse,
  StoredSession,
} from "@/lib/chat-types";
import {
  clearStoredTokens,
  getCognitoLogoutUrl,
  getStoredTokens,
  parseJwtPayload,
} from "@/lib/cognito";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_ASSISTANT_GREETING =
  "Hi there 👋\nYou are now speaking with Innovi. How can I help?";

export function useSalesAgentChat() {
  const apiBase = getApiBase();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Keeps latest session id for fetch bodies (avoids stale closure after `await newSession()`). */
  const sessionIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("Not started");
  const [cachedGreeting, setCachedGreeting] = useState<string | null>(null);
  const [, setSlots] = useState<Record<string, unknown>>({});
  const [, setLeadSubmitted] = useState(false);
  const [, setChatMetadata] = useState<Record<string, unknown>>({});
  const [, setLeadData] = useState<Record<string, unknown>>({});
  const [, setDynamicData] = useState<Record<string, unknown>>({});
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [initials, setInitials] = useState("?");
  const [heroLine, setHeroLine] = useState("Good day.");
  const [heroSub] = useState("");
  const [isSending, setIsSending] = useState(false);
  /** Matches `index.html`: disabled until a session is created or loaded. */
  const [inputEnabled, setInputEnabled] = useState(false);
  const didAutoCreateRef = useRef(false);

  const log = useCallback((msg: string, _cls?: string) => {
    void _cls; // for optional class tags used by callers
    if (process.env.NODE_ENV === "development") {
      console.debug(`[sales-agent] ${msg}`);
    }
  }, []);

  const authHeaders = useCallback(
    (extra?: HeadersInit) => {
      const h = new Headers(extra);
      h.set("Content-Type", "application/json");
      applySalesAgentApiKey(h);
      const t = getStoredTokens();
      if (t?.id_token) h.set("Authorization", `Bearer ${t.id_token}`);
      return h;
    },
    [],
  );

  useEffect(() => {
    startTransition(() => {
      setStoredSessions(loadStoredSessions());
    });
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const t = getStoredTokens();
    let display = "there";
    if (t?.id_token) {
      const claims = parseJwtPayload(t.id_token);
      display =
        (claims.name as string) ||
        (claims.email as string) ||
        (claims["cognito:username"] as string) ||
        "there";
    }
    const hour = new Date().getHours();
    let greet = "Good day";
    if (hour < 12) greet = "Good morning";
    else if (hour < 18) greet = "Good afternoon";
    else greet = "Good evening";
    startTransition(() => {
      // Keep the default copy short; only tweak punctuation for the "there" case.
      setHeroLine(`${greet}, ${display}${display === "there" ? "!" : "."}`);
      const ini = display
        .split(/\s|@/)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      setInitials(ini || "?");
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/greeting`, {
          headers: authHeaders(),
        });
        const data = (await res.json()) as { message?: string };
        if (data.message) setCachedGreeting(data.message);
      } catch {
        /* ignore */
      }
    })();
  }, [apiBase, authHeaders]);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    let list = storedSessions;
    if (q) {
      list = list.filter(
        (s) =>
          sessionTitle(s).toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [storedSessions, sessionSearch]);

  const hasMessages = messages.length > 0;

  const updateSlotsFromResponse = useCallback(
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

  const pushSession = useCallback((id: string, titleHint: string) => {
    const next = loadStoredSessions().filter((s) => s.id !== id);
    next.unshift({
      id,
      createdAt: Date.now(),
      userId: null,
      title: titleHint,
    });
    persistSessions(next);
    setStoredSessions(next);
  }, []);

  const setSessionAndStore = useCallback(
    (id: string, firstUserMessage?: string, isNew?: boolean) => {
      setSessionId(id);
      setSessionLabel(id);
      if (isNew) {
        const hint =
          firstUserMessage && firstUserMessage.length > 48
            ? firstUserMessage.slice(0, 45) + "…"
            : firstUserMessage || "";
        pushSession(id, hint);
      } else {
        setStoredSessions(loadStoredSessions());
      }
    },
    [pushSession],
  );

  const newSession = useCallback(async (): Promise<boolean> => {
    if (isSending) return false;
    setIsSending(true);
    setInputEnabled(false);
    setMessages([]);
    updateSlotsFromResponse({}, false);
    updateRaw({}, {}, {});
    setSessionId(null);
    sessionIdRef.current = null;
    setSessionLabel("Creating…");
    setStoredSessions(loadStoredSessions());

    log(`→ POST /api/session`, "log-dim");
    try {
      const res = await fetch(`${apiBase}/api/session`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = (await res.json()) as { sessionId?: string; error?: string };
      if (!res.ok) {
        log(`HTTP ${res.status}: ${data.error || JSON.stringify(data)}`, "log-error");
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
      setMessages([{ role: "assistant", content: DEFAULT_ASSISTANT_GREETING }]);
      setIsSending(false);
      return true;
    } catch (e) {
      log(`Failed to create session: ${(e as Error).message}`, "log-error");
      setSessionLabel("Error creating session");
      setIsSending(false);
      return false;
    }
  }, [
    isSending,
    apiBase,
    authHeaders,
    log,
    cachedGreeting,
    setSessionAndStore,
    updateRaw,
    updateSlotsFromResponse,
  ]);

  const loadSession = useCallback(
    async (id: string): Promise<boolean> => {
      if (isSending) return false;
      log(`Loading session ${id}…`, "log-info");
      try {
        const res = await fetch(`${apiBase}/api/session/${id}`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          log(`Session not found: ${id}`, "log-error");
          return false;
        }
        const data = (await res.json()) as SessionApiResponse;
        setMessages([]);
        sessionIdRef.current = id;
        setSessionId(id);
        setSessionLabel(id);
        setStoredSessions(loadStoredSessions());

        const msgs = data.messages || [];
        setMessages(msgs);

        const merged = {
          ...(data.leadData || {}),
          ...(data.dynamicData || {}),
        };
        const submitted = Boolean(
          (data.chatMetadata as { submitted?: boolean } | undefined)?.submitted,
        );
        updateSlotsFromResponse(merged, submitted);
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
    [apiBase, authHeaders, isSending, log, updateRaw, updateSlotsFromResponse],
  );

  // On first load: restore the most recent stored session (if any),
  // otherwise create a brand new one.
  useEffect(() => {
    if (didAutoCreateRef.current) return;
    if (inputEnabled) return;
    didAutoCreateRef.current = true;
    void (async () => {
      // Defer so React doesn't see synchronous state updates during the effect body.
      await Promise.resolve();
      const sessions = loadStoredSessions();
      if (sessions.length > 0) {
        const ok = await loadSession(sessions[0]!.id);
        if (!ok) {
          void newSession();
        }
      } else {
        void newSession();
      }
    })();
  }, [inputEnabled, loadSession, newSession]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  const deleteSession = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await fetch(`${apiBase}/api/session/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
      } catch {
        /* best-effort */
      }
      const next = loadStoredSessions().filter((s) => s.id !== id);
      persistSessions(next);
      setStoredSessions(next);
      if (id === sessionId) {
        sessionIdRef.current = null;
        setSessionId(null);
        setMessages([]);
        updateSlotsFromResponse({}, false);
        updateRaw({}, {}, {});
        setSessionLabel("Not started");
        setInputEnabled(false);
        log("Active session deleted", "log-info");
      }
    },
    [apiBase, authHeaders, sessionId, log, updateRaw, updateSlotsFromResponse],
  );

  const sendMessage = useCallback(async () => {
    const input = textareaRef.current;
    if (!input) return;
    const message = input.value.trim();
    if (!message || isSending) return;

    setIsSending(true);
    input.value = "";
    autoResize();
    setMessages((m) => [...m, { role: "user", content: message }]);
    setTyping(true);

    const body: { message: string; sessionId?: string } = { message };
    const sidForChat = sessionIdRef.current;
    if (sidForChat) body.sessionId = sidForChat;
    log(`→ POST /api/chat | session=${sidForChat || "new"}`, "log-dim");

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ChatApiResponse;
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
              "⚠ Hourly token limit reached. Please wait before sending more messages.",
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
            content: `⚠ Error: ${data.error || "Unknown error"}`,
          },
        ]);
      } else {
        const isNewSession = data.sessionId !== sidForChat;
        setSessionAndStore(data.sessionId, message, isNewSession);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply || "(empty response)" },
        ]);
        updateSlotsFromResponse(
          (data.slots || {}) as Record<string, unknown>,
          Boolean(data.leadSubmitted),
        );
        updateRaw(
          (data.chatMetadata || {}) as Record<string, unknown>,
          (data.leadData || {}) as Record<string, unknown>,
          (data.dynamicData || {}) as Record<string, unknown>,
        );
        logToolCalls(log, data.toolCalls);
        log("← reply received", "log-success");
        if (data.leadSubmitted) log("Lead submitted to Salesforce!", "log-success");
      }
    } catch (e) {
      setTyping(false);
      log(`Request failed: ${(e as Error).message}`, "log-error");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "⚠ Connection error. Is the server running?",
        },
      ]);
    }

    setIsSending(false);
    // Ensure focus is restored after state updates/rerender.
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [
    isSending,
    apiBase,
    authHeaders,
    log,
    setSessionAndStore,
    updateRaw,
    updateSlotsFromResponse,
    autoResize,
    textareaRef,
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
    [isSending, inputEnabled, newSession, sendMessage, autoResize],
  );

  const refreshCache = useCallback(async () => {
    setRefreshBusy(true);
    log("→ POST /api/cache/refresh", "log-dim");
    try {
      const res = await fetch(`${apiBase}/api/cache/refresh`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = (await res.json()) as { timestamp?: string; error?: string };
      if (res.ok) {
        log(
          `Cache refreshed at ${data.timestamp || new Date().toISOString()}`,
          "log-success",
        );
        const g = await fetch(`${apiBase}/api/greeting`, {
          headers: authHeaders(),
        });
        const gj = (await g.json()) as { message?: string };
        if (gj.message) setCachedGreeting(gj.message);
      } else {
        log(`Cache refresh failed: ${data.error || res.status}`, "log-error");
      }
    } catch (e) {
      log(`Cache refresh error: ${(e as Error).message}`, "log-error");
    }
    setRefreshBusy(false);
  }, [apiBase, authHeaders, log]);

  const signOut = useCallback(() => {
    clearStoredTokens();
    const url = getCognitoLogoutUrl();
    if (url) window.location.assign(url);
  }, []);

  return {
    refs: { textareaRef },
    initials,
    showSearch,
    setShowSearch,
    sessionSearch,
    setSessionSearch,
    filteredSessions,
    sessionId,
    userId: "",
    sessionLabel,
    refreshBusy,
    showSignOut: false,
    hasMessages,
    heroLine,
    heroSub,
    messages,
    typing,
    inputEnabled,
    isSending,
    newSession,
    loadSession,
    deleteSession,
    sendMessage,
    sendSuggestedPrompt,
    refreshCache,
    signOut,
    autoResize,
    syncSessionsFromStorage: () => setStoredSessions(loadStoredSessions()),
  };
}
