"use client";

import type { UseVoiceRecorderReturn } from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Trash2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VoiceRecorderPanelProps = {
  recorder: UseVoiceRecorderReturn;
  isSending: boolean;
  onSend: (blob: Blob) => void;
  onCancel: () => void;
};

// Pre-computed heights so the waveform is stable across re-renders
const WAVEFORM_HEIGHTS = Array.from(
  { length: 12 },
  () => 8 + Math.random() * 12,
);

function RecordingWaveform() {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden>
      {WAVEFORM_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-red-400 opacity-80"
          style={{
            height: `${height}px`,
            animation: `waveBar 0.8s ease-in-out ${(i * 0.07).toFixed(2)}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to   { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceRecorderPanel({
  recorder,
  isSending,
  onSend,
  onCancel,
}: VoiceRecorderPanelProps) {
  const { state, audioUrl, audioBlob, audioDuration, elapsedSeconds, maxSeconds, permissionDenied, stop, start, reset } = recorder;

  // Always-mounted audio element — src is set imperatively
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false)

  useEffect(() => {
    if (!audioUrl) {
      const audio = audioRef.current;
      audio.pause();
      audio.src = "";
      return;
    }
    const audio = audioRef.current;

    audio.src = audioUrl;
    audio.load();

    const onPlay = () => setIsPreviewPlaying(true);
    const onPause = () => setIsPreviewPlaying(false);
    const onEnded = () => {
      audio.currentTime = 0;
      setIsPreviewPlaying(false);
      setPreviewTime(0);
    };
    const onTimeUpdate = () => setPreviewTime(audio.currentTime);

    // Fix for webm blobs reporting Infinity duration:
    // Once metadata loads, if duration is not finite, seek to a large
    // value which forces the browser to scan the file and report real duration.
    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [audioUrl]);

  // Cleanup audio on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const togglePreview = () => {
    const audio = audioRef.current;
    if (isPreviewPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  const handleSend = () => {
    if (audioBlob) onSend(audioBlob);
  };

  const handleReRecord = async () => {
    audioRef.current.pause();
    setIsPreviewPlaying(false);
    setPreviewTime(0);
    setDuration(null);
    reset();
    await start();
  };

  const progress = duration && duration > 0 ? previewTime / duration : 0;
  const recordProgress = elapsedSeconds / maxSeconds;

  return (
    <div className="flex flex-col gap-3">
      {/* Permission denied */}
      {permissionDenied && (
        <p className="text-center text-xs text-destructive">
          Microphone access was denied. Please allow it in your browser settings.
        </p>
      )}

      {/* Recording state */}
      {state === "recording" && (
        <div className="flex flex-col items-center gap-3 py-1">
          <RecordingWaveform />

          <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-red-400 transition-all duration-1000"
              style={{ width: `${recordProgress * 100}%` }}
            />
          </div>

          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-xs text-muted-foreground">
              max {formatTime(maxSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel recording"
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </button>

            <button
              type="button"
              onClick={stop}
              aria-label="Stop recording"
              className={cn(
                "grid size-10 place-items-center rounded-full",
                "bg-red-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95",
              )}
            >
              <span className="size-3 rounded-sm bg-white" />
            </button>
          </div>
        </div>
      )}

      {/* Preview state */}
      {state === "preview" && (
        <div className="flex flex-col gap-3 py-1">
          {/* Scrubber */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-muted-foreground w-10 text-right">
            {formatTime(Math.floor(previewTime))}
          </span>
          <input
            type="range"
            min={0}
            max={audioDuration ?? duration ?? 0}
            step={0.01}
            value={previewTime}
            onPointerDown={() => {
              setIsScrubbing(true);
              audioRef.current.pause();
            }}
            onPointerUp={() => {
              setIsScrubbing(false);
              if (isPreviewPlaying) void audioRef.current.play();
            }}
            onChange={(e) => {
              const t = parseFloat(e.target.value);
              audioRef.current.currentTime = t;
              setPreviewTime(t);
            }}
            className="flex-1 h-1 accent-foreground cursor-pointer"
          />
          <span className="font-mono text-xs tabular-nums text-muted-foreground w-10">
            {duration !== null ? formatTime(Math.floor(duration)) : "--:--"}
          </span>
        </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleReRecord()}
                aria-label="Re-record"
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => { reset(); onCancel(); }}
                aria-label="Delete recording"
                className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreview}
                aria-label={isPreviewPlaying ? "Pause" : "Play recording"}
                className={cn(
                  "grid size-10 place-items-center rounded-full",
                  "border border-border/80 bg-muted text-foreground",
                  "transition-colors hover:bg-muted/80",
                )}
              >
                {isPreviewPlaying ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 translate-x-px" />
                )}
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                aria-label="Send voice message"
                className={cn(
                  "grid size-10 place-items-center rounded-full",
                  "bg-foreground text-background shadow-md",
                  "transition-transform hover:scale-105 active:scale-95",
                  "disabled:opacity-50 disabled:pointer-events-none",
                )}
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}