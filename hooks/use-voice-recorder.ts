"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderState = "idle" | "recording" | "preview";

export type UseVoiceRecorderReturn = {
  state: VoiceRecorderState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  elapsedSeconds: number;
  audioDuration: number | null;
  maxSeconds: number;
  permissionDenied: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
};

const MAX_SECONDS = 10;

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [recorderState, setRecorderState] = useState<VoiceRecorderState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hardStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup object URL on unmount or when a new one is created
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hardStopRef.current) clearTimeout(hardStopRef.current);
    timerRef.current = null;
    hardStopRef.current = null;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const finalise = useCallback((chunks: BlobPart[]) => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    // Probe real duration via a temporary Audio instance
    const probe = new Audio(url);
    probe.addEventListener("loadedmetadata", () => {
      if (!isFinite(probe.duration)) {
        probe.currentTime = 1e10;
      }
    });
    probe.addEventListener("durationchange", () => {
      if (isFinite(probe.duration)) {
        setAudioDuration(probe.duration);
        probe.currentTime = 0;
      }
    });
    setAudioBlob(blob);
    setAudioUrl(url);
    setRecorderState("preview");
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop(); // ondataavailable + onstop will fire and call finalise
    }
    stopStream();
  }, []);

  const start = useCallback(async () => {
    // Reset any previous recording
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setPermissionDenied(false);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionDenied(true);
      return;
    }

    streamRef.current = stream;

    // Pick a supported MIME type
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      finalise(chunksRef.current);
      stopStream();
    };

    mr.start(100); // collect chunks every 100ms
    setRecorderState("recording");

    // Elapsed timer — ticks every second
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    // Hard cap at MAX_SECONDS
    hardStopRef.current = setTimeout(() => {
      stop();
    }, MAX_SECONDS * 1000);
  }, [audioUrl, finalise, stop]);

  const reset = useCallback(() => {
    clearTimers();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    stopStream();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setPermissionDenied(false);
    setRecorderState("idle");
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (mediaRecorderRef.current?.state !== "inactive") {
        mediaRecorderRef.current?.stop();
      }
      stopStream();
    };
  }, []);

  return {
    state: recorderState,
    audioBlob,
    audioUrl,
    audioDuration,
    elapsedSeconds,
    maxSeconds: MAX_SECONDS,
    permissionDenied,
    start,
    stop,
    reset,
  };
}