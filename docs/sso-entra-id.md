# Microsoft Entra ID SSO の設定

Cognito User Pool の OIDC フェデレーションで Microsoft Entra ID（旧 Azure AD）によるサインインを有効にします。ログイン画面の下部に「Microsoft でサインイン」ボタンが追加され、既存のメール + パスワードログインと共存できます（パスワードログインを無効化する場合は末尾の [SSO 専用モード](#sso-専用モード) を参照）。

## 手順

### 1. Entra ID でアプリを登録する

1. [Microsoft Entra 管理センター](https://entra.microsoft.com/)で「アプリの登録」→「新規登録」
   - **サポートされているアカウントの種類**: 「この組織ディレクトリのみに含まれるアカウント」（シングルテナント）
   - リダイレクト URI は Cognito ドメインが確定してから登録するため、この時点では空で構いません
2. 登録後の「概要」ページで以下を控えます
   - **アプリケーション (クライアント) ID** → `ENTRA_CLIENT_ID` に使用
   - **ディレクトリ (テナント) ID** → 環境変数 `ENTRA_TENANT_ID` に使用
3. 「証明書とシークレット」→「新しいクライアントシークレット」を作成し、**値**（シークレット ID ではない方）を控えます

### 2. email クレームを設定する（重要）

Cognito はサインイン時に ID トークンの `email` クレームをユーザー属性にマッピングします。Entra ID の ID トークンにはデフォルトで `email` が含まれない場合があり、その場合サインインが属性マッピングエラーで失敗します。

1. アプリの「トークン構成」→「オプションの要求を追加」
2. トークンの種類: **ID**、要求: **email** を追加
3. 「Microsoft Graph の email アクセス許可を有効にする」を求められたら有効化します
4. 「API のアクセス許可」に Microsoft Graph の委任アクセス許可 `openid` `email` `profile` が並んでいることを確認し、必要に応じて「管理者の同意を与えます」を実行します

> ユーザーの `mail` 属性が空（メールボックスなしのアカウント等）の場合は email クレームが発行されません。その場合は Entra 側でユーザーの連絡先メールを設定してください。

### 3. シークレットを設定してデプロイする

```bash
npx ampx sandbox secret set ENTRA_CLIENT_ID
# プロンプトにアプリケーション (クライアント) ID を貼り付け
npx ampx sandbox secret set ENTRA_CLIENT_SECRET
# プロンプトにクライアントシークレットの「値」を貼り付け

ENTRA_AUTH=true ENTRA_TENANT_ID=<テナントID> HARNESS_ARN=arn:... npx ampx sandbox --once
```

issuer URL（`https://login.microsoftonline.com/<テナントID>/v2.0`）はテンプレートが組み立てるため、指定するのはテナント ID のみです。

### 4. リダイレクト URI を Entra 側に登録する

デプロイで生成された `amplify_outputs.json` の `auth.oauth.domain` に Cognito ドメイン（例: `xxxxxxxx.auth.us-east-1.amazoncognito.com`）が出力されます。Entra ID のアプリ登録の「認証」→「プラットフォームを追加」→「Web」で以下を登録します。

- **リダイレクト URI**: `https://<Cognito ドメイン>/oauth2/idpresponse`

### 5. 動作確認

`npm run dev` でログイン画面を開き、「Microsoft でサインイン」からサインインできることを確認します。

## SSO 専用モード

`SSO_ONLY=true` を付けてデプロイすると、Cognito のパスワードログインが無効になり、アプリにアクセスすると自動で Entra ID のサインイン画面へリダイレクトされます。

```bash
ENTRA_AUTH=true ENTRA_TENANT_ID=<テナントID> SSO_ONLY=true HARNESS_ARN=arn:... npx ampx sandbox --once
```

## 本番デプロイ時の注意

- Amplify Hosting でのブランチデプロイでは、シークレットは Amplify コンソールの「Secrets」（Hosting → Secrets management）に同名キーで設定します
- 本番 URL を `APP_ORIGINS` に追加すると、Cognito のコールバック URL にも自動反映されます

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| サインイン後に `attributes required: [email]` エラー | ID トークンに email クレームがない。[手順 2](#2-email-クレームを設定する--重要) を確認 |
| `AADSTS50011`（リダイレクト URI 不一致） | Entra 側のリダイレクト URI が `https://<Cognito ドメイン>/oauth2/idpresponse` と完全一致しているか確認 |
| `AADSTS7000215`（invalid client secret） | シークレットの「値」ではなく「シークレット ID」を登録している可能性。値を `ampx sandbox secret set ENTRA_CLIENT_SECRET` で再設定 |
