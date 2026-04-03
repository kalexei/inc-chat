import { useEffect } from "react";

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
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://chat.example.com/chat-widget/v1/widget.js";
    script.async = true;
    script.onload = () => {
      window.RakChatWidget?.init({
        src: "https://chat.example.com/embed",
        messageId: "rak-inc-chat",
        allowedOrigins: ["https://chat.example.com"],
      });
    };
    document.body.appendChild(script);

    return () => {
      window.RakChatWidget?.destroy?.();
      script.remove();
    };
  }, []);

  return null;
}

