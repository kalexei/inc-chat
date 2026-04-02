"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, MessageCircle, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
export function ChatEmbed() {
  const chat = useSalesAgentChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const { textareaRef } = chat.refs;
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const embedId = "rak-inc-chat";

  const skipRestoreOnceRef = useRef(true);

  useLayoutEffect(() => {
    // Make the entire iframe background transparent (host page should not be blocked).
    // RootLayout/global CSS sets `body` background; we override it here only for /embed.
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
      "important"
    );
    document.body.style.setProperty(
      "background-color",
      "transparent",
      "important"
    );
    document.documentElement.style.backgroundImage = "none";
    document.body.style.backgroundImage = "none";
    return () => {
      if (skipRestoreOnceRef.current) {
        // In development, React Strict Mode mounts/unmounts twice to detect side effects.
        // Skipping the first restore prevents a visible "black flash".
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

  useEffect(() => {
    // Let the embedding script know when we open/close
    // so it can resize the iframe and avoid covering other UI.
    window.parent?.postMessage(
      { source: "rak-inc-chat", id: embedId, open: isOpen },
      "*"
    );
  }, [isOpen]);

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
      const isNearBottom = distanceToBottom <= threshold;
      nearBottomRef.current = isNearBottom;
      setShowJumpToLatest(!isNearBottom);
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
      {/* Ensure the embed iframe never paints a background behind the widget */}
      <style>{`html, body { background: transparent !important; }`}</style>

      {shouldRenderPanel ? (
        <section
          className={cn(
            "fixed right-0 bottom-14 z-50 flex min-w-0 flex-col overflow-hidden border border-border/70 bg-card/95",
            "h-[min(48rem,calc(100dvh-4rem))] w-[min(26.25rem,calc(100vw-0.75rem))] max-w-[calc(100vw-0.75rem)] rounded-2xl",
            "origin-bottom-right transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            "relative",
            isOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
              : "pointer-events-none translate-y-6 scale-[0.94] opacity-0 blur-[2px]"
          )}
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
      ) : null}

      <div className="fixed right-0 bottom-0 z-50">
        <Button
          type="button"
          size="icon"
          className={cn(
            "size-14 rounded-full shadow-none ring-0",
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "active:scale-95",
            isOpen ? "rotate-0" : "hover:-translate-y-0.5"
          )}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className="relative grid place-items-center">
            <MessageCircle
              className={cn(
                "size-5 transition-all duration-250",
                isOpen
                  ? "absolute scale-50 rotate-45 opacity-0"
                  : "scale-100 rotate-0 opacity-100"
              )}
            />
            <X
              className={cn(
                "size-5 transition-all duration-250",
                isOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "absolute scale-50 -rotate-45 opacity-0"
              )}
            />
          </span>
        </Button>
      </div>
    </>
  );
}
