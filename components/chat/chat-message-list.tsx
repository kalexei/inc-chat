"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PAGE_LOAD_AVATAR_SEED =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type ChatMessageListProps = {
  messages: ChatMessage[];
  typing: boolean;
};

function PixelPacmanAvatar() {
  return (
    <svg viewBox="0 0 16 16" className="size-7 ml-1 text-primary" aria-hidden>
      {/* minimalist pixel Pac-Man silhouette */}
      <rect x="4" y="2" width="2" height="2" fill="currentColor" />
      <rect x="6" y="2" width="2" height="2" fill="currentColor" />
      <rect x="8" y="2" width="2" height="2" fill="currentColor" />

      <rect x="2" y="4" width="2" height="2" fill="currentColor" />
      <rect x="4" y="4" width="2" height="2" fill="currentColor" />
      <rect x="6" y="4" width="2" height="2" fill="currentColor" />
      <rect x="8" y="4" width="2" height="2" fill="currentColor" />
      <rect x="10" y="4" width="2" height="2" fill="currentColor" />

      <rect x="2" y="6" width="2" height="2" fill="currentColor" />
      <rect x="4" y="6" width="2" height="2" fill="currentColor" />

      <rect x="2" y="8" width="2" height="2" fill="currentColor" />
      <rect x="4" y="8" width="2" height="2" fill="currentColor" />

      <rect x="2" y="10" width="2" height="2" fill="currentColor" />
      <rect x="4" y="10" width="2" height="2" fill="currentColor" />
      <rect x="6" y="10" width="2" height="2" fill="currentColor" />
      <rect x="8" y="10" width="2" height="2" fill="currentColor" />
      <rect x="10" y="10" width="2" height="2" fill="currentColor" />

      <rect x="4" y="12" width="2" height="2" fill="currentColor" />
      <rect x="6" y="12" width="2" height="2" fill="currentColor" />
      <rect x="8" y="12" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

function RoleAvatar({
  role,
  userSeed,
}: {
  role: "user" | "assistant";
  userSeed: string;
}) {
  const isUser = role === "user";
  const neutralHumanSrc = `https://api.dicebear.com/9.x/identicon/svg?seed=${userSeed}&backgroundColor=CDCCE3&rowColor=5752A3`;

  return (
    <Avatar
      size={isUser ? "sm" : "default"}
      className={cn(
        "mt-0.5 shrink-0",
        isUser ? "ring-2 ring-[#5752A3]/45" : "ring-1 ring-primary/20"
      )}
    >
      {isUser ? (
        <AvatarImage src={neutralHumanSrc} alt="Visitor avatar" />
      ) : null}
      <AvatarFallback
        className={cn(
          "text-xs font-semibold",
          isUser ? "bg-[#1B173A] text-white" : "bg-primary/15 text-primary"
        )}
      >
        {isUser ? "V" : <PixelPacmanAvatar />}
      </AvatarFallback>
    </Avatar>
  );
}

export function ChatMessageList({ messages, typing }: ChatMessageListProps) {
  const userAvatarSeed = PAGE_LOAD_AVATAR_SEED;

  return (
    <div className="space-y-4 pb-2">
      {messages.map((m, i) => (
        <div
          key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
          className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
        >
          <RoleAvatar role={m.role} userSeed={userAvatarSeed} />
          <div
            className={cn(
              "flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-1",
              m.role === "user" && "items-end"
            )}
          >
            <div
              className={cn(
                "text-xs font-medium uppercase tracking-wide text-muted-foreground"
              )}
            >
              {m.role === "user" ? "Visitor" : "Sales Agent"}
            </div>
            <div
              className={cn(
                "rounded-2xl px-3.5 py-2.5 text-[14px] leading-6",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border border-border/80 bg-muted/50 text-foreground"
              )}
            >
              {m.content}
            </div>
          </div>
        </div>
      ))}
      {typing ? (
        <div className="flex gap-3">
          <RoleAvatar role="assistant" userSeed={userAvatarSeed} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sales Agent
            </div>
            <div className="max-w-[min(100%,42rem)] rounded-2xl rounded-bl-md border border-dashed border-border/80 bg-muted/30 px-3.5 py-2.5 text-[14px] leading-6 text-muted-foreground">
              Agent is thinking…
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
