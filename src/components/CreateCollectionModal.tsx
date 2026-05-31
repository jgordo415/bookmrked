import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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

export function CreateCollectionModal({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [shareable, setShareable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setShareable(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        privacy: shareable ? "shareable" : "private",
      })
      .select("id")
      .single();
    setSaving(false);
    if (insertError || !data) {
      setError(insertError?.message ?? "Could not save collection");
      return;
    }
    reset();
    onOpenChange(false);
    navigate({ to: "/collections/$collectionId", params: { collectionId: data.id } });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="border-border bg-surface text-ink sm:max-w-md">
        <DialogHeader>
          <div className="font-mono-tag text-gold">New collection</div>
          <DialogTitle className="font-display text-3xl text-ink">
            Start a collection
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          <div>
            <label className="font-mono-tag text-ink-muted">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Best coffee in Lisbon"
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="font-mono-tag text-ink-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional"
              className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
            />
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
            <div className="font-mono-tag text-ink-muted">Privacy</div>
            <div className="mt-2 inline-flex rounded-md border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setShareable(false)}
                className={`rounded px-4 py-1.5 text-sm transition ${
                  !shareable ? "bg-gold text-primary-foreground" : "text-ink-muted hover:text-ink"
                }`}
              >
                Private
              </button>
              <button
                type="button"
                onClick={() => setShareable(true)}
                className={`rounded px-4 py-1.5 text-sm transition ${
                  shareable ? "bg-gold text-primary-foreground" : "text-ink-muted hover:text-ink"
                }`}
              >
                Shareable
              </button>
            </div>
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
              disabled={saving || !title.trim()}
              className="rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create collection"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}