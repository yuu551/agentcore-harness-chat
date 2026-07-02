// デプロイパラメータ（環境変数で制御）
//
// ローカル開発:   HARNESS_ARN=arn:... npx ampx sandbox --once
// 本番デプロイ:   Amplify Hosting のブランチ環境変数に同じキーを設定
// シークレット:   Google/Entra ID の client_id / client_secret は環境変数ではなく
//                `npx ampx sandbox secret set <NAME>`（ampx secret）で管理する

const csv = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const flag = (value: string | undefined): boolean => value === "true";

export const parameters = {
  // AgentCore Harness の ARN（必須）。AWS コンソールで Harness を作成後に設定する
  // ローカル開発では .mise.local.toml（gitignore 対象）の [env] で設定すると便利
  harnessArn: process.env.HARNESS_ARN ?? "",

  // フロントエンドのオリジン（CORS 許可と Cognito コールバック URL に使用、カンマ区切り）
  appOrigins: csv(process.env.APP_ORIGINS ?? "http://localhost:5173"),

  // WAF による IP 制限（未指定なら WAF を作成しない）
  allowedIpV4Cidrs: csv(process.env.ALLOWED_IPV4_CIDRS),
  allowedIpV6Cidrs: csv(process.env.ALLOWED_IPV6_CIDRS),

  // セルフサインアップ（デフォルト無効 = 管理者によるユーザー作成のみ）
  selfSignUp: flag(process.env.SELF_SIGNUP),
  // セルフサインアップを許可するメールドメイン（例: example.com,example.co.jp）
  allowedEmailDomains: csv(process.env.ALLOWED_EMAIL_DOMAINS),

  // 管理ユーザーのメールアドレス（設定するとデプロイ時にユーザーを作成し、仮パスワードをメール送付）
  adminUserEmail: process.env.ADMIN_USER_EMAIL ?? "",

  // Google フェデレーション（有効化時は ampx secret に GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET が必要）
  googleAuth: flag(process.env.GOOGLE_AUTH),

  // Microsoft Entra ID フェデレーション（有効化時は ENTRA_TENANT_ID と
  // ampx secret の ENTRA_CLIENT_ID / ENTRA_CLIENT_SECRET が必要）
  entraAuth: flag(process.env.ENTRA_AUTH),
  entraTenantId: process.env.ENTRA_TENANT_ID ?? "",

  // SSO 専用モード（パスワードログインを無効化し、外部 IdP のみ許可）
  ssoOnly: flag(process.env.SSO_ONLY),
};
