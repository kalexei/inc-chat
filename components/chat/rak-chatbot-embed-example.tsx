"use client";

import { useEffect } from "react";

type RakChatbotEmbedExampleProps = {
  src?: string;
  messageId?: string;
  closedSize?: number;
  openWidth?: number;
  openHeight?: number;
  right?: number;
  bottom?: number;
  radius?: number;
};

/**
 * Copy this component into another Next.js app and render it once
 * (for example in your root layout or page) to mount the chatbot iframe.
 */
export default function RakChatbotEmbedExample({
  src = "http://localhost:3000/embed",
  messageId = "rak-inc-chat",
  closedSize = 64,
  openWidth = 420,
  openHeight = 824,
  right = 12,
  bottom = 12,
  radius = 16,
}: RakChatbotEmbedExampleProps) {
  useEffect(() => {
    const iframeId = "rak-inc-chat-iframe";
    if (document.getElementById(iframeId)) return;

    const iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.title = "Innovation City Chatbot";
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.allow = "clipboard-read; clipboard-write";

    Object.assign(iframe.style, {
      position: "fixed",
      right: `${right}px`,
      bottom: `${bottom}px`,
      border: "0",
      borderRadius: "0",
      overflow: "hidden",
      background: "transparent",
      zIndex: "2147483647",
      boxShadow: "none",
      display: "block",
      padding: "0",
    });

    document.body.appendChild(iframe);

    const clampSize = (w: number, h: number) => {
      const maxW = window.innerWidth - right - 4;
      const maxH = window.innerHeight - bottom - 4;
      return {
        w: Math.max(56, Math.min(w, maxW)),
        h: Math.max(56, Math.min(h, maxH)),
      };
    };

    // When bubble is visible the iframe needs to be wide enough to show it
    // (bubble ~210px + gap ~12px + FAB 56px + right padding 12px ≈ 290px → 300px)
    const BUBBLE_W = 300;
    const BUBBLE_H = 80;

    const applySize = (open: boolean, hasBubble = false) => {
      let targetW: number;
      let targetH: number;
      if (open) {
        targetW = openWidth;
        targetH = openHeight;
      } else if (hasBubble) {
        targetW = BUBBLE_W;
        targetH = BUBBLE_H;
      } else {
        targetW = closedSize;
        targetH = closedSize;
      }
      const { w, h } = clampSize(targetW, targetH);
      iframe.style.width = `${w}px`;
      iframe.style.height = `${h}px`;
    };

    let isOpen = false;
    let hasBubble = false;
    let closeTimer: number | null = null;

    const setOpen = (open: boolean, bubble: boolean) => {
      isOpen = open;
      hasBubble = bubble;
      if (closeTimer) window.clearTimeout(closeTimer);
      if (open) {
        applySize(true, false);
      } else {
        // Keep iframe expanded briefly for close animation in /embed.
        closeTimer = window.setTimeout(() => applySize(false, hasBubble), 280);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: string; id?: string; open?: boolean; hasBubble?: boolean }
        | undefined;
      if (!data || data.source !== "rak-inc-chat" || data.id !== messageId)
        return;
      if (typeof data.open !== "boolean") return;
      const bubble = Boolean(data.hasBubble);
      // If only bubble visibility changed while closed, resize immediately
      if (!data.open && !isOpen && bubble !== hasBubble) {
        hasBubble = bubble;
        applySize(false, hasBubble);
        return;
      }
      setOpen(data.open, bubble);
    };

    const handleResize = () => applySize(isOpen, hasBubble);

    window.addEventListener("message", handleMessage);
    window.addEventListener("resize", handleResize);

    // Initial closed state
    applySize(false);

    return () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("resize", handleResize);
      iframe.remove();
    };
  }, [
    src,
    messageId,
    closedSize,
    openWidth,
    openHeight,
    right,
    bottom,
    radius,
  ]);

  return null;
}
