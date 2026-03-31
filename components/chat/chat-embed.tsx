"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { ChatComposer } from "./chat-composer";
import { ChatMessageList } from "./chat-message-list";
import { ChatQuickCards } from "./chat-quick-cards";
export function ChatEmbed() {
  const chat = useSalesAgentChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { textareaRef } = chat.refs;
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderPanel, setShouldRenderPanel] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const embedId = "rak-inc-chat";

  const skipRestoreOnceRef = useRef(true);

  useLayoutEffect(() => {
    // Make the entire iframe background transparent (host page should not be blocked).
    // RootLayout/global CSS sets `body` background; we override it here only for /embed.
    const prevHtmlBg = document.documentElement.style.background;
    const prevBodyBg = document.body.style.background;
    const prevHtmlBgColor = document.documentElement.style.backgroundColor;
    const prevBodyBgColor = document.body.style.backgroundColor;
    const prevHtmlBgImg = document.documentElement.style.backgroundImage;
    const prevBodyBgImg = document.body.style.backgroundImage;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.documentElement.style.setProperty(
      "background-color",
      "transparent",
      "important"
    );
    document.body.style.setProperty(
      "background-color",
      "transparent",
      "important"
    );
    document.documentElement.style.backgroundImage = "none";
    document.body.style.backgroundImage = "none";
    return () => {
      if (skipRestoreOnceRef.current) {
        // In development, React Strict Mode mounts/unmounts twice to detect side effects.
        // Skipping the first restore prevents a visible "black flash".
        skipRestoreOnceRef.current = false;
        return;
      }
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBgColor;
      document.body.style.backgroundColor = prevBodyBgColor;
      document.documentElement.style.backgroundImage = prevHtmlBgImg;
      document.body.style.backgroundImage = prevBodyBgImg;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(
      () => setShouldRenderPanel(isOpen),
      isOpen ? 0 : 260
    );
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    // Let the embedding script know when we open/close
    // so it can resize the iframe and avoid covering other UI.
    window.parent?.postMessage(
      { source: "rak-inc-chat", id: embedId, open: isOpen },
      "*"
    );
  }, [isOpen]);

  useEffect(() => {
    // Show greeting bubble after a short delay, hide it after 5s.
    const showT = window.setTimeout(() => setShowGreeting(true), 1200);
    const hideT = window.setTimeout(() => setShowGreeting(false), 6000);
    return () => {
      window.clearTimeout(showT);
      window.clearTimeout(hideT);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !chat.hasMessages) return;
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [isOpen, chat.hasMessages, chat.messages, chat.typing]);

  return (
    <>
      {/* Ensure the embed iframe never paints a background behind the widget */}
      <style>{`html, body { background: transparent !important; }`}</style>

      {shouldRenderPanel ? (
        <section
          className={cn(
            "fixed right-0 bottom-16 z-50 flex min-w-0 max-w-md flex-col overflow-hidden border border-border/70 bg-card/95",
            "h-[min(42rem,calc(100dvh-4rem))] w-[min(24rem,100vw)] rounded-2xl",
            "origin-bottom-right transition-[opacity,transform,filter] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            isOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
              : "pointer-events-none translate-y-6 scale-[0.94] opacity-0 blur-[2px]"
          )}
          aria-label="Embedded sales assistant chat"
        >
          <header className="flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur">
            {/* <div
              className={cn(
                "size-8 rounded-full bg-linear-to-br from-primary to-accent",
                "shadow-lg shadow-primary/25",
              )}
              aria-hidden
            /> */}
            {/* <Image
              src="/assets/logo/logo.svg"
              alt="RAK INC"
              width={32}
              height={32}
              className="size-8 rounded-full bg-linear-to-br from-primary to-accent shadow-lg shadow-primary/25"
            /> */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Innovation City Assistant
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </header>

          <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 px-4 py-4">
            {!chat.hasMessages ? (
              <div className="mb-4 rounded-xl border border-dashed border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
                {chat.heroLine}
              </div>
            ) : null}
            <ChatMessageList messages={chat.messages} typing={chat.typing} />
          </ScrollArea>

          <div className="shrink-0 space-y-3 border-t border-border/70 bg-background/75 p-3 backdrop-blur">
            <ChatQuickCards
              visible={!chat.hasMessages}
              onPickSuggestion={(p) => void chat.sendSuggestedPrompt(p)}
            />
            <ChatComposer
              textareaRef={textareaRef}
              inputEnabled={chat.inputEnabled}
              isSending={chat.isSending}
              onSend={() => void chat.sendMessage()}
              onNewSession={() => void chat.newSession()}
              onAutoResize={chat.autoResize}
            />
          </div>
        </section>
      ) : null}

      <div
        className={cn(
          "fixed bottom-14 right-13 z-50 max-w-[200px]",
          "rounded-2xl rounded-br-sm border border-border/70 bg-card px-3.5 py-2.5",
          "text-sm font-medium text-foreground shadow-lg shadow-black/20",
          "pointer-events-none origin-bottom-right",
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          showGreeting && !isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-95 opacity-0"
        )}
        aria-hidden
      >
        👋 Hi! Need help? Chat with us.
      </div>

      <div className="fixed right-0 bottom-0 z-50">
        <Button
          type="button"
          size="icon"
          className={cn(
            "size-14 rounded-full shadow-none ring-0",
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "active:scale-95",
            isOpen ? "rotate-0" : "hover:-translate-y-0.5"
          )}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className="relative grid place-items-center">
            <MessageCircle
              className={cn(
                "size-5 transition-all duration-250",
                isOpen
                  ? "absolute scale-50 rotate-45 opacity-0"
                  : "scale-100 rotate-0 opacity-100"
              )}
            />
            <X
              className={cn(
                "size-5 transition-all duration-250",
                isOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "absolute scale-50 -rotate-45 opacity-0"
              )}
            />
          </span>
        </Button>
      </div>
    </>
  );
}
