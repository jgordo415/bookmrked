import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UpgradeType = "collections" | "places";

export function UpgradeModal({
  open,
  onOpenChange,
  type,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: UpgradeType;
}) {
  const message =
    type === "collections"
      ? "You've reached the free limit of 5 collections — upgrade to Bookmrked Premium for unlimited collections."
      : "You've reached the free limit of 15 places per collection — upgrade to Bookmrked Premium for unlimited places.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface text-ink sm:max-w-md">
        <DialogHeader>
          <div className="font-mono-tag text-gold">Free limit reached</div>
          <DialogTitle className="font-display text-3xl text-ink">
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          <p className="text-ink-muted">{message}</p>

          <button
            type="button"
            className="w-full rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
          >
            Upgrade
          </button>

          <p className="text-center font-mono-tag text-xs text-ink-muted/60">
            Coming soon
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
