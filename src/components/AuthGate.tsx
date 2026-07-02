import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Authenticator,
  translations,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import { signInWithRedirect } from "aws-amplify/auth";
import { Hub, I18n } from "aws-amplify/utils";
import { Waypoints } from "lucide-react";
import "@aws-amplify/ui-react/styles.css";
import { appConfig } from "../lib/appConfig";

I18n.putVocabularies(translations);
I18n.setLanguage("ja");
// 公式辞書の表記が固い・末尾に空白があるキーだけ上書きする
I18n.putVocabulariesForLanguage("ja", {
  "Sign In with Google": "Google でサインイン",
  or: "または",
  Password: "パスワード",
  "Forgot your password?": "パスワードをお忘れですか？",
});

const MAX_SSO_RETRIES = 2;
const SSO_REDIRECT_KEY = "harness_chat_sso_redirected";

export function AuthGate({ children }: { children: ReactNode }) {
  if (appConfig.ssoOnly) {
    return <SsoGate>{children}</SsoGate>;
  }

  return (
    <Authenticator
      hideSignUp={!appConfig.selfSignUp}
      components={{
        Header() {
          return (
            <div className="mb-6 flex flex-col items-center gap-3 pt-10">
              <div className="grid size-12 place-items-center rounded-xl bg-copper">
                <Waypoints className="size-6 text-white" />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                Harness Chat
              </h1>
              <p className="text-sm text-ink-faint">
                AgentCore Harness エージェントと対話する
              </p>
            </div>
          );
        },
        ...(appConfig.entraAuth
          ? {
              // カスタム OIDC プロバイダは Amplify UI が自動でボタンを出さないため、
              // Google の federated ボタンと同じクラスを使って同じ見た目で先頭に並べる
              SignIn: {
                Header() {
                  return (
                    <div className="px-8 pt-8 -mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          signInWithRedirect({
                            provider: {
                              custom: appConfig.entraProviderName,
                            },
                          })
                        }
                        className="amplify-button amplify-field-group__control federated-sign-in-button"
                        style={{ gap: "1rem", width: "100%" }}
                      >
                        <span className="amplify-text">
                          Microsoft でサインイン
                        </span>
                      </button>
                    </div>
                  );
                },
              },
            }
          : {}),
      }}
    >
      {children}
    </Authenticator>
  );
}

function SsoGate({ children }: { children: ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(
    Number(sessionStorage.getItem(SSO_REDIRECT_KEY) || "0")
  );

  useEffect(() => {
    if (authStatus === "authenticated") {
      sessionStorage.removeItem(SSO_REDIRECT_KEY);
      retryCount.current = 0;
      return;
    }
    if (authStatus !== "unauthenticated") return;

    if (retryCount.current >= MAX_SSO_RETRIES) {
      setError("SSO 認証が繰り返し失敗しました。");
      return;
    }

    retryCount.current += 1;
    sessionStorage.setItem(SSO_REDIRECT_KEY, String(retryCount.current));
    signInWithRedirect();
  }, [authStatus]);

  useEffect(() => {
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signInWithRedirect_failure") {
        const message =
          (payload.data as { message?: string })?.message ??
          "認証に失敗しました";
        retryCount.current += 1;
        sessionStorage.setItem(SSO_REDIRECT_KEY, String(retryCount.current));
        if (retryCount.current >= MAX_SSO_RETRIES) {
          setError(message);
        }
      }
    });
    return unsubscribe;
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-4">
        <div className="grid size-12 place-items-center rounded-xl bg-copper/20">
          <Waypoints className="size-6 text-copper" />
        </div>
        <p className="text-center text-sm text-ink-faint">
          SSO ログインに失敗しました。
        </p>
        <p className="max-w-md text-center text-xs text-ink-faint/70">
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            retryCount.current = 0;
            sessionStorage.removeItem(SSO_REDIRECT_KEY);
            signInWithRedirect();
          }}
          className="mt-2 rounded-full border border-line bg-card px-4 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
        >
          再試行
        </button>
      </div>
    );
  }

  if (authStatus === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <p className="text-sm text-ink-faint">SSO 認証にリダイレクト中...</p>
    </div>
  );
}
