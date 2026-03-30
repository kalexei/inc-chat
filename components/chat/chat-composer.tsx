"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
    <Card className="gap-0 border-border/80 bg-card/80 py-0 shadow-lg shadow-black/20 ring-1 ring-border/60 backdrop-blur-sm">
      <CardContent className="p-3">
        <Textarea
          ref={textareaRef}
          rows={2}
          placeholder={
            inputEnabled ? "Type a message…" : "Start or load a session to chat…"
          }
          disabled={isSending || !inputEnabled}
          className={cn(
            "min-h-[52px] resize-none border-0 bg-transparent px-0 py-1 text-[15px] shadow-none",
            "focus-visible:ring-0",
          )}
          onInput={onAutoResize}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="New session"
                  onClick={() => onNewSession()}
                >
                  <IconPlus size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">New session</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Voice (coming soon)"
                    disabled
                    className="opacity-35"
                  >
                    <IconMic />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">Voice input (coming soon)</TooltipContent>
            </Tooltip>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                disabled={isSending || !inputEnabled}
                className="gap-2 rounded-full px-5"
                onClick={() => onSend()}
              >
                <span>Send</span>
                <IconSendSpark />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isSending
                ? "Sending…"
                : !inputEnabled
                  ? "Create or open a session first"
                  : "Send message (Enter)"}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
