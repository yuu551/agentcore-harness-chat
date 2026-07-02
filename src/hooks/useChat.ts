import { useCallback, useMemo, useRef, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { HarnessClient } from "../lib/harness-client";
import { appConfig } from "../lib/appConfig";
import type { ChatMessage, StreamEvent, ToolCall } from "../types/chat";

function updateLastAssistant(
  messages: ChatMessage[],
  update: (message: ChatMessage) => ChatMessage
): ChatMessage[] {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return messages;
  return [...messages.slice(0, -1), update(last)];
}

function updateToolCall(
  toolCalls: ToolCall[],
  toolUseId: string,
  update: (toolCall: ToolCall) => ToolCall
): ToolCall[] {
  // toolUseId が一致するものを更新。見つからなければ直近の running を対象にする
  let index = toolCalls.findIndex((tc) => tc.toolUseId === toolUseId);
  if (index < 0) {
    index = toolCalls.findLastIndex((tc) => tc.status === "running");
  }
  if (index < 0) return toolCalls;
  return toolCalls.map((tc, i) => (i === index ? update(tc) : tc));
}

export function useChat(initialMessages?: ChatMessage[]) {
  const client = useMemo(
    () => (appConfig.harnessProxyUrl ? new HarnessClient(appConfig.harnessProxyUrl) : null),
    []
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  /** バックエンド（Harness プロキシ）がデプロイ済みかどうか */
  const isConfigured = client !== null;

  const newConversation = useCallback(() => {
    sessionIdRef.current = crypto.randomUUID();
    setMessages([]);
    setError(null);
  }, []);

  const handleEvent = useCallback((event: StreamEvent) => {
    setMessages((prev) =>
      updateLastAssistant(prev, (message) => {
        switch (event.type) {
          case "text":
            return { ...message, content: message.content + event.content };
          case "tool_use_start":
            return {
              ...message,
              toolCalls: [
                ...(message.toolCalls ?? []),
                {
                  toolUseId: event.toolUseId,
                  name: event.name,
                  inputText: "",
                  status: "running",
                },
              ],
            };
          case "tool_use_delta":
            return {
              ...message,
              toolCalls: updateToolCall(message.toolCalls ?? [], event.toolUseId, (tc) => ({
                ...tc,
                inputText: tc.inputText + event.input,
              })),
            };
          case "tool_result":
            return {
              ...message,
              toolCalls: updateToolCall(message.toolCalls ?? [], event.toolUseId, (tc) => ({
                ...tc,
                result: (tc.result ?? "") + event.result,
                status: "done",
              })),
            };
          default:
            return message;
        }
      })
    );
  }, []);

  const send = useCallback(
    async (query: string, modelId: string) => {
      const trimmed = query.trim();
      if (!client || !trimmed || isStreaming) return;

      setError(null);
      setIsStreaming(true);
      const now = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: now },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          toolCalls: [],
          timestamp: now,
          isStreaming: true,
        },
      ]);

      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString() ?? "";
        await client.invoke(trimmed, sessionIdRef.current, idToken, modelId, handleEvent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "送信に失敗しました");
      } finally {
        setIsStreaming(false);
        setMessages((prev) =>
          updateLastAssistant(prev, (message) => ({
            ...message,
            isStreaming: false,
            // 応答終了時点で running のままのツールは done 扱いにする
            toolCalls: message.toolCalls?.map((tc) =>
              tc.status === "running" ? { ...tc, status: "done" as const } : tc
            ),
          }))
        );
      }
    },
    [client, isStreaming, handleEvent]
  );

  return { messages, isStreaming, error, isConfigured, send, newConversation };
}
