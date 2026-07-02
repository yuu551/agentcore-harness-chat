import type { ChunkParser } from "../../types/chat";

let currentToolUseId = "";

export const parseHarnessChunk: ChunkParser = (line, callback) => {
  if (!line.startsWith("data: ")) return;
  const data = line.substring(6).trim();
  if (!data) return;

  try {
    const json = JSON.parse(data);

    if (json.contentBlockDelta?.delta?.text) {
      callback({ type: "text", content: json.contentBlockDelta.delta.text });
      return;
    }

    if (json.contentBlockStart?.start?.toolUse) {
      const toolUse = json.contentBlockStart.start.toolUse;
      currentToolUseId = toolUse.toolUseId;
      callback({ type: "tool_use_start", toolUseId: toolUse.toolUseId, name: toolUse.name });
      return;
    }

    if (json.contentBlockDelta?.delta?.toolUse?.input) {
      callback({
        type: "tool_use_delta",
        toolUseId: currentToolUseId,
        input: json.contentBlockDelta.delta.toolUse.input,
      });
      return;
    }

    if (json.contentBlockStart?.start?.toolResult) {
      const tr = json.contentBlockStart.start.toolResult;
      callback({ type: "lifecycle", event: `tool_result_start:${tr.toolUseId}` });
      return;
    }

    if (json.contentBlockDelta?.delta?.toolResult) {
      const results = json.contentBlockDelta.delta.toolResult;
      const text = Array.isArray(results)
        ? results.map((c: { text?: string }) => c.text).filter(Boolean).join("")
        : JSON.stringify(results);
      if (text) {
        callback({ type: "tool_result", toolUseId: currentToolUseId, result: text });
      }
      return;
    }

    if (json.messageStart) {
      callback({ type: "lifecycle", event: "message_start" });
      return;
    }

    if (json.messageStop?.stopReason) {
      callback({ type: "result", stopReason: json.messageStop.stopReason });
      return;
    }
  } catch {
    console.debug("Failed to parse harness event:", data);
  }
};
