import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import { AuthGate } from "./components/AuthGate";
import App from "./App";
import "./index.css";

Amplify.configure(outputs);

// 開発時のみ: `/?preview` で認証をスキップしてデザイン確認できる
// （Authenticator.Provider は useAuthenticator のコンテキストを提供するだけで、サインインは要求しない）
const isPreview =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isPreview ? (
      <Authenticator.Provider>
        <App />
      </Authenticator.Provider>
    ) : (
      <Authenticator.Provider>
        <AuthGate>
          <App />
        </AuthGate>
      </Authenticator.Provider>
    )}
  </StrictMode>,
);
