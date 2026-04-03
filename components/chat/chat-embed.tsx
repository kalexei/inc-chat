"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { InnoviFab, type InnoviState } from "./innovi-fab";

export function ChatEmbed() {
  const chat = useSalesAgentChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const { textareaRef } = chat.refs;
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  // Height the host page tells us is available (viewport - bottom offset).
  // Null = no parent frame (direct /embed visit) → use generous default.
  const [availHeight, setAvailHeight] = useState<number | null>(null);
  const embedId = "rak-inc-chat";

  // ─── Single wrapper ref — ResizeObserver watches this for auto iframe sizing ──
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);
  const hasBubbleRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // ─── Innovi state ─────────────────────────────────────────────────────────────
  const [innoviState, setInnoviState] = useState<InnoviState>("neutral");
  const prevTypingRef = useRef(false);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isError = chat.sessionLabel.toLowerCase().includes("error");
    if (isError) {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      prevTypingRef.current = false;
      setInnoviState("error");
      return;
    }

    const isThinking = chat.typing || chat.isSending;
    if (isThinking) {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      prevTypingRef.current = true;
      setInnoviState("thinking");
      return;
    }

    if (prevTypingRef.current) {
      prevTypingRef.current = false;
      setInnoviState("speaking");
      speakingTimerRef.current = setTimeout(() => {
        speakingTimerRef.current = null;
        setInnoviState(isOpenRef.current ? "happy" : "neutral");
      }, 2500);
      return;
    }

    if (!speakingTimerRef.current) {
      setInnoviState(isOpen ? "happy" : "neutral");
    }
  }, [chat.typing, chat.isSending, chat.sessionLabel, isOpen]);

  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
  }, []);

  // ─── Bubble message ───────────────────────────────────────────────────────────
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const hasOpenedRef = useRef(false);
  const chatMessagesRef = useRef(chat.messages);
  useEffect(() => {
    chatMessagesRef.current = chat.messages;
  }, [chat.messages]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasOpenedRef.current && !bubbleDismissed) {
        setBubbleText(
          "Hi! I'm Innovi 👋 — ask me anything about Innovation City.",
        );
      }
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      setBubbleText(null);
    } else if (hasOpenedRef.current && !bubbleDismissed) {
      const lastAsst = [...chatMessagesRef.current]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAsst) {
        const plain = lastAsst.content
          .replace(/\|[^\n]*/g, "")
          .replace(/[*#`_~[\]]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        setBubbleText(plain.slice(0, 72) + (plain.length > 72 ? "…" : ""));
      }
    }
  }, [isOpen, bubbleDismissed]);

  // ─── Background transparency ──────────────────────────────────────────────────
  const skipRestoreOnceRef = useRef(true);

  useLayoutEffect(() => {
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    const prevHtmlBgColor = document.documentElement.style.backgroundColor;
    const prevBodyBgColor = document.body.style.backgroundColor;
    const prevHtmlBgImg = document.documentElement.style.backgroundImage;
    const prevBodyBgImg = document.body.style.backgroundImage;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.documentElement.style.setProperty(
      "background-color",
      "transparent",
      "important",
    );
    document.body.style.setProperty(
      "background-color",
      "transparent",
      "important",
    );
    document.documentElement.style.backgroundImage = "none";
    document.body.style.backgroundImage = "none";
    return () => {
      if (skipRestoreOnceRef.current) {
        skipRestoreOnceRef.current = false;
        return;
      }
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBgColor;
      document.body.style.backgroundColor = prevBodyBgColor;
      document.documentElement.style.backgroundImage = prevHtmlBgImg;
      document.body.style.backgroundImage = prevBodyBgImg;
    };
  }, []);

  // Listen for the host page telling us how much vertical space is available.
  // The parent sends this after the iframe loads and on every window resize.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data as { source?: string; availHeight?: number } | undefined;
      if (data?.source === "rak-inc-chat-host" && typeof data.availHeight === "number") {
        setAvailHeight(data.availHeight);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(
      () => setShouldRenderPanel(isOpen),
      isOpen ? 0 : 260,
    );
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // ─── Auto iframe sizing via ResizeObserver ────────────────────────────────────
  // The wrapper is a single fixed container holding both the chat panel and FAB.
  // When the wrapper's rendered size changes (panel open/close, bubble in/out),
  // we postMessage the exact pixel dimensions to the parent frame, which applies
  // them directly — no hardcoded closedSize / openWidth / openHeight needed.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 && height === 0) return;
      window.parent?.postMessage(
        {
          source: "rak-inc-chat",
          id: embedId,
          open: isOpenRef.current,
          hasBubble: hasBubbleRef.current,
          width: Math.ceil(width),
          height: Math.ceil(height),
        },
        "*",
      );
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [embedId]);

  // Also send immediately on state changes so the parent knows open/close intent
  // before the ResizeObserver fires (important for the close animation delay).
  useEffect(() => {
    const hasBubble = !isOpen && !bubbleDismissed && Boolean(bubbleText);
    hasBubbleRef.current = hasBubble;

    const el = wrapperRef.current;
    const rect = el?.getBoundingClientRect();
    window.parent?.postMessage(
      {
        source: "rak-inc-chat",
        id: embedId,
        open: isOpen,
        hasBubble,
        ...(rect && rect.width > 0
          ? { width: Math.ceil(rect.width), height: Math.ceil(rect.height) }
          : {}),
      },
      "*",
    );
  }, [isOpen, bubbleText, bubbleDismissed, embedId]);

  // ─── Scroll helpers ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !chat.hasMessages) return;
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    if (!nearBottomRef.current) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [isOpen, chat.hasMessages, chat.messages, chat.typing]);

  useEffect(() => {
    if (!isOpen) {
      nearBottomRef.current = true;
      return;
    }
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;

    const updatePositionState = () => {
      const threshold = 90;
      const distanceToBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      nearBottomRef.current = distanceToBottom <= threshold;
      setShowJumpToLatest(distanceToBottom > threshold);
    };

    updatePositionState();
    viewport.addEventListener("scroll", updatePositionState, { passive: true });
    return () => viewport.removeEventListener("scroll", updatePositionState);
  }, [isOpen, shouldRenderPanel, chat.hasMessages]);

  function scrollToLatest() {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    nearBottomRef.current = true;
    setShowJumpToLatest(false);
  }

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>

      {/*
       * Single fixed wrapper anchored to bottom-right corner.
       *
       * Layout:
       *   [chat panel]   ← appears above when open
       *   [bubble] [FAB] ← always visible at bottom
       *
       * Padding breakdown:
       *   pt-5 / pl-5 = 20px  → shadow buffer (shadow goes up-left)
       *   pb-2 / pr-2 =  8px  → visual margin from page edge
       *
       * The wrapper's rendered size is observed by ResizeObserver and sent
       * to the parent via postMessage — the parent sets the iframe to those
       * exact dimensions automatically.
       */}
      <div
        ref={wrapperRef}
        className="fixed bottom-0 right-0 z-50 flex flex-col items-end gap-3 p-6"
      >
        {/* Chat panel — rendered while open (and for 260ms during close animation) */}
        {shouldRenderPanel ? (
          /* overflow-visible so the X badge can sit half outside the panel corner */
          <div
            className={cn(
              "relative overflow-visible",
              "origin-bottom-right transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              isOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
                : "pointer-events-none translate-y-6 scale-[0.94] opacity-0 blur-[2px]",
            )}
          >
            {/* X badge — half outside the top-right corner */}
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
              className="absolute -top-2.5 -right-2.5 z-10 grid size-6 place-items-center rounded-full bg-card ring-1 ring-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>

            <section
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 w-[420px]"
              style={{
                // p-6 wrapper (48px v) + gap-3 (12px) + FAB row (~80px) = ~140px overhead.
                // Cap at 48rem (768px). Fall back to 720px if no parent frame.
                height: `min(48rem, ${availHeight ? Math.max(300, availHeight - 140) : 720}px)`,
              }}
              aria-label="Embedded sales assistant chat"
            >
              <header className="flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Innovi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If it exists in Innovation City, I know about it.
                  </p>
                </div>
              </header>

              <ScrollArea
                ref={scrollAreaRef}
                className="min-h-0 flex-1 px-4 py-4"
              >
                <ChatMessageList
                  messages={chat.messages}
                  typing={chat.typing}
                />
              </ScrollArea>

              <button
                type="button"
                onClick={scrollToLatest}
                aria-label="Jump to latest message"
                className={cn(
                  "absolute left-1/2 z-20 -translate-x-1/2 rounded-full border border-border/70",
                  "bg-background/95 p-2 text-muted-foreground shadow-lg shadow-black/35 backdrop-blur",
                  "transition-all duration-250 ease-out",
                  "bottom-24",
                  showJumpToLatest
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                <ChevronDown className="size-4" />
              </button>

              <div className="shrink-0 space-y-3 border-t border-border/70 bg-background/75 p-3 backdrop-blur">
                <ChatComposer
                  textareaRef={textareaRef}
                  inputEnabled={chat.inputEnabled}
                  isSending={chat.isSending}
                  onSend={() => void chat.sendMessage()}
                  onNewSession={() => void chat.newSession()}
                  onAutoResize={chat.autoResize}
                />
              </div>
            </section>
          </div>
        ) : null}

        {/* FAB row — bubble (collapses when hidden) + Innovi button */}
        <div className="flex items-center gap-3 py-2">
          <InnoviFab
            state={innoviState}
            isOpen={isOpen}
            bubble={bubbleDismissed ? null : bubbleText}
            onToggle={() => setIsOpen((v) => !v)}
            onDismissBubble={() => setBubbleDismissed(true)}
          />
        </div>
      </div>
    </>
  );
}
