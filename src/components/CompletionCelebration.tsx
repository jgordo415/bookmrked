import { Check, Share2, Plus } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  collectionTitle: string;
  canShare: boolean;
  onShare: () => void;
  onStartNew: () => void;
  onClose: () => void;
};

export function CompletionCelebration({
  open,
  collectionTitle,
  canShare,
  onShare,
  onStartNew,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collection complete"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 px-6 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-gold/40 bg-surface p-10 text-center shadow-[0_20px_60px_-15px_rgba(212,175,55,0.35)] animate-scale-in"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold/15 ring-2 ring-gold/40 animate-scale-in">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-primary-foreground"
            style={{ animation: "scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both" }}
          >
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
        </div>

        <div className="mt-6 font-mono-tag text-gold">{collectionTitle}</div>
        <h2 className="font-display mt-3 text-4xl text-ink">Collection complete</h2>
        <p className="mt-3 text-ink-muted">Every spot visited.</p>

        <div className="mt-8 flex flex-col gap-3">
          {canShare && (
            <button
              onClick={onShare}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
            >
              <Share2 className="h-4 w-4" strokeWidth={2.5} />
              Share
            </button>
          )}
          <button
            onClick={onStartNew}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gold/40 px-5 py-3 text-sm font-medium text-gold transition hover:bg-gold/10"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Start a new collection
          </button>
          <button
            onClick={onClose}
            className="font-mono-tag mt-1 text-xs text-ink-muted hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}