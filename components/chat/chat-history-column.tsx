"use client";

import type { LogLine, StoredSession } from "@/lib/chat-types";
import type { RefObject } from "react";
import { DeveloperPanel } from "./developer-panel";
import { SessionList } from "./session-list";

type ChatHistoryColumnProps = {
  devRef: RefObject<HTMLDetailsElement | null>;
  logEndRef: RefObject<HTMLDivElement | null>;
  showSearch: boolean;
  sessionSearch: string;
  onSessionSearchChange: (value: string) => void;
  filteredSessions: StoredSession[];
  activeSessionId: string | null;
  userId: string;
  onUserIdChange: (value: string) => void;
  sessionLabel: string;
  refreshBusy: boolean;
  showSignOut: boolean;
  slots: Record<string, unknown>;
  leadSubmitted: boolean;
  chatMetadata: Record<string, unknown>;
  leadData: Record<string, unknown>;
  dynamicData: Record<string, unknown>;
  logLines: LogLine[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onNewSession: () => void;
  onRefreshCache: () => void;
  onSignOut: () => void;
};

export function ChatHistoryColumn({
  devRef,
  logEndRef,
  showSearch,
  sessionSearch,
  onSessionSearchChange,
  filteredSessions,
  activeSessionId,
  userId,
  onUserIdChange,
  sessionLabel,
  refreshBusy,
  showSignOut,
  slots,
  leadSubmitted,
  chatMetadata,
  leadData,
  dynamicData,
  logLines,
  onSelectSession,
  onDeleteSession,
  onNewSession,
  onRefreshCache,
  onSignOut,
}: ChatHistoryColumnProps) {
  return (
    <aside className="history-col" aria-label="Chats and tools">
      <div className="history-header">Chats</div>
      <SessionList
        sessions={filteredSessions}
        activeSessionId={activeSessionId}
        userId={userId}
        searchQuery={sessionSearch}
        showSearch={showSearch}
        onSearchChange={onSessionSearchChange}
        onSelect={onSelectSession}
        onDelete={onDeleteSession}
      />
      <DeveloperPanel
        panelRef={devRef}
        slots={slots}
        leadSubmitted={leadSubmitted}
        userId={userId}
        onUserIdChange={onUserIdChange}
        sessionLabel={sessionLabel}
        refreshBusy={refreshBusy}
        showSignOut={showSignOut}
        onNewSession={onNewSession}
        onRefreshCache={onRefreshCache}
        onSignOut={onSignOut}
        chatMetadata={chatMetadata}
        leadData={leadData}
        dynamicData={dynamicData}
        logLines={logLines}
        logEndRef={logEndRef}
      />
    </aside>
  );
}
