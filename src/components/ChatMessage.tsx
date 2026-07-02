import { memo, useMemo, useState } from "react";
import { Check, Copy, Waypoints } from "lucide-react";
import { Streamdown } from "streamdown";
import { streamdownPlugins } from "../lib/streamdownPlugins";
import { normalizeMarkdown } from "../lib/markdown";
import { ToolCallAccordion } from "./ToolCallAccordion";
import type { ChatMessage as ChatMessageType } from "../types/chat";

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="応答を待っています">
      <span className="thinking-dot size-1.5 rounded-full bg-copper" />
      <span className="thinking-dot size-1.5 rounded-full bg-copper" />
      <span className="thinking-dot size-1.5 rounded-full bg-copper" />
    </span>
  );
}

export const ChatMessage = memo(function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const processedContent = useMemo(
    () => (isUser ? "" : normalizeMarkdown(message.content)),
    [isUser, message.content]
  );

  const handleCopy = async () => {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="fade-up flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-copper px-4 py-3 text-[15px] leading-7 text-white shadow-[var(--shadow-subtle)] sm:max-w-[75%]">
          <span className="whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    );
  }

  const isWaiting =
    !!message.isStreaming &&
    !message.content &&
    !(message.toolCalls ?? []).some((tc) => tc.status === "running");

  return (
    <div className="fade-up group flex gap-3.5">
      <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-copper-soft">
        <Waypoints className="size-4 text-copper" />
      </div>

      <div className="min-w-0 flex-1">
        <ToolCallAccordion toolCalls={message.toolCalls ?? []} />

        {isWaiting && <ThinkingDots />}

        {message.content && (
          <div
            className={`text-[15px] leading-7 text-ink ${message.isStreaming ? "stream-caret" : ""}
              [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-3
              [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_p]:mb-3 [&_p]:leading-relaxed
              [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc
              [&_ol]:mb-3 [&_ol]:pl-5 [&_ol]:list-decimal
              [&_li]:mb-1.5 [&_li]:leading-relaxed
              [&_blockquote]:border-l-2 [&_blockquote]:border-copper [&_blockquote]:pl-4 [&_blockquote]:text-ink-soft
              [&_strong]:font-semibold
              [&_a]:text-copper [&_a]:underline [&_a]:underline-offset-2
              [&_code]:rounded-md [&_code]:bg-copper-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]
            `}
          >
            <Streamdown plugins={streamdownPlugins} isAnimating={!!message.isStreaming}>
              {processedContent}
            </Streamdown>
          </div>
        )}

        {!message.isStreaming && message.content && (
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md p-1 text-xs text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
              title="コピー"
              aria-label="回答をコピー"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
            <span className="text-xs text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
              {new Date(message.timestamp).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
