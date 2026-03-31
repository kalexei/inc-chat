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
  openHeight = 820,
  right = 12,
  bottom = 12,
  radius = 16,
}: RakChatbotEmbedExampleProps) {
  useEffect(() => {
    const iframeId = "rak-inc-chat-iframe";
    if (document.getElementById(iframeId)) return;

    const iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.title = "RAK INC Chatbot";
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

    const applySize = (open: boolean) => {
      const targetW = open ? openWidth : closedSize;
      const targetH = open ? openHeight : closedSize;
      const { w, h } = clampSize(targetW, targetH);
      iframe.style.width = `${w}px`;
      iframe.style.height = `${h}px`;
    };

    let isOpen = false;
    let closeTimer: number | null = null;

    const setOpen = (open: boolean) => {
      isOpen = open;
      if (closeTimer) window.clearTimeout(closeTimer);
      if (open) {
        applySize(true);
      } else {
        // Keep iframe expanded briefly for close animation in /embed.
        closeTimer = window.setTimeout(() => applySize(false), 280);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: string; id?: string; open?: boolean }
        | undefined;
      if (!data || data.source !== "rak-inc-chat" || data.id !== messageId)
        return;
      if (typeof data.open !== "boolean") return;
      setOpen(data.open);
    };

    const handleResize = () => applySize(isOpen);

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
