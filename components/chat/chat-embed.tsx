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
  const embedId = "rak-inc-chat";

  // ─── Innovi state ────────────────────────────────────────────────────────────
  const [innoviState, setInnoviState] = useState<InnoviState>("neutral");
  const isOpenRef = useRef(false);
  const prevTypingRef = useRef(false);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const isError = chat.sessionLabel.toLowerCase().includes("error");
    if (isError) {
      if (speakingTimerRef.current) { clearTimeout(speakingTimerRef.current); speakingTimerRef.current = null; }
      prevTypingRef.current = false;
      setInnoviState("error");
      return;
    }

    const isThinking = chat.typing || chat.isSending;
    if (isThinking) {
      if (speakingTimerRef.current) { clearTimeout(speakingTimerRef.current); speakingTimerRef.current = null; }
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

    // Don't override if speaking timer is still counting down
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
  useEffect(() => { chatMessagesRef.current = chat.messages; }, [chat.messages]);

  // Proactive greeting after 2.5 s on first load
  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasOpenedRef.current && !bubbleDismissed) {
        setBubbleText("Hi! I'm Innovi 👋 — ask me anything about Innovation City.");
      }
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When chat closes after a conversation, preview last agent message in bubble
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
    document.documentElement.style.setProperty("background-color", "transparent", "important");
    document.body.style.setProperty("background-color", "transparent", "important");
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

  useEffect(() => {
    const t = window.setTimeout(
      () => setShouldRenderPanel(isOpen),
      isOpen ? 0 : 260
    );
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Notify parent iframe of open state + whether bubble is showing
  useEffect(() => {
    const hasBubble = !isOpen && !bubbleDismissed && Boolean(bubbleText);
    window.parent?.postMessage(
      { source: "rak-inc-chat", id: embedId, open: isOpen, hasBubble },
      "*"
    );
  }, [isOpen, bubbleText, bubbleDismissed]);

  useEffect(() => {
    if (!isOpen || !chat.hasMessages) return;
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
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
      '[data-slot="scroll-area-viewport"]'
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
      '[data-slot="scroll-area-viewport"]'
    );
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    nearBottomRef.current = true;
    setShowJumpToLatest(false);
  }

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>

      {/* Chat panel */}
      {shouldRenderPanel ? (
        /* Wrapper is overflow-visible so the X badge can sit half outside the panel corner */
        <div
          className={cn(
            "fixed right-3 bottom-19 z-50",
            "h-[min(48rem,calc(100dvh-5rem))] w-[min(26.25rem,calc(100vw-0.75rem))] max-w-[calc(100vw-0.75rem)]",
            "origin-bottom-right transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            isOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
              : "pointer-events-none translate-y-6 scale-[0.94] opacity-0 blur-[2px]"
          )}
        >
          {/* X badge — half outside the top-right corner, matching the FAB badge style */}
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setIsOpen(false)}
            className="absolute -top-2.5 -right-2.5 z-10 grid size-6 place-items-center rounded-full bg-card ring-1 ring-border/70 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>

          <section
            className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95"
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

          <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 px-4 py-4">
            <ChatMessageList messages={chat.messages} typing={chat.typing} />
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
                : "pointer-events-none translate-y-2 opacity-0"
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

      {/* Innovi FAB */}
      <InnoviFab
        state={innoviState}
        isOpen={isOpen}
        bubble={bubbleDismissed ? null : bubbleText}
        onToggle={() => setIsOpen((v) => !v)}
        onDismissBubble={() => setBubbleDismissed(true)}
      />
    </>
  );
}
