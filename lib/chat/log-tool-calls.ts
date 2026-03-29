import { TOOL_ICONS } from "@/lib/chat-constants";
import type { ToolCall } from "@/lib/chat-types";
import { fmtJson } from "@/lib/chat/json-format";

export function logToolCalls(
  log: (message: string, className?: string) => void,
  toolCalls: ToolCall[] | undefined,
): void {
  if (!toolCalls?.length) {
    log("  (no tool calls this turn)", "log-dim");
    return;
  }
  for (const call of toolCalls) {
    const icon = TOOL_ICONS[call.tool] || "🔧";
    log(`${icon} ${call.tool}`, "log-tool");
    if (call.input && Object.keys(call.input).length > 0) {
      const inputDisplay = { ...call.input };
      delete inputDisplay.sessionId;
      log(
        `  ↳ input:  ${fmtJson(inputDisplay).replace(/\n/g, "\n           ")}`,
        "log-tool-data",
      );
    }
    if (call.output != null) {
      let outputVal: unknown = call.output;
      if (typeof outputVal === "string") {
        try {
          outputVal = JSON.parse(outputVal);
        } catch {
          /* keep string */
        }
      }
      log(
        `  ↳ output: ${fmtJson(outputVal, true).replace(/\n/g, "\n           ")}`,
        "log-tool-data",
      );
    }
  }
}
