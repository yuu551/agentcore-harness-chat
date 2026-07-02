import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MODELS, type ModelDefinition } from "../lib/models";

const ICONS: Record<ModelDefinition["icon"], LucideIcon> = {
  sliders: SlidersHorizontal,
  sparkles: Sparkles,
  zap: Zap,
};

export function ModelSelector({
  modelId,
  onChange,
  disabled,
}: {
  modelId: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const selected = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const SelectedIcon = ICONS[selected.icon];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
        aria-label="モデルを選択"
      >
        <SelectedIcon className="size-3.5 text-copper" />
        <span className="font-medium">{selected.shortName}</span>
        <ChevronDown className={`size-3.5 text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-card-strong shadow-[var(--shadow-card)]">
          {MODELS.map((model) => {
            const Icon = ICONS[model.icon];
            const isSelected = model.id === selected.id;
            return (
              <button
                key={model.id || "default"}
                type="button"
                onClick={() => {
                  onChange(model.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-copper-soft ${
                  isSelected ? "bg-copper-soft" : ""
                }`}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-copper" />
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">{model.name}</span>
                  <span className="block text-xs text-ink-faint">{model.description}</span>
                </span>
                {isSelected && <Check className="mt-0.5 size-4 shrink-0 text-copper" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
