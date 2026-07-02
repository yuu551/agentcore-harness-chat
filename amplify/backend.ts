import { defineBackend } from "@aws-amplify/backend";
import { Stack, Duration, CfnResource, RemovalPolicy } from "aws-cdk-lib";
import {
  aws_lambda as lambda,
  aws_iam as iam,
  aws_apigateway as apigateway,
  aws_cognito as cognito,
  aws_logs as logs,
  aws_wafv2 as wafv2,
} from "aws-cdk-lib";
import { auth } from "./auth/resource";
import { parameters } from "./parameters";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backend = defineBackend({ auth });

const authStack = Stack.of(backend.auth.resources.userPool);

// ============================================================
// Phase 2: HarnessProxyStack
// ============================================================
const harnessStack = backend.createStack("HarnessProxyStack");

const harnessArn = parameters.harnessArn;

if (!harnessArn) {
  throw new Error(
    "HARNESS_ARN が設定されていません。AWS コンソールで AgentCore Harness を作成し、環境変数 HARNESS_ARN に ARN を設定してください。"
  );
}

const api = new apigateway.RestApi(harnessStack, "HarnessApi", {
  restApiName: "harness-chat-api",
  deployOptions: { stageName: "prod" },
  defaultCorsPreflightOptions: {
    allowOrigins: parameters.appOrigins,
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
});

const proxyLambda = new lambda.Function(harnessStack, "HarnessProxyLambda", {
  runtime: lambda.Runtime.NODEJS_22_X,
  architecture: lambda.Architecture.ARM_64,
  handler: "index.handler",
  code: lambda.Code.fromAsset(
    path.join(__dirname, "functions", "harness-proxy")
  ),
  environment: {
    HARNESS_ARN: harnessArn,
    CORS_ALLOWED_ORIGINS: parameters.appOrigins.join(","),
  },
  timeout: Duration.minutes(5),
});

new logs.LogGroup(harnessStack, "HarnessProxyLogGroup", {
  logGroupName: `/aws/lambda/${proxyLambda.functionName}`,
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: RemovalPolicy.DESTROY,
});

proxyLambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      "bedrock-agentcore:InvokeHarness",
      "bedrock-agentcore:InvokeAgentRuntime",
    ],
    resources: [harnessArn],
  })
);

const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
  harnessStack,
  "HarnessApiAuthorizer",
  { cognitoUserPools: [backend.auth.resources.userPool] }
);

const integration = new apigateway.AwsIntegration({
  proxy: true,
  service: "lambda",
  path: `2021-11-15/functions/${proxyLambda.functionArn}/response-streaming-invocations`,
});

proxyLambda.addPermission("ApiGatewayInvoke", {
  principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
  sourceArn: api.arnForExecuteApi("POST", "/invoke", "*"),
});

const invokeResource = api.root.addResource("invoke");
const method = invokeResource.addMethod("POST", integration, {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO,
});

const cfnMethod = method.node.defaultChild as apigateway.CfnMethod;
cfnMethod.addPropertyOverride("Integration.ResponseTransferMode", "STREAM");
cfnMethod.addPropertyOverride("Integration.TimeoutInMillis", 300000);

// CORS 補完: Cognito Authorizer の 401 時にも CORS ヘッダが付くようにする
api.addGatewayResponse("Default4XXResponse", {
  type: apigateway.ResponseType.DEFAULT_4XX,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
    "Access-Control-Allow-Methods": "'POST,OPTIONS'",
  },
});
api.addGatewayResponse("Default5XXResponse", {
  type: apigateway.ResponseType.DEFAULT_5XX,
  responseHeaders: {
    "Access-Control-Allow-Origin": "'*'",
    "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
    "Access-Control-Allow-Methods": "'POST,OPTIONS'",
  },
});

// ============================================================
// Phase 3-1: セルフサインアップ制御
// ============================================================
const cfnUserPool = backend.auth.resources.userPool.node
  .defaultChild as CfnResource;
if (!parameters.selfSignUp) {
  cfnUserPool.addPropertyOverride(
    "AdminCreateUserConfig.AllowAdminCreateUserOnly",
    true
  );
}

