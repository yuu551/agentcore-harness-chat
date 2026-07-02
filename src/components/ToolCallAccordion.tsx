import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, Wrench } from "lucide-react";
import type { ToolCall } from "../types/chat";

function formatInput(inputText: string): string {
  if (!inputText) return "";
  try {
    return JSON.stringify(JSON.parse(inputText), null, 2);
  } catch {
    return inputText;
  }
}

function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [isOpen, setIsOpen] = useState(false);
  const isRunning = toolCall.status === "running";
  const input = formatInput(toolCall.inputText);

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-copper-soft"
      >
        {isOpen ? (
          <ChevronDown className="size-3.5 shrink-0 text-ink-faint" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-ink-faint" />
        )}
        <Wrench className="size-3.5 shrink-0 text-copper" />
        <span className="flex-1 truncate font-mono text-xs text-ink-soft">{toolCall.name}</span>
        {isRunning ? (
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Loader2 className="size-3.5 animate-spin" />
            実行中
          </span>
        ) : (
          <Check className="size-3.5 shrink-0 text-copper" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-line px-3 py-2.5">
          {input && (
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-ink-faint">入力</p>
              <pre className="max-h-48 overflow-auto rounded-md bg-canvas p-2.5 font-mono text-xs leading-relaxed text-ink-soft">
                {input}
              </pre>
            </div>
          )}
          {toolCall.result && (
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-ink-faint">結果</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-canvas p-2.5 font-mono text-xs leading-relaxed text-ink-soft">
                {toolCall.result}
              </pre>
            </div>
          )}
          {!input && !toolCall.result && (
            <p className="text-xs text-ink-faint">入出力はありません</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolCallAccordion({ toolCalls }: { toolCalls: ToolCall[] }) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="mb-3 space-y-1.5">
      {toolCalls.map((toolCall, index) => (
        <ToolCallItem key={`${toolCall.toolUseId}-${index}`} toolCall={toolCall} />
      ))}
    </div>
  );
}
