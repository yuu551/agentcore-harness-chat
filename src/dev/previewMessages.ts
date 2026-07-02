import type { ChatMessage } from "../types/chat";

// 開発時のデザイン確認用モックデータ（`npm run dev` + `/?preview` で表示）。
// 本番ビルドでは import.meta.env.DEV の分岐によりバンドルから除外される。
export const previewMessages: ChatMessage[] = [
  {
    id: "preview-user-1",
    role: "user",
    content: "社内のデータ分析基盤について、構成と運用ルールを教えてください。",
    timestamp: Date.now() - 60_000,
  },
  {
    id: "preview-assistant-1",
    role: "assistant",
    content: [
      "## データ分析基盤の構成",
      "",
      "社内のデータ分析基盤は次の 3 層で構成されています。",
      "",
      "1. **収集層**: Kinesis Data Streams でイベントを取り込み",
      "2. **蓄積層**: S3 + Glue Data Catalog（Parquet 形式）",
      "3. **分析層**: Athena と QuickSight",
      "",
      "| 層 | サービス | 責任チーム |",
      "|---|---|---|",
      "| 収集 | Kinesis | プラットフォーム |",
      "| 蓄積 | S3 / Glue | プラットフォーム |",
      "| 分析 | Athena / QuickSight | 各事業部 |",
      "",
      "運用ルールの詳細は次のとおりです。",
      "",
      "```sql",
      "-- 分析クエリの例: 日次アクティブユーザー",
      "SELECT date_trunc('day', event_time) AS day, count(DISTINCT user_id)",
      "FROM events",
      "GROUP BY 1 ORDER BY 1;",
      "```",
      "",
      "> クエリのスキャン量が 1TB を超える場合は、事前にパーティション設計を見直してください。",
    ].join("\n"),
    toolCalls: [
      {
        toolUseId: "preview-tool-1",
        name: "knowledge_search",
        inputText: JSON.stringify({ query: "データ分析基盤 構成 運用ルール" }),
        result: "3件のドキュメントが見つかりました: data-platform-overview.md, ...",
        status: "done",
      },
      {
        toolUseId: "preview-tool-2",
        name: "list_categories",
        inputText: "{}",
        status: "running",
      },
    ],
    timestamp: Date.now() - 30_000,
    isStreaming: false,
  },
];
