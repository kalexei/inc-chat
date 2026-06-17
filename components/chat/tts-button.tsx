"use client";

import { useTts } from "@/hooks/use-tts";
import { cn } from "@/lib/utils";
import { Loader2, Volume2, VolumeX } from "lucide-react";

type TtsButtonProps = {
  messageId: string;
  text: string;
  className?: string;
};

export function TtsButton({ messageId, text, className }: TtsButtonProps) {
  const { playingId, ttsState, speak } = useTts();

  const isThisPlaying = playingId === messageId;
  const isLoading = isThisPlaying && ttsState === "loading";
  const isPlaying = isThisPlaying && ttsState === "playing";

  return (
    <button
      type="button"
      aria-label={isPlaying ? "Stop reading aloud" : "Read aloud"}
      onClick={() => void speak(messageId, text)}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full",
        "text-muted-foreground transition-colors",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isThisPlaying && "text-foreground",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="size-3.5" />
      ) : (
        <Volume2 className="size-3.5" />
      )}
    </button>
  );
}