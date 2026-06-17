"use client";

import { TtsContext, useTtsState } from "@/hooks/use-tts";

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const value = useTtsState();
  return (
    <TtsContext.Provider value={value}>
      {children}
    </TtsContext.Provider>
  );
}