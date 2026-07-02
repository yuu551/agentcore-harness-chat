import type { StreamCallback } from "../types/chat";
import { parseHarnessChunk } from "./parsers/harness";
import { readSSEStream } from "./sse";

export class HarnessClient {
  private proxyUrl: string;

  constructor(proxyUrl: string) {
    if (!proxyUrl) throw new Error("Harness proxy URL not configured.");
    this.proxyUrl = proxyUrl;
  }

  generateSessionId(): string {
    return crypto.randomUUID();
  }

  async invoke(
    query: string,
    sessionId: string,
    idToken: string,
    modelId: string,
    onEvent: StreamCallback
  ): Promise<void> {
    if (!idToken) throw new Error("No valid ID token found.");

    const body: Record<string, unknown> = {
      sessionId,
      prompt: query,
      messages: [{ role: "user", content: [{ text: query }] }],
    };
    if (modelId) {
      body.modelId = modelId;
    }

    const response = await fetch(this.proxyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    await readSSEStream(response, parseHarnessChunk, onEvent);
  }
}
