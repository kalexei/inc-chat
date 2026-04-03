"use client";

import { useEffect } from "react";

type RakChatbotEmbedExampleProps = {
  src?: string;
  messageId?: string;
  /** Initial iframe size before the first ResizeObserver postMessage arrives (~100ms). */
  initialSize?: number;
  right?: number;
  bottom?: number;
};

/**
 * Copy this component into another Next.js app and render it once
 * (for example in your root layout or page) to mount the chatbot iframe.
 *
 * The iframe auto-sizes to fit its content via ResizeObserver + postMessage —
 * no need to specify closedSize / openWidth / openHeight.
 */
export default function RakChatbotEmbedExample({
  src = "http://localhost:3000/embed",
  messageId = "rak-inc-chat",
  initialSize = 90,
  right = 12,
  bottom = 12,
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
      width: `${initialSize}px`,
      height: `${initialSize}px`,
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

    // Track the last applied size for window-resize re-clamping.
    let lastW = initialSize;
    let lastH = initialSize;
    // Dimensions waiting to be applied after the close animation.
    let pendingW: number | null = null;
    let pendingH: number | null = null;
    let closeTimer: number | null = null;
    let isOpen = false;
    let isFullscreen = false;

    const applyFullscreen = () => {
      isFullscreen = true;
      Object.assign(iframe.style, {
        top: "0", left: "0", right: "0", bottom: "0",
        width: "100%", height: "100%",
        borderRadius: "0",
      });
    };

    const applySize = (w: number, h: number) => {
      isFullscreen = false;
      const { w: cw, h: ch } = clampSize(w, h);
      lastW = cw;
      lastH = ch;
      iframe.style.top    = "auto";
      iframe.style.left   = "auto";
      iframe.style.right  = `${right}px`;
      iframe.style.bottom = `${bottom}px`;
      iframe.style.width  = `${cw}px`;
      iframe.style.height = `${ch}px`;
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: string; id?: string; open?: boolean; fullscreen?: boolean; width?: number; height?: number }
        | undefined;

      // Child signals readiness — re-send constraints so it gets availWidth
      // even if our "load" callback fired before React registered its listener.
      if (data?.source === "rak-inc-chat-ready" && data.id === messageId) {
        sendAvailHeight();
        return;
      }

      if (!data || data.source !== "rak-inc-chat" || data.id !== messageId) return;
      if (typeof data.open !== "boolean") return;

      // Fullscreen mode (mobile open): expand iframe to cover the whole viewport.
      if (data.fullscreen === true) {
        if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; pendingW = null; pendingH = null; }
        isOpen = true;
        applyFullscreen();
        return;
      }

      // Dimensions are required; old-format messages without them are ignored.
      if (typeof data.width !== "number" || typeof data.height !== "number") return;

      const wasOpen = isOpen;
      isOpen = data.open;

      if (data.open) {
        // Opening: cancel any pending close and expand immediately.
        if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; pendingW = null; pendingH = null; }
        applySize(data.width, data.height);
      } else if (wasOpen || isFullscreen) {
        // Transitioning from open → closed: wait for the close animation,
        // but keep updating pending dims so we apply the freshest value.
        pendingW = data.width;
        pendingH = data.height;
        if (!closeTimer) {
          closeTimer = window.setTimeout(() => {
            closeTimer = null;
            if (pendingW !== null) {
              applySize(pendingW, pendingH!);
              pendingW = null;
              pendingH = null;
            }
          }, 280);
        }
      } else {
        // Already closed (e.g. bubble appeared/disappeared while closed).
        if (closeTimer) {
          // Close timer still running — update pending but don't restart.
          pendingW = data.width;
          pendingH = data.height;
        } else {
          applySize(data.width, data.height);
        }
      }
    };

    const handleResize = () => {
      if (isFullscreen) {
        sendAvailHeight();
        return;
      }
      const w = pendingW !== null ? pendingW : lastW;
      const h = pendingH !== null ? pendingH : lastH;
      applySize(w, h);
    };

    const sendAvailHeight = () => {
      if (!iframe.contentWindow) return;
      const availHeight = window.innerHeight - bottom - 32; // 32px top margin
      const availWidth  = window.innerWidth  - right  - 8;  // 8px left margin
      iframe.contentWindow.postMessage(
        { source: "rak-inc-chat-host", availHeight, availWidth },
        "*"
      );
    };

    iframe.addEventListener("load", sendAvailHeight);

    const _handleResize = handleResize;
    const handleResizeWithHeight = () => { _handleResize(); sendAvailHeight(); };

    window.addEventListener("message", handleMessage);
    window.addEventListener("resize", handleResizeWithHeight);

    return () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("resize", handleResizeWithHeight);
      iframe.remove();
    };
  }, [src, messageId, initialSize, right, bottom]);

  return null;
}
