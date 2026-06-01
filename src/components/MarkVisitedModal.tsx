import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

const MAX_NOTE = 150;

export type VisitData = {
  star_rating: number;
  note: string | null;
  visited_at: string;
};

export function MarkVisitedModal({
  open,
  onOpenChange,
  locationId,
  userId,
  placeName,
  onSaved,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  locationId: string;
  userId: string;
  placeName: string;
  onSaved: (data: VisitData) => void;
  initial?: VisitData | null;
}) {
  const isEdit = Boolean(initial);
  const [rating, setRating] = useState(initial?.star_rating ?? 0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(initial?.star_rating ?? 0);
    setHover(0);
    setNote(initial?.note ?? "");
    setError(null);
  };

  const handleSave = async () => {
    if (rating < 1) {
      setError("Pick a star rating");
      return;
    }
    setSaving(true);
    setError(null);
    const trimmed = note.slice(0, MAX_NOTE).trim();
    const visited_at = isEdit ? initial!.visited_at : new Date().toISOString();
    const { error: err } = isEdit
      ? await supabase
          .from("visits")
          .update({ star_rating: rating, note: trimmed || null })
          .eq("location_id", locationId)
          .eq("user_id", userId)
      : await supabase.from("visits").insert({
          location_id: locationId,
          user_id: userId,
          star_rating: rating,
          note: trimmed || null,
          visited_at,
        });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved({ star_rating: rating, note: trimmed || null, visited_at });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-border bg-surface text-ink sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-ink">
            {isEdit ? "Edit visit" : "Mark visited"}
          </DialogTitle>
          <p className="font-mono-tag text-ink-muted">{placeName}</p>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          <div>
            <label className="font-mono-tag text-ink-muted">Rating</label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hover || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-7 w-7 transition ${
                        filled ? "fill-gold text-gold" : "text-ink-muted"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="font-mono-tag text-ink-muted">Notes</label>
              <span className="font-mono-tag text-xs text-ink-muted/70">
                {note.length} / {MAX_NOTE}
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
              rows={3}
              placeholder="A line worth remembering…"
              className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
            />
          </div>

          {error && (
            <div className="font-mono-tag text-sm text-red-400">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="font-mono-tag text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save visit"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}