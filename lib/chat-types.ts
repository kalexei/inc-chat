export type ChatRole = "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string; sentAt?: number };

export type StoredSession = {
  id: string;
  createdAt: number;
  userId: string | null;
  title: string;
};

export type ToolCall = {
  tool: string;
  input?: Record<string, unknown>;
  output?: unknown;
};

export type ChatApiResponse = {
  sessionId: string;
  reply?: string;
  slots?: Record<string, unknown>;
  leadSubmitted?: boolean;
  chatMetadata?: Record<string, unknown>;
  leadData?: Record<string, unknown>;
  dynamicData?: Record<string, unknown>;
  toolCalls?: ToolCall[];
  error?: string;
  message?: string;
};

export type SessionApiResponse = {
  messages?: ChatMessage[];
  leadData?: Record<string, unknown>;
  dynamicData?: Record<string, unknown>;
  chatMetadata?: Record<string, unknown>;
};

export type LogLine = { id: number; text: string; cls?: string };
