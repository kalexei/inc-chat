"use client";

import type { ChatMessage } from "@/lib/chat-types";
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
          className={cn("flex", m.role === "user" && "justify-end")}
        >
          <div
            className={cn(
              "flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-1.5",
              m.role === "user" && "items-end"
            )}
          >
            <div
              className={cn(
                "text-xs font-medium uppercase tracking-wide text-muted-foreground"
              )}
            >
              {m.role === "user" ? "You" : "Innovi"}
            </div>
            <div
              className={cn(
                "rounded-2xl border px-3.5 py-2.5 text-[14px] leading-6",
                m.role === "user"
                  ? "rounded-br-md border-white bg-white text-black"
                  : "rounded-bl-md border-[#3a3a3a] bg-[#252525] text-white"
              )}
            >
              {m.content}
            </div>
          </div>
        </div>
      ))}
      {typing ? (
        <div className="flex">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Innovi
            </div>
            <div className="max-w-[min(100%,42rem)] rounded-2xl rounded-bl-md border border-[#3a3a3a] bg-[#252525] px-3.5 py-2.5 text-[14px] leading-6 text-white/85">
              Agent is thinking…
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
