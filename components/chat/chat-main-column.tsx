"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { RefObject } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { ChatQuickCards } from "./chat-quick-cards";
import { cn } from "@/lib/utils";

type ChatMainColumnProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  hasMessages: boolean;
  heroLine: string;
  heroSub: string;
  messages: ChatMessage[];
  typing: boolean;
  inputEnabled: boolean;
  isSending: boolean;
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
  onSend,
  onNewSession,
  onAutoResize,
  onPickSuggestion,
}: ChatMainColumnProps) {
  return (
    <div className="relative order-2 flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 md:px-3">
        <SidebarTrigger className="md:flex" />
        <Separator orientation="vertical" className="h-6" />
        <span className="text-sm font-medium text-muted-foreground">
          Sales agent
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-4 md:px-8">
        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-col items-center gap-6 py-8 transition-opacity duration-200",
            hasMessages && "pointer-events-none h-0 overflow-hidden py-0 opacity-0",
          )}
          aria-hidden={hasMessages}
        >
          <div
            className={cn(
              "size-24 rounded-full bg-linear-to-br from-primary/90 via-primary/40 to-accent/80",
              "blur-0 shadow-[0_0_60px_-12px_var(--color-primary)]",
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

        <div
          className={cn(
            "mx-auto w-full max-w-3xl flex-1",
            !hasMessages && "min-h-0",
          )}
        >
          <ChatMessageList messages={messages} typing={typing} />
        </div>

        <div className="mx-auto mt-4 w-full max-w-3xl space-y-4">
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
