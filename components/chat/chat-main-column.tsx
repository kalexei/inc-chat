"use client";

import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/chat-types";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { ChatQuickCards } from "./chat-quick-cards";
import { IconSettings } from "./icons";

type ChatMainColumnProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  hasMessages: boolean;
  heroLine: string;
  heroSub: string;
  messages: ChatMessage[];
  typing: boolean;
  inputEnabled: boolean;
  isSending: boolean;
  onToggleDeveloper: () => void;
  onSend: () => void;
  onNewSession: () => void;
  onAutoResize: () => void;
  /** New session then focus composer (quick card). */
  onQuickStartChat: () => void;
  onFocusComposer: () => void;
  onOpenLeadSlots: () => void;
  onRefreshKnowledge: () => void;
};

export function ChatMainColumn({
  textareaRef,
  hasMessages,
  heroLine,
  heroSub,
  messages,
  typing,
  inputEnabled,
  isSending,
  onToggleDeveloper,
  onSend,
  onNewSession,
  onAutoResize,
  onQuickStartChat,
  onFocusComposer,
  onOpenLeadSlots,
  onRefreshKnowledge,
}: ChatMainColumnProps) {
  return (
    <div className="main-col">
      <div className="main-topbar">
        <button
          type="button"
          className="icon-btn"
          title="Tools & session"
          onClick={onToggleDeveloper}
        >
          <IconSettings />
        </button>
      </div>

      <div className="main-scroll">
        <div className={`hero-block${hasMessages ? " hidden" : ""}`}>
          <div className="hero-orb" aria-hidden />
          <p className="hero-greeting">
            {heroLine} <span>{heroSub}</span>
          </p>
        </div>

        <div
          className={`messages-wrap${hasMessages ? " visible" : " empty"}`}
        >
          <ChatMessageList messages={messages} typing={typing} />
        </div>

        <ChatComposer
          textareaRef={textareaRef}
          inputEnabled={inputEnabled}
          isSending={isSending}
          onSend={() => void onSend()}
          onNewSession={() => void onNewSession()}
          onAutoResize={onAutoResize}
        />

        <ChatQuickCards
          onNewConversation={onQuickStartChat}
          onFocusComposer={onFocusComposer}
          onOpenLeadSlots={onOpenLeadSlots}
          onRefreshKnowledge={() => void onRefreshKnowledge()}
        />
      </div>
    </div>
  );
}
