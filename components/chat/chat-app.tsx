"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatAppNav } from "./chat-app-nav";
import { ChatMainColumn } from "./chat-main-column";

export function ChatApp() {
  const chat = useSalesAgentChat();
  const { textareaRef } = chat.refs;

  return (
    <SidebarProvider defaultOpen className="h-dvh min-h-0">
      <ChatAppNav
        initials={chat.initials}
        showSignOut={chat.showSignOut}
        showSearch={chat.showSearch}
        sessionSearch={chat.sessionSearch}
        filteredSessions={chat.filteredSessions}
        activeSessionId={chat.sessionId}
        userId={chat.userId}
        onNewChat={() => void chat.newSession()}
        onToggleSearch={() => chat.setShowSearch((v) => !v)}
        onSessionSearchChange={chat.setSessionSearch}
        onSelectSession={(id) => void chat.loadSession(id)}
        onDeleteSession={(id, e) => void chat.deleteSession(id, e)}
        onSignOut={chat.signOut}
      />
      <SidebarInset
        className="flex min-h-0 flex-1 flex-row overflow-hidden p-0"
        dir="ltr"
      >
        <ChatMainColumn
          textareaRef={textareaRef}
          hasMessages={chat.hasMessages}
          heroLine={chat.heroLine}
          heroSub={chat.heroSub}
          messages={chat.messages}
          typing={chat.typing}
          inputEnabled={chat.inputEnabled}
          isSending={chat.isSending}
          onSend={() => void chat.sendMessage()}
          onNewSession={() => void chat.newSession()}
          onAutoResize={chat.autoResize}
          onPickSuggestion={(p) => void chat.sendSuggestedPrompt(p)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
