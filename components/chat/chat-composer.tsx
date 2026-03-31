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
import { IconMic } from "./icons";
import { SendIcon } from "lucide-react";

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
  onNewSession: _onNewSession,
  onAutoResize,
}: ChatComposerProps) {
  void _onNewSession; // kept for API compatibility; "+" session creation button is hidden

  return (
    <Card className="gap-0 border-border/80 bg-card/80 py-0 shadow-lg shadow-black/20 ring-1 ring-border/60 backdrop-blur-sm">
      <CardContent className="p-3">
        <Textarea
          ref={textareaRef}
          rows={2}
          placeholder={
            inputEnabled
              ? "Type a message…"
              : "Start or load a session to chat…"
          }
          disabled={isSending || !inputEnabled}
          className={cn(
            "min-h-[60px] resize-none border-0 bg-transparent px-2.5 py-2 text-[16px] shadow-none",
            "focus-visible:ring-0"
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
              <TooltipTrigger asChild></TooltipTrigger>
              <TooltipContent side="top">
                Voice input (coming soon)
              </TooltipContent>
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
                <SendIcon className="size-4" />
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
