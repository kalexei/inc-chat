"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ChatMessageListProps = {
  messages: ChatMessage[];
  typing: boolean;
};

export function ChatMessageList({ messages, typing }: ChatMessageListProps) {
  return (
    <div className="space-y-4 pb-2">
      {messages.map((m, i) => (
        <div
          key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
          className={cn(
            "flex gap-3",
            m.role === "user" && "flex-row-reverse",
          )}
        >
          <Avatar
            size="sm"
            className={cn(
              "mt-0.5 shrink-0",
              m.role === "user" && "ring-2 ring-primary/25",
            )}
          >
            <AvatarFallback
              className={cn(
                "text-xs font-semibold",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {m.role === "user" ? "You" : "AI"}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-1",
              m.role === "user" && "items-end",
            )}
          >
            <div
              className={cn(
                "text-xs font-medium uppercase tracking-wide text-muted-foreground",
              )}
            >
              {m.role === "user" ? "You" : "Sales Agent"}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border border-border/80 bg-muted/50 text-foreground",
              )}
            >
              {m.content}
            </div>
          </div>
        </div>
      ))}
      {typing ? (
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-0.5 shrink-0">
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              AI
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sales Agent
            </div>
            <div className="max-w-[min(100%,42rem)] rounded-2xl rounded-bl-md border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-[15px] text-muted-foreground">
              Agent is thinking…
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
