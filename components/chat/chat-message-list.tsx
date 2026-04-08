"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useState, useEffect, useMemo } from "react";

type ChatMessageListProps = {
  messages: ChatMessage[];
  typing: boolean;
};

const assistantComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 opacity-80 hover:opacity-100"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[13px]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-white/10 p-3 font-mono text-[13px] last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-white/20">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-white/10 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-1.5 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-1.5">{children}</td>,
};

function timeAgo(ts: number, now: number): string {
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(diff / 3600);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ChatMessageList({ messages, typing }: ChatMessageListProps) {
  // Clock state used for relative timestamps; initialized once.
  const [now, setNow] = useState(() => Date.now());

  const normalizedMessages = useMemo(() => {
    const firstRealTimestamp = messages.find(
      (m) => typeof m.sentAt === "number" && !Number.isNaN(m.sentAt),
    )?.sentAt;
    const baseTime =
      firstRealTimestamp ?? now - Math.max(1, messages.length) * 60_000;

    let lastSeen = baseTime;
    return messages.map((m, i) => {
      if (typeof m.sentAt === "number" && !Number.isNaN(m.sentAt)) {
        lastSeen = m.sentAt;
        return m;
      }
      const inferred = Math.max(lastSeen + 1000, baseTime + i * 60_000);
      lastSeen = inferred;
      return { ...m, sentAt: inferred };
    });
  }, [messages, now]);

  // Indices whose timestamp is currently visible.
  // Initialise with the last message so it shows by default.
  const [shown, setShown] = useState<Set<number>>(
    () => new Set(messages.length > 0 ? [messages.length - 1] : []),
  );

  // Tick every 30 s so "just now" → "1 min ago" stays accurate.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Always show the timestamp for the newest message automatically.
  useEffect(() => {
    if (messages.length === 0) return;
    setShown((prev) => new Set([...prev, messages.length - 1]));
  }, [messages.length]);

  const toggle = (i: number) => {
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-2">
      {normalizedMessages.map((m, i) => (
        <div
          key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
          data-chat-role={m.role}
          className={cn("flex flex-col", m.role === "user" && "items-end")}
        >
          <div
            className={cn(
              "flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-1.5",
              m.role === "user" && "items-end",
            )}
          >
            {m.role === "assistant" && (
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sky
              </div>
            )}

            {/* Message bubble — click to toggle timestamp */}
            <button
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "rounded-2xl border px-3.5 py-2.5 text-[14px] leading-6 text-left",
                m.role === "user"
                  ? "rounded-br-md border-white bg-white text-black"
                  : "rounded-bl-md border-[#3a3a3a] bg-[#252525] text-white",
                "cursor-pointer",
              )}
            >
              {m.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={assistantComponents}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                m.content
              )}
            </button>

            {/* Timestamp — slides in/out */}
            <div
              className={cn(
                "overflow-hidden text-[11px] leading-4 text-muted-foreground transition-[max-height,opacity] duration-200 ease-in-out",
                shown.has(i) ? "max-h-8 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              {timeAgo(m.sentAt!, now)}
            </div>
          </div>
        </div>
      ))}

      {typing ? (
        <div className="flex">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sky
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
