import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { LogOut, Moon, SquarePen, Sun, Waypoints } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { ModelSelector } from "./ModelSelector";

// SSO（フェデレーション）ユーザーは signInDetails.loginId が入らないため、
// どのログイン方式でも共通して入る ID トークンの email クレームから取得する
function useUserEmail(username: string | undefined) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAuthSession()
      .then((session) => {
        const claim = session.tokens?.idToken?.payload?.email;
        if (!cancelled && typeof claim === "string") setEmail(claim);
      })
      .catch(() => {
        // 表示専用のため失敗時は空のまま
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  return email;
}

export function Header({
  modelId,
  onModelChange,
  onNewConversation,
  isStreaming,
}: {
  modelId: string;
  onModelChange: (modelId: string) => void;
  onNewConversation: () => void;
  isStreaming: boolean;
}) {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const { theme, toggle } = useTheme();
  const email = useUserEmail(user?.username);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-copper">
            <Waypoints className="size-4.5 text-white" />
          </div>
          <h1 className="font-display truncate text-lg font-semibold tracking-tight text-ink">
            Harness Chat
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector modelId={modelId} onChange={onModelChange} disabled={isStreaming} />

          <button
            type="button"
            onClick={onNewConversation}
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            title="新しい会話"
          >
            <SquarePen className="size-3.5" />
            <span className="hidden sm:inline">新しい会話</span>
          </button>

          <button
            type="button"
            onClick={toggle}
            className="grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-copper-soft hover:text-ink"
            title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
            aria-label="テーマを切り替え"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <div className="ml-1 hidden items-center gap-2 border-l border-line pl-3 md:flex">
            <span className="max-w-40 truncate text-xs text-ink-faint">
              {email || (user?.signInDetails?.loginId ?? "")}
            </span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-copper-soft hover:text-ink"
            title="サインアウト"
            aria-label="サインアウト"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
