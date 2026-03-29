"use client";

import type { ChatMessage } from "@/lib/chat-types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  typing: boolean;
};

export function ChatMessageList({ messages, typing }: ChatMessageListProps) {
  return (
    <div>
      {messages.map((m, i) => (
        <div key={`${i}-${m.role}-${m.content.slice(0, 24)}`} className={`msg ${m.role}`}>
          <div className="msg-label">
            {m.role === "user" ? "You" : "Sales Agent"}
          </div>
          <div className="msg-bubble">{m.content}</div>
        </div>
      ))}
      {typing && (
        <div className="msg assistant typing">
          <div className="msg-bubble">Agent is thinking…</div>
        </div>
      )}
    </div>
  );
}
