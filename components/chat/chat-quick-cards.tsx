"use client";

type ChatQuickCardsProps = {
  onNewConversation: () => void;
  onFocusComposer: () => void;
  onOpenLeadSlots: () => void;
  onRefreshKnowledge: () => void;
};

export function ChatQuickCards({
  onNewConversation,
  onFocusComposer,
  onOpenLeadSlots,
  onRefreshKnowledge,
}: ChatQuickCardsProps) {
  return (
    <div className="quick-cards">
      <button type="button" className="quick-card" onClick={onNewConversation}>
        <h3>New conversation</h3>
        <p>Start a fresh session with the agent</p>
      </button>
      <button type="button" className="quick-card" onClick={onFocusComposer}>
        <h3>Continue chat</h3>
        <p>Type below to message the sales agent</p>
      </button>
      <button type="button" className="quick-card" onClick={onOpenLeadSlots}>
        <h3>Lead slots</h3>
        <p>Open the developer panel on the right</p>
      </button>
      <button type="button" className="quick-card" onClick={onRefreshKnowledge}>
        <h3>Refresh knowledge</h3>
        <p>Reload RAG cache from the server</p>
      </button>
    </div>
  );
}
