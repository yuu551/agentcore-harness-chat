import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ChatInput({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-card shadow-[var(--shadow-card)] transition-colors focus-within:border-copper">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={placeholder ?? "メッセージを入力"}
        className="max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-7 text-ink outline-none placeholder:text-ink-faint"
      />
      <div className="flex items-center justify-between px-3 pb-2.5">
        <span className="px-1 text-xs text-ink-faint">Enter で送信 / Shift + Enter で改行</span>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="grid size-9 place-items-center rounded-full bg-copper text-white transition-all hover:bg-copper-strong active:scale-95 disabled:opacity-35"
          title="送信"
          aria-label="メッセージを送信"
        >
          <ArrowUp className="size-4.5" />
        </button>
      </div>
    </div>
  );
}
