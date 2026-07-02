# WAF による IP 制限

AWS WAF の Web ACL を Cognito User Pool に関連付け、許可した CIDR 以外からのログインをブロックします。社内ネットワークや VPN の固定 IP からのみ利用させたい場合に有効化してください。

## 設定方法

許可する CIDR をカンマ区切りで指定してデプロイします。IPv4 / IPv6 は片方だけでも構いません。**どちらも未指定の場合、WAF リソースは作成されません。**

```bash
ALLOWED_IPV4_CIDRS=203.0.113.0/24,198.51.100.10/32 \
ALLOWED_IPV6_CIDRS=2001:db8::/32 \
HARNESS_ARN=arn:... npx ampx sandbox --once
```

自分のグローバル IP は次のコマンドで確認できます。

```bash
curl https://checkip.amazonaws.com
```

## 作成されるリソースと動作

| リソース | 内容 |
|---|---|
| WAF IP Set（IPv4 / IPv6） | 許可 CIDR のリスト |
| WAF Web ACL（REGIONAL） | デフォルトアクション **block**、IP Set に一致するリクエストのみ allow |
| Web ACL Association | Cognito User Pool への関連付け |

許可 CIDR 外からアクセスすると、Cognito の認証エンドポイント（サインイン・トークン発行・サインアップなど）への通信がブロックされ、ログインできなくなります。ブロック状況は CloudWatch メトリクス（`harness-chat_cognito_waf`）で確認できます。

## 保護範囲の注意点

- この WAF が保護するのは **Cognito User Pool** です。チャット API（API Gateway）と画面配信（Amplify Hosting / ローカル開発サーバー）は対象外です
- ただしチャット API は Cognito の JWT がないと呼び出せないため、「許可 IP 外からはログインできない = API も実質使えない」という守り方になります
- **発行済みのトークンは有効期限まで利用できます**。許可 IP 内でログインした後にネットワークを移動した場合、トークン失効までは API を呼び出せる点に留意してください

## Amplify Hosting にも IP 制限をかける（オプション）

画面配信そのものも許可 IP 外から見せたくない場合は、Amplify Hosting の Firewall（WAF 統合）をコンソールから設定します。Hosting アプリはこのテンプレートの IaC 管理外のため、コンソールでの設定になります。

1. Amplify コンソールで対象アプリを開き、「Firewall」を選択
2. 「IP address restriction」で許可する CIDR を登録して保存

> Amplify Hosting の Firewall は CloudFront スコープの WAF が別途作成されるため、WAF の固定費がもう 1 セット発生します。

## コスト

WAF は有効化すると固定費が発生します（2026 年時点の目安）。

- Web ACL: $5.00/月
- ルール: $1.00/月 × ルール数（IPv4 + IPv6 で最大 2 ルール）
- リクエスト: $0.60/100 万リクエスト

ログイン時のみ通過するトラフィックのため、リクエスト課金は実質無視できる規模です。
