import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  "Food and drink",
  "Coffee and cafés",
  "Bars and nightlife",
  "Art and museums",
  "Music and record shops",
  "Books and bookstores",
  "Travel and neighborhoods",
  "Other",
];

const NOTE_MAX = 150;

export function AddPlaceModal({
  open,
  onOpenChange,
  collectionId,
  defaultCategory,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  collectionId: string;
  defaultCategory: string | null;
  onCreated: () => void;
}) {
  const initialCategory =
    defaultCategory && CATEGORIES.includes(defaultCategory) ? defaultCategory : CATEGORIES[0];

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setCategory(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultCategory]);

  const reset = () => {
    setName("");
    setCity("");
    setNeighborhood("");
    setCategory(initialCategory);
    setNotes("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    setSaving(true);
    setError(null);
    const address = neighborhood.trim() || null;
    const { error: insertError } = await supabase.from("locations").insert({
      collection_id: collectionId,
      name: name.trim(),
      city: city.trim(),
      address,
      category,
      notes: notes.trim() ? notes.trim().slice(0, NOTE_MAX) : null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    reset();
    onOpenChange(false);
    onCreated();
  };

  const remaining = NOTE_MAX - notes.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="border-border bg-surface text-ink sm:max-w-md">
        <DialogHeader>
          <div className="font-mono-tag text-gold">New place</div>
          <DialogTitle className="font-display text-3xl text-ink">
            Add a place
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          <div>
            <label className="font-mono-tag text-ink-muted">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hello, Kristof"
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono-tag text-ink-muted">City</label>
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lisbon"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-mono-tag text-ink-muted">Neighborhood</label>
              <input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Optional"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-mono-tag text-ink-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-ink focus:border-gold focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-background text-ink">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="font-mono-tag text-ink-muted">Notes</label>
              <span
                className={`font-mono-tag ${
                  remaining < 0 ? "text-destructive" : "text-ink-muted/70"
                }`}
              >
                {notes.length}/{NOTE_MAX}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, NOTE_MAX))}
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Optional — free tier limit 150 characters"
              className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="font-mono-tag text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !city.trim()}
              className="rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add place"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}