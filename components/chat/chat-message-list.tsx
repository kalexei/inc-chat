"use client";

import type { ChatMessage } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type ChatMessageListProps = {
  messages: ChatMessage[];
  typing: boolean;
};

const assistantComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-80 hover:opacity-100">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[13px]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-white/10 p-3 font-mono text-[13px] last:mb-0">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-white/20">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-white/10 last:border-0">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-3 py-1.5">{children}</td>,
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
