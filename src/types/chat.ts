/** パーサが発行するストリームイベント（Harness の EventStream は Converse API 互換） */
export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_use_start"; toolUseId: string; name: string }
  | { type: "tool_use_delta"; toolUseId: string; input: string }
  | { type: "tool_result"; toolUseId: string; result: string }
  | { type: "result"; stopReason: string }
  | { type: "lifecycle"; event: string };

/** ストリームイベントを受け取るコールバック */
export type StreamCallback = (event: StreamEvent) => void;

/** SSE の 1 行をパースしてイベントを発行する関数 */
export type ChunkParser = (line: string, callback: StreamCallback) => void;

/** アシスタントメッセージに紐づくツール呼び出し */
export interface ToolCall {
  toolUseId: string;
  name: string;
  /** ストリーミング中に蓄積される入力 JSON（部分文字列の連結） */
  inputText: string;
  result?: string;
  status: "running" | "done";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
  isStreaming?: boolean;
}
