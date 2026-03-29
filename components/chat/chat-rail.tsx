"use client";

import { IconBook, IconPlus, IconSearch } from "./icons";

type ChatRailProps = {
  initials: string;
  onNewChat: () => void;
  onToggleSearch: () => void;
  onOpenLibrary: () => void;
};

export function ChatRail({
  initials,
  onNewChat,
  onToggleSearch,
  onOpenLibrary,
}: ChatRailProps) {
  return (
    <aside className="rail" aria-label="Primary">
      <div className="rail-logo" title="RAK INC" />
      <button
        type="button"
        className="rail-btn"
        title="New chat"
        onClick={() => onNewChat()}
      >
        <IconPlus />
      </button>
      <button
        type="button"
        className="rail-btn"
        title="Search chats"
        onClick={onToggleSearch}
      >
        <IconSearch />
      </button>
      <button
        type="button"
        className="rail-btn"
        title="Library / lead fields"
        onClick={onOpenLibrary}
      >
        <IconBook />
      </button>
      <div className="rail-spacer" />
      <button type="button" className="rail-account" title="Account">
        {initials}
      </button>
    </aside>
  );
}
