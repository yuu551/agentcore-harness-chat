import { useEffect, useRef, useState } from "react";
import { CircleAlert, Info } from "lucide-react";
import { Header } from "./components/Header";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { EmptyState } from "./components/EmptyState";
import { useChat } from "./hooks/useChat";
import { loadModelId, saveModelId } from "./lib/models";
import { previewMessages } from "./dev/previewMessages";

const isPreview =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview");

export default function App() {
  const { messages, isStreaming, error, isConfigured, send, newConversation } = useChat(
    isPreview ? previewMessages : undefined
  );
  const [modelId, setModelId] = useState(loadModelId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleModelChange = (id: string) => {
    setModelId(id);
    saveModelId(id);
  };

  const handleSend = (text: string) => {
    void send(text, modelId);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      <Header
        modelId={modelId}
        onModelChange={handleModelChange}
        onNewConversation={newConversation}
        isStreaming={isStreaming}
      />

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggestion={handleSend} disabled={!isConfigured || isStreaming} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </main>

      <div className="mx-auto w-full max-w-3xl px-4 pb-5 sm:px-6">
        {!isConfigured && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink-soft">
            <Info className="mt-0.5 size-4 shrink-0 text-copper" />
            <p>
              バックエンドが未デプロイです。<code className="rounded bg-copper-soft px-1.5 py-0.5 font-mono text-xs">HARNESS_ARN</code>{" "}
              を設定して <code className="rounded bg-copper-soft px-1.5 py-0.5 font-mono text-xs">npx ampx sandbox</code>{" "}
              を実行してください。
            </p>
          </div>
        )}

        {error && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p className="break-all">{error}</p>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={!isConfigured || isStreaming}
          placeholder={isConfigured ? "メッセージを入力" : "バックエンドのデプロイ後に利用できます"}
        />
      </div>
    </div>
  );
}
