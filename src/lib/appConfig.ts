import outputs from "../../amplify_outputs.json";

// amplify/backend.ts の backend.addOutput({ custom: {...} }) に対応する型
interface CustomOutputs {
  harness_proxy_url?: string;
  aws_region?: string;
  self_signup?: boolean;
  sso_only?: boolean;
  google_auth?: boolean;
  entra_auth?: boolean;
  entra_provider_name?: string;
}

const custom: CustomOutputs = (outputs as { custom?: CustomOutputs }).custom ?? {};

export const appConfig = {
  harnessProxyUrl: custom.harness_proxy_url ?? "",
  awsRegion: custom.aws_region ?? "",
  selfSignUp: custom.self_signup ?? false,
  ssoOnly: custom.sso_only ?? false,
  googleAuth: custom.google_auth ?? false,
  entraAuth: custom.entra_auth ?? false,
  entraProviderName: custom.entra_provider_name ?? "EntraID",
};
