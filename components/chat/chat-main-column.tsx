"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useRef, type RefObject } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { ChatQuickCards } from "./chat-quick-cards";
import { InnoviAvatar } from "./innovi-avatar";
import { cn } from "@/lib/utils";
import type { InnoviState } from "./innovi-fab";

type ChatMainColumnProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  hasMessages: boolean;
  heroLine: string;
  heroSub: string;
  messages: ChatMessage[];
  typing: boolean;
  inputEnabled: boolean;
  isSending: boolean;
  innoviState: InnoviState;
  onSend: () => void;
  onNewSession: () => void;
  onAutoResize: () => void;
  onPickSuggestion: (prompt: string) => void;
};

export function ChatMainColumn({
  textareaRef,
  hasMessages,
  heroLine,
  heroSub,
  messages,
  typing,
  inputEnabled,
  isSending,
  innoviState,
  onSend,
  onNewSession,
  onAutoResize,
  onPickSuggestion,
}: ChatMainColumnProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMessages) return;
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [hasMessages, messages, typing]);

  return (
    <div className="relative order-2 flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2 md:px-3">
        <SidebarTrigger className="md:flex" />
        <div className="flex items-center gap-2">
          <InnoviAvatar state={innoviState} size={28} />
          <span className="text-sm font-semibold text-foreground">Innovi</span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-2 md:px-8 md:pb-4 md:pt-4">
        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-col items-center gap-4 py-4 transition-opacity duration-200 md:gap-6 md:py-8",
            hasMessages &&
              "pointer-events-none h-0 overflow-hidden py-0 opacity-0"
          )}
          aria-hidden={hasMessages}
        >
          <div
            className={cn(
              "size-24 rounded-full bg-linear-to-br from-primary/90 via-primary/40 to-accent/80",
              "blur-0 shadow-[0_0_60px_-12px_var(--color-primary)]"
            )}
            aria-hidden
          />
          <p className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {heroLine}{" "}
            <span className="block text-base font-normal text-muted-foreground md:inline md:text-lg">
              {heroSub}
            </span>
          </p>
        </div>

        <ScrollArea
          ref={scrollAreaRef}
          className={cn(
            "mx-auto w-full max-w-3xl",
            hasMessages ? "min-h-0 flex-1" : "flex-1"
          )}
        >
          <div className="pr-3">
            <ChatMessageList messages={messages} typing={typing} />
          </div>
        </ScrollArea>

        <div className="mx-auto mt-2 w-full max-w-3xl shrink-0 space-y-3 md:mt-4 md:space-y-4">
          <ChatComposer
            textareaRef={textareaRef}
            inputEnabled={inputEnabled}
            isSending={isSending}
            onSend={() => void onSend()}
            onNewSession={() => void onNewSession()}
            onAutoResize={onAutoResize}
          />
          <ChatQuickCards
            visible={!hasMessages}
            onPickSuggestion={(p) => void onPickSuggestion(p)}
          />
        </div>
      </div>
    </div>
  );
}
