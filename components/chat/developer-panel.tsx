"use client";

import { SLOT_FIELDS } from "@/lib/chat-constants";
import { fmtJson } from "@/lib/chat/json-format";
import { slotFieldLabel } from "@/lib/chat/slot-labels";
import type { LogLine } from "@/lib/chat-types";
import type { RefObject } from "react";

type DeveloperPanelProps = {
  panelRef: RefObject<HTMLDetailsElement | null>;
  slots: Record<string, unknown>;
  leadSubmitted: boolean;
  userId: string;
  onUserIdChange: (value: string) => void;
  sessionLabel: string;
  refreshBusy: boolean;
  showSignOut: boolean;
  onNewSession: () => void;
  onRefreshCache: () => void;
  onSignOut: () => void;
  chatMetadata: Record<string, unknown>;
  leadData: Record<string, unknown>;
  dynamicData: Record<string, unknown>;
  logLines: LogLine[];
  logEndRef: RefObject<HTMLDivElement | null>;
};

export function DeveloperPanel({
  panelRef,
  slots,
  leadSubmitted,
  userId,
  onUserIdChange,
  sessionLabel,
  refreshBusy,
  showSignOut,
  onNewSession,
  onRefreshCache,
  onSignOut,
  chatMetadata,
  leadData,
  dynamicData,
  logLines,
  logEndRef,
}: DeveloperPanelProps) {
  return (
    <details className="dev-accordion" ref={panelRef} id="devDetails">
      <summary>Developer</summary>
      <div className="dev-panels">
        <div className="panel-block">
          <h2>Lead slots</h2>
          <table className="slots-table">
            <tbody>
              {SLOT_FIELDS.map((field) => {
                const val = slots[field];
                const has =
                  val !== null && val !== undefined && String(val) !== "";
                return (
                  <tr key={field}>
                    <td>{slotFieldLabel(field)}</td>
                    <td className={has ? "slot-filled" : "slot-empty"}>
                      {has ? String(val) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {leadSubmitted && (
            <div>
              <span className="submitted-badge">Lead submitted</span>
            </div>
          )}
        </div>

        <div className="panel-block">
          <h2>Session</h2>
          <div className="user-input-row">
            <label htmlFor="userIdInput">User ID</label>
            <input
              id="userIdInput"
              className="user-id-input"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
              placeholder="X-User-Id header"
              autoComplete="off"
            />
            {userId.trim() && (
              <span className="user-active-badge">
                {userId.length > 14 ? `${userId.slice(0, 12)}…` : userId}
              </span>
            )}
          </div>
          <div className="rate-limit-note">
            Sent as X-User-Id — auto-filled from Cognito when signed in
          </div>
          <div className="session-id-display">{sessionLabel}</div>
          <button
            type="button"
            className="btn-small danger"
            onClick={() => void onNewSession()}
          >
            New session
          </button>
          <button
            type="button"
            className="btn-small"
            disabled={refreshBusy}
            onClick={() => void onRefreshCache()}
          >
            {refreshBusy ? "Refreshing…" : "Refresh cache"}
          </button>
          {showSignOut && (
            <button type="button" className="btn-small" onClick={onSignOut}>
              Sign out
            </button>
          )}
        </div>

        <div className="panel-block">
          <h2>Session data</h2>
          <div className="raw-data-label">Chat metadata</div>
          <pre className="raw-json">{fmtJson(chatMetadata)}</pre>
          <div className="raw-data-label">Lead data</div>
          <pre className="raw-json">{fmtJson(leadData)}</pre>
          <div className="raw-data-label">Dynamic data</div>
          <pre className="raw-json">{fmtJson(dynamicData)}</pre>
        </div>

        <div className="panel-block">
          <h2>Debug log</h2>
          <div className="rak-log-output">
            {logLines.map((line) => (
              <span key={line.id} className={line.cls}>
                {line.text}
                {"\n"}
              </span>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </details>
  );
}
