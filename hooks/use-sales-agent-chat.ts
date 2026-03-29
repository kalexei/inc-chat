"use client";

import { getApiBase } from "@/lib/api-base";
import { USER_ID_KEY } from "@/lib/chat-constants";
import { logToolCalls } from "@/lib/chat/log-tool-calls";
import {
  formatSessionAge,
  loadStoredSessions,
  persistSessions,
  sessionTitle,
} from "@/lib/chat/sessions";
import type {
  ChatApiResponse,
  ChatMessage,
  LogLine,
  SessionApiResponse,
  StoredSession,
} from "@/lib/chat-types";
import {
  clearStoredTokens,
  cognitoAuthEnabled,
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

export function useSalesAgentChat() {
  const apiBase = getApiBase();
  const devRef = useRef<HTMLDetailsElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("Not started");
  const [userId, setUserId] = useState("");
  const [inputEnabled, setInputEnabled] = useState(false);
  const [cachedGreeting, setCachedGreeting] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, unknown>>({});
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [chatMetadata, setChatMetadata] = useState<Record<string, unknown>>(
    {},
  );
  const [leadData, setLeadData] = useState<Record<string, unknown>>({});
  const [dynamicData, setDynamicData] = useState<Record<string, unknown>>({});
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const logId = useRef(0);
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [initials, setInitials] = useState("?");
  const [heroLine, setHeroLine] = useState("Good day.");
  const [heroSub, setHeroSub] = useState(
    "Start a chat or pick a conversation.",
  );
  const [isSending, setIsSending] = useState(false);

  const log = useCallback((msg: string, cls?: string) => {
    const ts = new Date().toISOString().substring(11, 23);
    const id = ++logId.current;
    setLogLines((prev) =>
      [...prev, { id, text: `[${ts}] ${msg}`, cls }].slice(-300),
    );
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  const authHeaders = useCallback(
    (extra?: HeadersInit) => {
      const h = new Headers(extra);
      h.set("Content-Type", "application/json");
      if (userId.trim()) h.set("X-User-Id", userId.trim());
      const t = getStoredTokens();
      if (t?.id_token) h.set("Authorization", `Bearer ${t.id_token}`);
      return h;
    },
    [userId],
  );

  useEffect(() => {
    startTransition(() => {
      setStoredSessions(loadStoredSessions());
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(USER_ID_KEY, userId);
  }, [userId]);

  useEffect(() => {
    const t = getStoredTokens();
    let display = "there";
    let sub = "";
    if (t?.id_token) {
      const claims = parseJwtPayload(t.id_token);
      display =
        (claims.name as string) ||
        (claims.email as string) ||
        (claims["cognito:username"] as string) ||
        "there";
      sub = (claims.sub as string) || "";
    }
    const hour = new Date().getHours();
    let greet = "Good day";
    if (hour < 12) greet = "Good morning";
    else if (hour < 18) greet = "Good afternoon";
    else greet = "Good evening";
    const saved = localStorage.getItem(USER_ID_KEY) || "";
    startTransition(() => {
      setHeroLine(`${greet}, ${display}.`);
      setHeroSub("How can the sales agent help you today?");
      const ini = display
        .split(/\s|@/)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      setInitials(ini || "?");
      if (sub) setUserId(sub);
      else if (saved) setUserId(saved);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/greeting`);
        const data = (await res.json()) as { message?: string };
        if (data.message) setCachedGreeting(data.message);
      } catch {
        /* ignore */
      }
    })();
  }, [apiBase]);

  const filteredSessions = useMemo(() => {
    const uid = userId.trim();
    const q = sessionSearch.trim().toLowerCase();
    let list = uid
      ? storedSessions.filter((s) => !s.userId || s.userId === uid)
      : storedSessions;
    if (q) {
      list = list.filter(
        (s) =>
          sessionTitle(s).toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [storedSessions, userId, sessionSearch]);

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

  const pushSession = useCallback((id: string, titleHint: string, uid: string) => {
    const next = loadStoredSessions().filter((s) => s.id !== id);
    next.unshift({
      id,
      createdAt: Date.now(),
      userId: uid || null,
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
        pushSession(id, hint, userId.trim());
      } else {
        setStoredSessions(loadStoredSessions());
      }
    },
    [pushSession, userId],
  );

  const newSession = useCallback(async () => {
    if (isSending) return;
    setIsSending(true);
    setMessages([]);
    updateSlotsFromResponse({}, false);
    updateRaw({}, {}, {});
    setLogLines([]);
    setSessionId(null);
    setSessionLabel("Creating…");
    setStoredSessions(loadStoredSessions());

    const uid = userId.trim();
    log(`→ POST /api/session${uid ? ` | userId=${uid}` : ""}`, "log-dim");
    try {
      const res = await fetch(`${apiBase}/api/session`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = (await res.json()) as { sessionId?: string; error?: string };
      if (!res.ok) {
        log(`HTTP ${res.status}: ${data.error || JSON.stringify(data)}`, "log-error");
        setSessionLabel("Error");
        setIsSending(false);
        return;
      }
      setSessionAndStore(data.sessionId!, "", true);
      setInputEnabled(true);
      log(`Session created: ${data.sessionId}`, "log-success");
      if (cachedGreeting) {
        setMessages([{ role: "assistant", content: cachedGreeting }]);
      }
    } catch (e) {
      log(`Failed to create session: ${(e as Error).message}`, "log-error");
      setSessionLabel("Error");
    }
    setIsSending(false);
  }, [
    isSending,
    apiBase,
    authHeaders,
    log,
    cachedGreeting,
    setSessionAndStore,
    updateRaw,
    updateSlotsFromResponse,
    userId,
  ]);

  const loadSession = useCallback(
    async (id: string) => {
      if (isSending) return;
      log(`Loading session ${id}…`, "log-info");
      try {
        const res = await fetch(`${apiBase}/api/session/${id}`);
        if (!res.ok) {
          log(`Session not found: ${id}`, "log-error");
          return;
        }
        const data = (await res.json()) as SessionApiResponse;
        setMessages([]);
        setLogLines([]);
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
      } catch (e) {
        log(`Failed to load session: ${(e as Error).message}`, "log-error");
      }
    },
    [apiBase, isSending, log, updateRaw, updateSlotsFromResponse],
  );

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
        await fetch(`${apiBase}/api/session/${id}`, { method: "DELETE" });
      } catch {
        /* best-effort */
      }
      const next = loadStoredSessions().filter((s) => s.id !== id);
      persistSessions(next);
      setStoredSessions(next);
      if (id === sessionId) {
        setSessionId(null);
        setMessages([]);
        setLogLines([]);
        updateSlotsFromResponse({}, false);
        updateRaw({}, {}, {});
        setSessionLabel("Not started");
        setInputEnabled(false);
        log("Active session deleted", "log-info");
      }
    },
    [apiBase, sessionId, log, updateRaw, updateSlotsFromResponse],
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
    if (sessionId) body.sessionId = sessionId;
    const uid = userId.trim();
    log(
      `→ POST /api/chat | session=${sessionId || "new"}${uid ? ` | userId=${uid}` : ""}`,
      "log-dim",
    );

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
          `Token budget exceeded for user "${uid || "?"}": ${data.message || data.error}`,
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
        const isNewSession = data.sessionId !== sessionId;
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
    input.focus();
  }, [
    isSending,
    sessionId,
    userId,
    apiBase,
    authHeaders,
    log,
    setSessionAndStore,
    updateRaw,
    updateSlotsFromResponse,
    autoResize,
  ]);

  const refreshCache = useCallback(async () => {
    setRefreshBusy(true);
    log("→ POST /api/cache/refresh", "log-dim");
    try {
      const res = await fetch(`${apiBase}/api/cache/refresh`, { method: "POST" });
      const data = (await res.json()) as { timestamp?: string; error?: string };
      if (res.ok) {
        log(
          `Cache refreshed at ${data.timestamp || new Date().toISOString()}`,
          "log-success",
        );
        const g = await fetch(`${apiBase}/api/greeting`);
        const gj = (await g.json()) as { message?: string };
        if (gj.message) setCachedGreeting(gj.message);
      } else {
        log(`Cache refresh failed: ${data.error || res.status}`, "log-error");
      }
    } catch (e) {
      log(`Cache refresh error: ${(e as Error).message}`, "log-error");
    }
    setRefreshBusy(false);
  }, [apiBase, log]);

  const signOut = useCallback(() => {
    clearStoredTokens();
    const url = getCognitoLogoutUrl();
    if (url) window.location.assign(url);
  }, []);

  const openDeveloperPanel = useCallback(() => {
    devRef.current?.scrollIntoView({ behavior: "smooth" });
    if (devRef.current) devRef.current.open = true;
  }, []);

  const toggleDeveloperPanel = useCallback(() => {
    if (devRef.current) devRef.current.open = !devRef.current.open;
  }, []);

  return {
    refs: { devRef, textareaRef, logEndRef },
    initials,
    showSearch,
    setShowSearch,
    sessionSearch,
    setSessionSearch,
    filteredSessions,
    sessionId,
    userId,
    setUserId,
    sessionLabel,
    refreshBusy,
    showSignOut: cognitoAuthEnabled(),
    hasMessages,
    heroLine,
    heroSub,
    messages,
    typing,
    inputEnabled,
    isSending,
    slots,
    leadSubmitted,
    chatMetadata,
    leadData,
    dynamicData,
    logLines,
    newSession,
    loadSession,
    deleteSession,
    sendMessage,
    refreshCache,
    signOut,
    autoResize,
    openDeveloperPanel,
    toggleDeveloperPanel,
    syncSessionsFromStorage: () => setStoredSessions(loadStoredSessions()),
  };
}
