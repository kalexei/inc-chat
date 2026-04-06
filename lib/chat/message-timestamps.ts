import type { ChatMessage } from "@/lib/chat-types";

type RawMessage = ChatMessage & {
  sentAt?: string | number;
  timestamp?: string | number;
  createdAt?: string | number;
};

function parseOptionalTime(v: unknown): number | undefined {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return undefined;
}

/**
 * Maps API/session payload messages to `ChatMessage`, reading common timestamp field names.
 */
export function coerceMessageFromApi(raw: unknown): ChatMessage {
  const m = raw as RawMessage;
  const sentAt =
    parseOptionalTime(m.sentAt) ??
    parseOptionalTime(m.timestamp) ??
    parseOptionalTime(m.createdAt);
  return {
    role: m.role === "user" ? "user" : "assistant",
    content: typeof m.content === "string" ? m.content : "",
    ...(sentAt !== undefined ? { sentAt } : {}),
  };
}

/**
 * Ensures every message has `sentAt` so the UI can show relative times.
 * Uses monotonic offsets from `anchorMs` (e.g. session `createdAt`) when the API omits times.
 */
export function ensureMessageSentAt(
  messages: ChatMessage[],
  anchorMs: number,
): ChatMessage[] {
  return messages.map((m, i) => {
    if (typeof m.sentAt === "number" && !Number.isNaN(m.sentAt)) return m;
    return { ...m, sentAt: anchorMs + i * 1000 };
  });
}
