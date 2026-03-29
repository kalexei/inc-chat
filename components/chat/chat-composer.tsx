"use client";

import type { RefObject } from "react";
import { IconMic, IconPlus, IconSendSpark } from "./icons";

type ChatComposerProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  inputEnabled: boolean;
  isSending: boolean;
  onSend: () => void;
  onNewSession: () => void;
  onAutoResize: () => void;
};

export function ChatComposer({
  textareaRef,
  inputEnabled,
  isSending,
  onSend,
  onNewSession,
  onAutoResize,
}: ChatComposerProps) {
  return (
    <div className="composer-card">
      <textarea
        ref={textareaRef}
        rows={2}
        placeholder="What's on your mind?"
        disabled={!inputEnabled}
        onInput={onAutoResize}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="composer-actions">
        <div className="composer-left">
          <button
            type="button"
            className="icon-btn"
            title="New session"
            onClick={() => onNewSession()}
          >
            <IconPlus size={20} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Voice (placeholder)"
            disabled
            style={{ opacity: 0.35 }}
          >
            <IconMic />
          </button>
        </div>
        <button
          type="button"
          className="btn-generate"
          disabled={isSending || !inputEnabled}
          onClick={() => onSend()}
        >
          <span>Send</span>
          <IconSendSpark />
        </button>
      </div>
    </div>
  );
}
