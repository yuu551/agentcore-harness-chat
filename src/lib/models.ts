export type ModelDefinition = {
  /** 空文字は「Harness に設定された既定モデルを使う」ことを意味する（modelId を送信しない） */
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: "sliders" | "sparkles" | "zap";
};

// リージョンプレフィックス（jp. / us.）は Lambda プロキシ側で自動付与される
export const MODELS: ModelDefinition[] = [
  {
    id: "",
    name: "エージェント既定",
    shortName: "既定",
    description: "Harness に設定されたモデル",
    icon: "sliders",
  },
  {
    id: "anthropic.claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    shortName: "Sonnet 4.6",
    description: "高性能・バランス型",
    icon: "sparkles",
  },
  {
    id: "anthropic.claude-haiku-4-5-20251001-v1:0",
    name: "Claude Haiku 4.5",
    shortName: "Haiku 4.5",
    description: "最速・低コスト",
    icon: "zap",
  },
];

export const DEFAULT_MODEL_ID = "";

const STORAGE_KEY = "selectedModelId";

export function loadModelId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL_ID;
    if (MODELS.some((m) => m.id === stored)) {
      return stored;
    }
    saveModelId(DEFAULT_MODEL_ID);
    return DEFAULT_MODEL_ID;
  } catch {
    return DEFAULT_MODEL_ID;
  }
}

export function saveModelId(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, modelId);
  } catch {
    // ignore
  }
}
