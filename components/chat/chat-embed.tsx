"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { ChatQuickCards } from "./chat-quick-cards";

export function ChatEmbed() {
  const chat = useSalesAgentChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { textareaRef } = chat.refs;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !chat.hasMessages) return;
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [isOpen, chat.hasMessages, chat.messages, chat.typing]);

  return (
    <div className="h-dvh w-full bg-transparent">
      <section
        className={cn(
          "fixed bottom-24 right-4 z-50 flex min-w-0 max-w-md flex-col overflow-hidden border border-border/70 bg-card/95 shadow-2xl shadow-black/40 ring-1 ring-white/8",
          "h-[min(42rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] rounded-2xl",
          "origin-bottom-right transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
            : "pointer-events-none translate-y-6 scale-[0.94] opacity-0 blur-[2px]",
        )}
        aria-label="Embedded sales assistant chat"
      >
        <header className="flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur">
          <div
            className={cn(
              "size-8 rounded-full bg-linear-to-br from-primary to-accent",
              "shadow-lg shadow-primary/25",
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              RAK INC Assistant
            </p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </header>

        <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 px-4 py-4">
          {!chat.hasMessages ? (
            <div className="mb-4 rounded-xl border border-dashed border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
              {chat.heroLine}
            </div>
          ) : null}
          <ChatMessageList messages={chat.messages} typing={chat.typing} />
        </ScrollArea>

        <div className="shrink-0 space-y-3 border-t border-border/70 bg-background/75 p-3 backdrop-blur">
          <ChatQuickCards
            visible={!chat.hasMessages}
            onPickSuggestion={(p) => void chat.sendSuggestedPrompt(p)}
          />
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

      <div className="fixed bottom-4 right-4 z-50">
        <Button
          type="button"
          size="icon"
          className={cn(
            "size-14 rounded-full shadow-xl shadow-black/35 ring-1 ring-white/10",
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "active:scale-95",
            isOpen ? "rotate-0" : "hover:-translate-y-0.5 hover:shadow-2xl",
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
                  : "scale-100 rotate-0 opacity-100",
              )}
            />
            <X
              className={cn(
                "size-5 transition-all duration-250",
                isOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "absolute scale-50 -rotate-45 opacity-0",
              )}
            />
          </span>
        </Button>
      </div>
    </div>
  );
}
