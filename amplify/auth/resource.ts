import { defineAuth, secret, defineFunction } from "@aws-amplify/backend";
import { parameters } from "../parameters";

const preSignUpFunction = defineFunction({
  name: "pre-sign-up",
  entry: "../functions/pre-sign-up/handler.ts",
  environment: {
    ALLOWED_EMAIL_DOMAINS: parameters.allowedEmailDomains.join(","),
  },
});

export const auth = defineAuth({
  loginWith: {
    email: true,
    ...(parameters.googleAuth || parameters.entraAuth
      ? {
          externalProviders: {
            ...(parameters.googleAuth
              ? {
                  google: {
                    clientId: secret("GOOGLE_CLIENT_ID"),
                    clientSecret: secret("GOOGLE_CLIENT_SECRET"),
                    scopes: ["openid", "email", "profile"],
                    attributeMapping: {
                      email: "email",
                      fullname: "name",
                    },
                  },
                }
              : {}),
            ...(parameters.entraAuth
              ? {
                  oidc: [
                    {
                      name: "EntraID",
                      clientId: secret("ENTRA_CLIENT_ID"),
                      clientSecret: secret("ENTRA_CLIENT_SECRET"),
                      issuerUrl: `https://login.microsoftonline.com/${parameters.entraTenantId}/v2.0`,
                      scopes: ["openid", "email", "profile"],
                      attributeMapping: {
                        email: "email",
                        fullname: "name",
                      },
                    },
                  ],
                }
              : {}),
            callbackUrls: parameters.appOrigins.map(
              (o) => `${o.replace(/\/$/, "")}/`
            ),
            logoutUrls: parameters.appOrigins.map(
              (o) => `${o.replace(/\/$/, "")}/`
            ),
          },
        }
      : {}),
  },
  ...(parameters.allowedEmailDomains.length > 0
    ? { triggers: { preSignUp: preSignUpFunction } }
    : {}),
});
