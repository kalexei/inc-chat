"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// ── Placeholder ────────────────────────────────────────────────────────────────
// Replace this function with your actual xAI (or other) TTS API call.
// It should return a URL or Blob that can be fed to an <audio> element.
async function fetchTtsAudio(text: string): Promise<string> {
  // TODO: call xAI TTS endpoint
  // Example shape (adjust to actual API):
  // const res = await fetch("/api/tts", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ text }),
  // });
  // const blob = await res.blob();
  // return URL.createObjectURL(blob);
  void text;
  throw new Error("TTS not yet implemented — wire up fetchTtsAudio in use-tts.ts");
}
// ──────────────────────────────────────────────────────────────────────────────

export type TtsState = "idle" | "loading" | "playing";

type TtsContextValue = {
  playingId: string | null;
  ttsState: TtsState;
  speak: (id: string, text: string) => Promise<void>;
  stop: () => void;
};

export const TtsContext = createContext<TtsContextValue | null>(null);

export function useTtsState() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [ttsState, setTtsState] = useState<TtsState>("idle");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingId(null);
    setTtsState("idle");
  }, []);

  const speak = useCallback(
    async (id: string, text: string) => {
      if (playingId === id) {
        stop();
        return;
      }

      stop();

      setPlayingId(id);
      setTtsState("loading");

      let url: string;
      try {
        url = await fetchTtsAudio(text);
      } catch (err) {
        console.error("[TTS] fetchTtsAudio failed:", err);
        setPlayingId(null);
        setTtsState("idle");
        return;
      }

      if (!playingId && id !== playingId) {
        URL.revokeObjectURL(url);
        return;
      }

      if (url.startsWith("blob:")) objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.oncanplaythrough = () => setTtsState("playing");

      audio.onended = () => {
        setPlayingId(null);
        setTtsState("idle");
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error("[TTS] Audio playback error");
        setPlayingId(null);
        setTtsState("idle");
        audioRef.current = null;
      };

      try {
        await audio.play();
        setTtsState("playing");
      } catch (err) {
        console.error("[TTS] audio.play() failed:", err);
        setPlayingId(null);
        setTtsState("idle");
      }
    },
    [playingId, stop],
  );

  return { playingId, ttsState, speak, stop };
}

export function useTts(): TtsContextValue {
  const ctx = useContext(TtsContext);
  if (!ctx) throw new Error("useTts must be used inside <TtsProvider>");
  return ctx;
}