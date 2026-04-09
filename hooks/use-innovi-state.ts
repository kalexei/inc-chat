import { useState, useEffect, useRef } from "react";
import type { InnoviState } from "@/components/chat/innovi-fab";

type UseInnoviStateOptions = {
  typing: boolean;
  isSending: boolean;
  sessionLabel?: string;
  /** When true the idle state is "happy" instead of "neutral". */
  active?: boolean;
};

export function useInnoviState({
  typing,
  isSending,
  sessionLabel = "",
  active = false,
}: UseInnoviStateOptions): InnoviState {
  const [state, setState] = useState<InnoviState>("neutral");
  const prevTypingRef = useRef(false);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      prevTypingRef.current = false;
      setState("neutral");
      return;
    }

    const isError = sessionLabel.toLowerCase().includes("error");
    if (isError) {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      prevTypingRef.current = false;
      setState("error");
      return;
    }

    const isThinking = typing || isSending;
    if (isThinking) {
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      prevTypingRef.current = true;
      setState("thinking");
      return;
    }

    if (prevTypingRef.current) {
      prevTypingRef.current = false;
      setState("speaking");
      speakingTimerRef.current = setTimeout(() => {
        speakingTimerRef.current = null;
        setState(activeRef.current ? "happy" : "neutral");
      }, 2500);
      return;
    }

    if (!speakingTimerRef.current) {
      setState("happy");
    }
  }, [typing, isSending, sessionLabel, active]);

  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
  }, []);

  return state;
}
