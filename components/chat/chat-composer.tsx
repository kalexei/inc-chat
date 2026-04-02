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
    <Card className="gap-0 rounded-2xl border-border/80 bg-card/80 py-0 shadow-lg shadow-black/20 ring-1 ring-border/60 backdrop-blur-sm">
      <CardContent className="p-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            rows={3}
            placeholder={
              inputEnabled
                ? "Type a message…"
                : "Start or load a session to chat…"
            }
          disabled={!inputEnabled}
            className={cn(
              "min-h-[64px] resize-none rounded-xl border border-border/80 bg-background/60 px-3 py-2 pr-12 text-[14px] leading-5 shadow-none",
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                disabled={isSending || !inputEnabled}
                className="absolute right-2 bottom-2 size-8 rounded-full"
                onClick={() => onSend()}
              >
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
