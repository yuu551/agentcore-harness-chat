# AgentCore Harness のセットアップ

AgentCore Harness は、コードを書かずに model / system prompt / tools を設定するだけでエージェントを動かせるマネージドサービスです。このテンプレートは Harness 本体を作成しません。AWS コンソールで作成した Harness の ARN を渡して利用します。

## Harness を作成する

1. [Amazon Bedrock AgentCore コンソール](https://console.aws.amazon.com/bedrock-agentcore/)を開きます（Harness が提供されているリージョン、例: `us-east-1` を選択）
2. 「Harness」→「Create harness」を選択します
3. 以下を設定します
   - **Name**: 任意の名前（例: `my-agent`）
   - **Model**: 使用するモデル（例: Claude Sonnet）
   - **System prompt**: エージェントの振る舞いの定義
   - **Tools**: 必要なツール（Browser、Code Interpreter、MCP など）
4. 作成後に表示される **Harness ARN** をコピーします

> **Authorizer（JWT）の設定は不要です。** Lambda プロキシが IAM 認証（`bedrock-agentcore:InvokeHarness`）で呼び出すため、認証はこのテンプレートが作成する Cognito で完結します。

## ARN をテンプレートに渡す

```bash
HARNESS_ARN=arn:aws:bedrock-agentcore:us-east-1:123456789012:harness/my-agent \
  npx ampx sandbox --once
```

ローカル開発で毎回指定するのが面倒な場合は、[mise](https://mise.jdx.dev/) の `.mise.local.toml`（gitignore 対象）や direnv などで環境変数として設定しておくと便利です。ARN にはアカウント ID が含まれるため、リポジトリにコミットしないでください。

## Harness の変更・更新

model / system prompt / tools の変更は AWS コンソールで行います。変更は即座に反映され、このテンプレートの再デプロイは不要です。再デプロイが必要なのは **ARN 自体が変わったとき**（Harness を作り直したとき）だけです。

## 既知の制限事項

| 項目 | 説明 |
|---|---|
| 会話履歴 | セッションは Harness が管理します。ブラウザの「新しい会話」でセッション ID を再生成する方式のため、過去の会話一覧 UI はありません |
| ファイル分析 | Harness からファイルを扱うには、AWS コンソールで S3 アクセスなどをツールとして設定してください |
| 提供リージョン | Harness は提供リージョンが限られます（`us-east-1` など）。フロントエンド・Cognito・API は同一リージョンにまとめてデプロイする構成です |