// ============================================================
// 管理ユーザーの自動作成（ADMIN_USER_EMAIL 設定時）
// デプロイ時にユーザーを作成し、仮パスワードをメール送付する。
// セルフサインアップ無効（デフォルト）の環境で最初のログイン手段になる
// ============================================================
if (parameters.adminUserEmail) {
  new cognito.CfnUserPoolUser(authStack, "AdminUser", {
    userPoolId: backend.auth.resources.userPool.userPoolId,
    username: parameters.adminUserEmail,
    userAttributes: [
      { name: "email", value: parameters.adminUserEmail },
      { name: "email_verified", value: "true" },
    ],
    desiredDeliveryMediums: ["EMAIL"],
  });
}

// ============================================================
// Phase 3-2: sso_only — Cognito パスワードログインを無効化
// ============================================================
if (parameters.ssoOnly && !parameters.googleAuth && !parameters.entraAuth) {
  throw new Error(
    "SSO_ONLY には GOOGLE_AUTH または ENTRA_AUTH の有効化が必要です。"
  );
}
if (parameters.ssoOnly) {
  const cfnUserPoolClient = backend.auth.resources.userPoolClient.node
    .defaultChild as CfnResource;
  cfnUserPoolClient.addPropertyOverride("SupportedIdentityProviders", [
    ...(parameters.googleAuth ? ["Google"] : []),
    ...(parameters.entraAuth ? ["EntraID"] : []),
  ]);
}

// ============================================================
// Phase 3-3: WAF IP 制限
// ============================================================
const hasIpV4 = parameters.allowedIpV4Cidrs.length > 0;
const hasIpV6 = parameters.allowedIpV6Cidrs.length > 0;

if (hasIpV4 || hasIpV6) {
  const securityStack = backend.createStack("SecurityStack");
  const wafRules: wafv2.CfnWebACL.RuleProperty[] = [];
  const idPrefix = "harness-chat";

  if (hasIpV4) {
    const ipV4Set = new wafv2.CfnIPSet(securityStack, "WafIpV4Set", {
      name: `${idPrefix}_cognito_allowed_ipv4`,
      scope: "REGIONAL",
      ipAddressVersion: "IPV4",
      addresses: parameters.allowedIpV4Cidrs,
    });
    wafRules.push({
      name: "AllowIPv4",
      priority: 1,
      action: { allow: {} },
      statement: {
        ipSetReferenceStatement: { arn: ipV4Set.attrArn },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${idPrefix}_cognito_waf_allow_ipv4`,
        sampledRequestsEnabled: true,
      },
    });
  }

  if (hasIpV6) {
    const ipV6Set = new wafv2.CfnIPSet(securityStack, "WafIpV6Set", {
      name: `${idPrefix}_cognito_allowed_ipv6`,
      scope: "REGIONAL",
      ipAddressVersion: "IPV6",
      addresses: parameters.allowedIpV6Cidrs,
    });
    wafRules.push({
      name: "AllowIPv6",
      priority: 2,
      action: { allow: {} },
      statement: {
        ipSetReferenceStatement: { arn: ipV6Set.attrArn },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${idPrefix}_cognito_waf_allow_ipv6`,
        sampledRequestsEnabled: true,
      },
    });
  }

  const webAcl = new wafv2.CfnWebACL(securityStack, "CognitoWafWebAcl", {
    name: `${idPrefix}_cognito_waf`,
    scope: "REGIONAL",
    defaultAction: { block: {} },
    rules: wafRules,
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: `${idPrefix}_cognito_waf`,
      sampledRequestsEnabled: true,
    },
  });

  new wafv2.CfnWebACLAssociation(securityStack, "CognitoWafAssociation", {
    webAclArn: webAcl.attrArn,
    resourceArn: backend.auth.resources.userPool.userPoolArn,
  });
}

// ============================================================
// Output
// ============================================================
backend.addOutput({
  custom: {
    harness_proxy_url: api.urlForPath("/invoke"),
    aws_region: authStack.region,
    self_signup: parameters.selfSignUp,
    sso_only: parameters.ssoOnly,
    google_auth: parameters.googleAuth,
    entra_auth: parameters.entraAuth,
    entra_provider_name: "EntraID",
  },
});
