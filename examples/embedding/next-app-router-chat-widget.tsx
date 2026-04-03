"use client";

import Script from "next/script";

declare global {
  interface Window {
    RakChatWidget?: {
      init: (config?: {
        src?: string;
        messageId?: string;
        right?: number;
        bottom?: number;
        allowedOrigins?: string[] | null;
      }) => { destroy?: () => void } | null;
      destroy?: () => void;
    };
  }
}

export function ChatWidget() {
  return (
    <Script
      src="https://chat.example.com/chat-widget/v1/widget.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.RakChatWidget?.init({
          src: "https://chat.example.com/embed",
          messageId: "rak-inc-chat",
          allowedOrigins: ["https://chat.example.com"],
        });
      }}
    />
  );
}

