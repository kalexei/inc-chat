"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getApiBase } from "@/lib/api-base";
import {
  SLOT_FIELDS,
  STORAGE_KEY,
  TOOL_ICONS,
  USER_ID_KEY,
} from "@/lib/chat-constants";
import type {
  ChatApiResponse,
  ChatMessage,
  SessionApiResponse,
  StoredSession,
  ToolCall,
} from "@/lib/chat-types";
import {
  clearStoredTokens,
  cognitoAuthEnabled,
  getCognitoLogoutUrl,
  getStoredTokens,
  parseJwtPayload,
} from "@/lib/cognito";

function truncate(str: string, max = 200) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function fmtJson(obj: unknown, truncateStrings = false): string {
  if (obj == null) return "null";
  try {
    if (truncateStrings) {
      const walk = (v: unknown): unknown => {
        if (typeof v === "string") return truncate(v, 120);
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === "object") {
          const r: Record<string, unknown> = {};
          for (const k of Object.keys(v as object))
            r[k] = walk((v as Record<string, unknown>)[k]);
          return r;
        }
        return v;
      };
      return JSON.stringify(walk(obj), null, 2);
    }
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function formatAge(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function sessionTitle(s: StoredSession) {
  if (s.title) return s.title;
  const id = s.id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function loadStoredSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions: StoredSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
}

export function ChatApp() {
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
  const [chatMetadata, setChatMetadata] = useState<Record<string, unknown>>({});
  const [leadData, setLeadData] = useState<Record<string, unknown>>({});
  const [dynamicData, setDynamicData] = useState<Record<string, unknown>>({});
  const [logLines, setLogLines] = useState<
    { id: number; text: string; cls?: string }[]
  >([]);
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
      if (sub) {
        setUserId(sub);
      } else if (saved) {
        setUserId(saved);
      }
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

  const renderToolCalls = useCallback(
    (toolCalls: ToolCall[] | undefined) => {
      if (!toolCalls?.length) {
        log("  (no tool calls this turn)", "log-dim");
        return;
      }
      for (const call of toolCalls) {
        const icon = TOOL_ICONS[call.tool] || "🔧";
        log(`${icon} ${call.tool}`, "log-tool");
        if (call.input && Object.keys(call.input).length > 0) {
          const inputDisplay = { ...call.input };
          delete inputDisplay.sessionId;
          log(
            `  ↳ input:  ${fmtJson(inputDisplay).replace(/\n/g, "\n           ")}`,
            "log-tool-data",
          );
        }
        if (call.output != null) {
          let outputVal: unknown = call.output;
          if (typeof outputVal === "string") {
            try {
              outputVal = JSON.parse(outputVal);
            } catch {
              /* keep string */
            }
          }
          log(
            `  ↳ output: ${fmtJson(outputVal, true).replace(/\n/g, "\n           ")}`,
            "log-tool-data",
          );
        }
      }
    },
    [log],
  );

  const pushSession = useCallback(
    (id: string, titleHint: string, uid: string) => {
      const next = loadStoredSessions().filter((s) => s.id !== id);
      next.unshift({
        id,
        createdAt: Date.now(),
        userId: uid || null,
        title: titleHint,
      });
      persistSessions(next);
      setStoredSessions(next);
    },
    [],
  );

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
        log(
          `HTTP ${res.status}: ${data.error || JSON.stringify(data)}`,
          "log-error",
        );
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
        renderToolCalls(data.toolCalls);
        log("← reply received", "log-success");
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
    renderToolCalls,
    autoResize,
  ]);

  const refreshCache = useCallback(async () => {
    setRefreshBusy(true);
    log("→ POST /api/cache/refresh", "log-dim");
    try {
      const res = await fetch(`${apiBase}/api/cache/refresh`, {
        method: "POST",
      });
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

  const showSignOut = cognitoAuthEnabled();

  return (
    <div className="rak-app rak-app--visible">
      <aside className="rail" aria-label="Primary">
        <div className="rail-logo" title="RAK INC" />
        <button
          type="button"
          className="rail-btn"
          title="New chat"
          onClick={() => void newSession()}
        >
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          type="button"
          className="rail-btn"
          title="Search chats"
          onClick={() => {
            setShowSearch((v) => !v);
          }}
        >
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="rail-btn"
          title="Library / lead fields"
          onClick={() => {
            devRef.current?.scrollIntoView({ behavior: "smooth" });
            if (devRef.current) devRef.current.open = true;
          }}
        >
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </button>
        <div className="rail-spacer" />
        <button type="button" className="rail-account" title="Account">
          {initials}
        </button>
      </aside>

      <div className="main-col">
        <div className="main-topbar">
          <button
            type="button"
            className="icon-btn"
            title="Tools & session"
            onClick={() => {
              if (devRef.current) devRef.current.open = !devRef.current.open;
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        <div className="main-scroll">
          <div className={`hero-block${hasMessages ? " hidden" : ""}`}>
            <div className="hero-orb" aria-hidden />
            <p className="hero-greeting">
              {heroLine} <span>{heroSub}</span>
            </p>
          </div>

          <div
            className={`messages-wrap${hasMessages ? " visible" : " empty"}`}
          >
            <div>
              {messages.map((m, i) => (
                <div key={`${i}-${m.role}`} className={`msg ${m.role}`}>
                  <div className="msg-label">
                    {m.role === "user" ? "You" : "Sales Agent"}
                  </div>
                  <div className="msg-bubble">{m.content}</div>
                </div>
              ))}
              {typing && (
                <div className="msg assistant typing">
                  <div className="msg-bubble">Agent is thinking…</div>
                </div>
              )}
            </div>
          </div>

          <div className="composer-card">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="What's on your mind?"
              disabled={!inputEnabled}
              onInput={() => autoResize()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <div className="composer-actions">
              <div className="composer-left">
                <button
                  type="button"
                  className="icon-btn"
                  title="New session"
                  onClick={() => void newSession()}
                >
                  <svg
                    width={20}
                    height={20}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Voice (placeholder)"
                  disabled
                  style={{ opacity: 0.35 }}
                >
                  <svg
                    width={20}
                    height={20}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="btn-generate"
                disabled={isSending || !inputEnabled}
                onClick={() => void sendMessage()}
              >
                <span>Send</span>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="quick-cards">
            <button
              type="button"
              className="quick-card"
              onClick={() => {
                void newSession();
                textareaRef.current?.focus();
              }}
            >
              <h3>New conversation</h3>
              <p>Start a fresh session with the agent</p>
            </button>
            <button
              type="button"
              className="quick-card"
              onClick={() => textareaRef.current?.focus()}
            >
              <h3>Continue chat</h3>
              <p>Type below to message the sales agent</p>
            </button>
            <button
              type="button"
              className="quick-card"
              onClick={() => {
                if (devRef.current) devRef.current.open = true;
              }}
            >
              <h3>Lead slots</h3>
              <p>Open the developer panel on the right</p>
            </button>
            <button
              type="button"
              className="quick-card"
              onClick={() => void refreshCache()}
            >
              <h3>Refresh knowledge</h3>
              <p>Reload RAG cache from the server</p>
            </button>
          </div>
        </div>
      </div>

      <aside className="history-col" aria-label="Chats and tools">
        <div className="history-header">Chats</div>
        {showSearch && (
          <div className="chat-search">
            <input
              type="search"
              placeholder="Search sessions…"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <div className="sessions-list">
          {filteredSessions.length === 0 ? (
            <span className="sessions-empty">
              {sessionSearch.trim()
                ? "No matching chats"
                : userId.trim()
                  ? "No chats for this user"
                  : "No chats yet"}
            </span>
          ) : (
            filteredSessions.map((s) => (
              <div
                key={s.id}
                className={`session-item${s.id === sessionId ? " active" : ""}`}
                title={s.userId ? `${s.id} · ${s.userId}` : s.id}
                onClick={() => void loadSession(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void loadSession(s.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="session-item-dot" />
                <div className="session-item-body">
                  <div className="session-item-title">{sessionTitle(s)}</div>
                  <div className="session-item-sub">
                    {formatAge(s.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="session-delete-btn"
                  title="Delete"
                  onClick={(e) => void deleteSession(s.id, e)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <details className="dev-accordion" ref={devRef} id="devDetails">
          <summary>Developer</summary>
          <div className="dev-panels">
            <div className="panel-block">
              <h2>Lead slots</h2>
              <table className="slots-table">
                <tbody>
                  {SLOT_FIELDS.map((field) => {
                    const val = slots[field];
                    const has =
                      val !== null && val !== undefined && String(val) !== "";
                    const label =
                      field === "countryCode"
                        ? "countryCode (opt)"
                        : field === "preferredContactMethod"
                          ? "preferredContact (opt)"
                          : field === "nationality"
                            ? "nationality (opt)"
                            : field === "licenseType"
                              ? "licenseType (opt)"
                              : field === "package"
                                ? "package (opt)"
                                : field === "needUAEVisa"
                                  ? "needUAEVisa (opt)"
                                  : field === "totalNumberOfVisa"
                                    ? "totalVisas (opt)"
                                    : field;
                    return (
                      <tr key={field}>
                        <td>{label}</td>
                        <td className={has ? "slot-filled" : "slot-empty"}>
                          {has ? String(val) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {leadSubmitted && (
                <div>
                  <span className="submitted-badge">Lead submitted</span>
                </div>
              )}
            </div>
            <div className="panel-block">
              <h2>Session</h2>
              <div className="user-input-row">
                <label htmlFor="userIdInput">User ID</label>
                <input
                  id="userIdInput"
                  className="user-id-input"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setStoredSessions(loadStoredSessions());
                  }}
                  placeholder="X-User-Id header"
                  autoComplete="off"
                />
                {userId.trim() && (
                  <span className="user-active-badge">
                    {userId.length > 14 ? `${userId.slice(0, 12)}…` : userId}
                  </span>
                )}
              </div>
              <div className="rate-limit-note">
                Sent as X-User-Id — auto-filled from Cognito when signed in
              </div>
              <div className="session-id-display">{sessionLabel}</div>
              <button
                type="button"
                className="btn-small danger"
                onClick={() => void newSession()}
              >
                New session
              </button>
              <button
                type="button"
                className="btn-small"
                disabled={refreshBusy}
                onClick={() => void refreshCache()}
              >
                {refreshBusy ? "Refreshing…" : "Refresh cache"}
              </button>
              {showSignOut && (
                <button type="button" className="btn-small" onClick={signOut}>
                  Sign out
                </button>
              )}
            </div>
            <div className="panel-block">
              <h2>Session data</h2>
              <div className="raw-data-label">Chat metadata</div>
              <pre className="raw-json">{fmtJson(chatMetadata)}</pre>
              <div className="raw-data-label">Lead data</div>
              <pre className="raw-json">{fmtJson(leadData)}</pre>
              <div className="raw-data-label">Dynamic data</div>
              <pre className="raw-json">{fmtJson(dynamicData)}</pre>
            </div>
            <div className="panel-block">
              <h2>Debug log</h2>
              <div className="rak-log-output">
                {logLines.map((line) => (
                  <span key={line.id} className={line.cls}>
                    {line.text}
                    {"\n"}
                  </span>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </details>
      </aside>
    </div>
  );
}
