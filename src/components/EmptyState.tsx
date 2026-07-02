import { ArrowUpRight, Waypoints } from "lucide-react";

const SUGGESTIONS = [
  "あなたにできることを教えてください",
  "利用できるツールを一覧にして説明して",
  "アイデア出しを手伝ってください",
];

export function EmptyState({
  onSuggestion,
  disabled,
}: {
  onSuggestion: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-24">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-copper-soft">
        <Waypoints className="size-7 text-copper" />
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
        何をお手伝いしましょうか
      </h2>
      <p className="mt-3 max-w-md text-center text-sm leading-6 text-ink-soft">
        AgentCore Harness に接続されたエージェントと対話できます。
        ツールの実行過程もリアルタイムに確認できます。
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(suggestion)}
            className="group flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm text-ink-soft transition-all hover:border-copper hover:text-ink disabled:opacity-50"
          >
            {suggestion}
            <ArrowUpRight className="size-3.5 text-ink-faint transition-colors group-hover:text-copper" />
          </button>
        ))}
      </div>
    </div>
  );
}
