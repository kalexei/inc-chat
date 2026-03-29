"use client";

import { useSalesAgentChat } from "@/hooks/use-sales-agent-chat";
import { ChatHistoryColumn } from "./chat-history-column";
import { ChatMainColumn } from "./chat-main-column";
import { ChatRail } from "./chat-rail";

export function ChatApp() {
  const chat = useSalesAgentChat();
  const { devRef, textareaRef, logEndRef } = chat.refs;

  return (
    <div className="rak-app rak-app--visible">
      <ChatRail
        initials={chat.initials}
        onNewChat={() => void chat.newSession()}
        onToggleSearch={() => chat.setShowSearch((v) => !v)}
        onOpenLibrary={chat.openDeveloperPanel}
      />

      <ChatMainColumn
        textareaRef={textareaRef}
        hasMessages={chat.hasMessages}
        heroLine={chat.heroLine}
        heroSub={chat.heroSub}
        messages={chat.messages}
        typing={chat.typing}
        inputEnabled={chat.inputEnabled}
        isSending={chat.isSending}
        onToggleDeveloper={chat.toggleDeveloperPanel}
        onSend={() => void chat.sendMessage()}
        onNewSession={() => void chat.newSession()}
        onAutoResize={chat.autoResize}
        onQuickStartChat={() => {
          void (async () => {
            await chat.newSession();
            textareaRef.current?.focus();
          })();
        }}
        onFocusComposer={() => textareaRef.current?.focus()}
        onOpenLeadSlots={() => {
          if (devRef.current) devRef.current.open = true;
        }}
        onRefreshKnowledge={() => void chat.refreshCache()}
      />

      <ChatHistoryColumn
        devRef={devRef}
        logEndRef={logEndRef}
        showSearch={chat.showSearch}
        sessionSearch={chat.sessionSearch}
        onSessionSearchChange={chat.setSessionSearch}
        filteredSessions={chat.filteredSessions}
        activeSessionId={chat.sessionId}
        userId={chat.userId}
        onUserIdChange={(value) => {
          chat.setUserId(value);
          chat.syncSessionsFromStorage();
        }}
        sessionLabel={chat.sessionLabel}
        refreshBusy={chat.refreshBusy}
        showSignOut={chat.showSignOut}
        slots={chat.slots}
        leadSubmitted={chat.leadSubmitted}
        chatMetadata={chat.chatMetadata}
        leadData={chat.leadData}
        dynamicData={chat.dynamicData}
        logLines={chat.logLines}
        onSelectSession={(id) => void chat.loadSession(id)}
        onDeleteSession={(id, e) => void chat.deleteSession(id, e)}
        onNewSession={() => void chat.newSession()}
        onRefreshCache={() => void chat.refreshCache()}
        onSignOut={chat.signOut}
      />
    </div>
  );
}
