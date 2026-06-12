"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { useInnoviState } from "@/hooks/use-innovi-state";
import { useEmbedBubble } from "@/hooks/use-embed-bubble";
import { useEmbedFrame } from "@/hooks/use-embed-frame";
import { useEmbedScroll } from "@/hooks/use-embed-scroll";
import { useTransparentBg } from "@/hooks/use-transparent-bg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, Ellipsis, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { InnoviAvatar } from "./innovi-avatar";
import { InnoviFab } from "./innovi-fab";

export function ChatEmbed() {
  const chat = useSalesAgentChat();
  const { textareaRef } = chat.refs;

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false);
  const [composerHeight, setComposerHeight] = useState(96);

  // ── Composed hooks ──────────────────────────────────────────────────

  useTransparentBg();

  const innoviState = useInnoviState({
    typing: chat.typing,
    isSending: chat.isSending,
    sessionLabel: chat.sessionLabel,
    active: isOpen,
  });

  const bubbleText = useEmbedBubble(isOpen, chat.messages);

  const { availHeight, availWidth, isMobile } = useEmbedFrame(
    wrapperRef,
    isOpen,
    bubbleText,
  );

  const { showJumpToLatest, scrollToLatest } = useEmbedScroll(
    scrollAreaRef,
    isOpen,
    shouldRenderPanel,
    chat.hasMessages,
    chat.messages,
    chat.typing,
  );

  // Delay unmount so the close animation can play out
  useEffect(() => {
    const t = window.setTimeout(
      () => setShouldRenderPanel(isOpen),
      isOpen ? 0 : 260,
    );
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Autofocus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 260); // wait for open animation to complete
      return () => window.clearTimeout(t);
    }
  }, [isOpen, textareaRef]);

  // Track composer height for jump-to-latest positioning
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setComposerHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldRenderPanel]);

  const endSessionAndClose = () => {
    if (chat.sessionId) {
      void chat.deleteSession(chat.sessionId, {
        stopPropagation: () => {},
      } as React.MouseEvent);
    }
    setIsOpen(false);
  };

  // ── UI ──────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>

      <div
        ref={wrapperRef}
        className={cn(
          "fixed z-50 flex flex-col",
          isMobile && isOpen
            ? "inset-0 items-stretch"
            : "bottom-0 right-0 items-end gap-2 px-2 pb-2 pt-2",
          !isMobile && isOpen && "pt-3 pr-2.5",
        )}
      >
        {shouldRenderPanel ? (
          <div
            aria-hidden={!isOpen}
            className={cn(
              "relative overflow-visible",
              isMobile
                ? "flex-1 min-h-0 flex flex-col origin-bottom transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                : "origin-bottom-right transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              isOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
                : "pointer-events-none translate-y-6 scale-[0.94] opacity-0 blur-[2px]",
            )}
          >
            <section
              className={cn(
                "flex min-w-0 flex-col overflow-hidden border border-border/70 bg-card",
                isMobile ? "flex-1 min-h-0 w-full rounded-none" : "rounded-2xl",
              )}
              style={
                isMobile
                  ? undefined
                  : {
                      width: `min(420px, ${availWidth ? Math.max(260, availWidth - 48) : 420}px)`,
                      height: `min(48rem, ${availHeight ? Math.max(300, availHeight - 140) : 720}px)`,
                    }
              }
              aria-label="Embedded sales assistant chat"
            >
              <header className="flex items-center gap-3 border-b border-border/70 bg-background px-4 py-3">
                {isMobile && <InnoviAvatar state={innoviState} size={32} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {"Assistant"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {"Your assistant"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="More options"
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                      >
                        <Ellipsis className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={endSessionAndClose}
                        disabled={!chat.sessionId}
                      >
                        End chat session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    type="button"
                    aria-label="Close chat"
                    onClick={() => setIsOpen(false)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                  >
                    <X className="size-5" />
                  </button>
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
                  "bg-background p-2 text-muted-foreground shadow-lg shadow-black/35",
                  "transition-all duration-250 ease-out",
                  showJumpToLatest
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
                style={{ bottom: composerHeight + 16 }}
              >
                <ChevronDown className="size-4" />
              </button>

              <div ref={composerRef} className="shrink-0 space-y-3 border-t border-border/70 bg-background p-3">
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

        {!(isMobile && isOpen) && (
          <div className="shrink-0 flex items-center gap-3 py-2">
            <InnoviFab
              state={innoviState}
              isOpen={isOpen}
              bubble={bubbleText}
              onToggle={() => setIsOpen((v) => !v)}
            />
          </div>
        )}
      </div>
    </>
  );
}