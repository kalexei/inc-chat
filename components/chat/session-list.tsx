"use client";

import {
  formatSessionAge,
  sessionTitle,
} from "@/lib/chat/sessions";
import type { StoredSession } from "@/lib/chat-types";

type SessionListProps = {
  sessions: StoredSession[];
  activeSessionId: string | null;
  userId: string;
  searchQuery: string;
  showSearch: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
};

export function SessionList({
  sessions,
  activeSessionId,
  userId,
  searchQuery,
  showSearch,
  onSearchChange,
  onSelect,
  onDelete,
}: SessionListProps) {
  const emptyMessage = searchQuery.trim()
    ? "No matching chats"
    : userId.trim()
      ? "No chats for this user"
      : "No chats yet";

  return (
    <>
      {showSearch && (
        <div className="chat-search">
          <input
            type="search"
            placeholder="Search sessions…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <span className="sessions-empty">{emptyMessage}</span>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item${s.id === activeSessionId ? " active" : ""}`}
              title={s.userId ? `${s.id} · ${s.userId}` : s.id}
              onClick={() => void onSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void onSelect(s.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="session-item-dot" />
              <div className="session-item-body">
                <div className="session-item-title">{sessionTitle(s)}</div>
                <div className="session-item-sub">
                  {formatSessionAge(s.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className="session-delete-btn"
                title="Delete"
                onClick={(e) => void onDelete(s.id, e)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
