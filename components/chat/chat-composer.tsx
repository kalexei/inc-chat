"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorderPanel } from "@/components/chat/voice-recorder-panel";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";
import { Mic, SendIcon } from "lucide-react";

type ChatComposerProps = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  inputEnabled: boolean;
  isSending: boolean;
  onSend: () => void;
  onNewSession: () => void;
  onAutoResize: () => void;
  // TODO: wire to your backend — receives the recorded audio blob
  onSendVoice?: (blob: Blob) => void;
};

export function ChatComposer({
  textareaRef,
  inputEnabled,
  isSending,
  onSend,
  onNewSession: _onNewSession,
  onAutoResize,
  onSendVoice,
}: ChatComposerProps) {
  void _onNewSession; // kept for API compatibility; "+" session creation button is hidden

  const recorder = useVoiceRecorder();
  const isVoiceActive = recorder.state !== "idle";

  const handleMicClick = async () => {
    if (!isVoiceActive) {
      await recorder.start();
    }
  };

  const handleVoiceSend = (blob: Blob) => {
    recorder.reset();
    // TODO: replace with actual backend call once wired up
    onSendVoice?.(blob);
  };

  const handleVoiceCancel = () => {
    recorder.reset();
  };

  return (
    <Card className="relative gap-0 rounded-2xl border-border/80 bg-card/80 py-0 shadow-lg shadow-black/20 ring-1 ring-border/60 backdrop-blur-sm">
      <CardContent className="p-2">
        {/* Voice recorder — overlays the card content when active */}
        {isVoiceActive && (
          <div className="px-1 py-1">
            <VoiceRecorderPanel
              recorder={recorder}
              isSending={isSending}
              onSend={handleVoiceSend}
              onCancel={handleVoiceCancel}
            />
          </div>
        )}

        {/* Text composer — hidden (not unmounted) while voice is active so
            the textarea ref and resize state are preserved */}
        <div className={cn("relative", isVoiceActive && "hidden")}>
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
              "min-h-[64px] resize-none rounded-xl border border-border/80 bg-background/60 px-3 py-2 pr-20 text-base leading-5 shadow-none",
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

          {/* Mic button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                disabled={!inputEnabled}
                className="absolute right-10 bottom-2 size-8 rounded-full"
                variant="ghost"
                onClick={() => void handleMicClick()}
                aria-label="Record voice message"
              >
                <Mic className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {!inputEnabled ? "Create or open a session first" : "Record voice message"}
            </TooltipContent>
          </Tooltip>

          {/* Send button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                disabled={isSending || !inputEnabled}
                className="absolute right-2 bottom-2 size-8 rounded-full hover:bg-white"
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