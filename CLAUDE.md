# AgentCore Harness Chat

Amazon Bedrock AgentCore Harness 用のチャット Web アプリ。

## 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- **IaC**: Amplify Gen 2（`amplify/backend.ts` に CDK エスケープハッチで拡張）
- **認証**: Amazon Cognito（Amplify defineAuth）
- **エージェント**: Amazon Bedrock AgentCore Harness（コンソールで手動作成、ARN を環境変数で渡す）

## 開発ルール

- **Node 24 / npm** を使用（pnpm ではなく npm。Amplify Hosting のデフォルトビルドに合わせる）
- **UI テキストは日本語**。技術用語やコード内識別子は英語のまま可
- **絵文字を UI に使用しない**。アイコンは lucide-react を使用
- **アニメーションは控えめに**（ローディング・状態遷移などの高影響度の瞬間のみ）
- ドキュメント・コミットメッセージは日本語

## コマンド

- `npm run dev` — 開発サーバー起動（amplify_outputs.json が必要）
- `npm run sandbox:once` — Amplify sandbox デプロイ（`HARNESS_ARN` 等の環境変数を付けて実行）
- `npm run build` / `npm run typecheck` — ビルド / 型チェック

## デザイン

- テーマ「Copper & Ink」: 銅アクセント × 温かみのある紙色/墨色。トークンは `src/index.css` の CSS 変数で定義
- フォント: Fraunces（見出し）+ IBM Plex Sans JP（本文）+ IBM Plex Mono（コード・ツール入出力）
- デザイン確認: `npm run dev` 後に `/?preview`（モック会話・認証不要・開発ビルド限定）。`?preview&theme=dark` でダーク

## デプロイパラメータ

環境変数で制御する（一覧と説明は `amplify/parameters.ts`）。
Google/Entra ID のシークレットは `npx ampx sandbox secret set <NAME>` で管理し、`.env` 等に平文で置かない。
