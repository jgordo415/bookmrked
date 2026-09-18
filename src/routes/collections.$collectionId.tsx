import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, MapPin, Check, Star, Share2, Pencil, Trash2 } from "lucide-react";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { MarkVisitedModal, type VisitData } from "@/components/MarkVisitedModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { BottomNav } from "@/components/BottomNav";
import { CompletionCelebration } from "@/components/CompletionCelebration";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/collections/$collectionId")({
  staticData: { sitemap: false },
  component: CollectionDetail,
});

type Collection = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  privacy: string;
  share_token: string | null;
};

type Place = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
};

function CollectionDetail() {
  const { collectionId } = Route.useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [visits, setVisits] = useState<Record<string, VisitData>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [markPlace, setMarkPlace] = useState<Place | null>(null);
  const [editPlace, setEditPlace] = useState<Place | null>(null);
  const [deletePlace, setDeletePlace] = useState<Place | null>(null);
  const [editVisitPlace, setEditVisitPlace] = useState<Place | null>(null);
  const [copied, setCopied] = useState(false);
  const [unmarkPlace, setUnmarkPlace] = useState<Place | null>(null);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingCollection, setSavingCollection] = useState(false);
  const [deleteCollectionOpen, setDeleteCollectionOpen] = useState(false);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  const { showToast } = useToast();

  const loadPlaces = useCallback(
    async (uid: string) => {
      const { data: locs } = await supabase
        .from("locations")
        .select("id, name, city, address, category, notes")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false });
      const list = (locs ?? []) as Place[];
      setPlaces(list);

      if (list.length === 0) {
        setVisits({});
        return;
      }
      const { data: visitRows } = await supabase
        .from("visits")
        .select("location_id, star_rating, note, visited_at")
        .eq("user_id", uid)
        .in(
          "location_id",
          list.map((p) => p.id),
        );
      const map: Record<string, VisitData> = {};
      for (const v of visitRows ?? []) {
        map[v.location_id] = {
          star_rating: v.star_rating ?? 0,
          note: v.note,
          visited_at: v.visited_at,
        };
      }
      setVisits(map);
    },
    [collectionId],
  );

  const handleAddPlaceClick = () => {
    if (places.length >= 15) {
      setUpgradeOpen(true);
    } else {
      setAddOpen(true);
    }
  };

  const handleDeletePlace = async () => {
    if (!deletePlace || !userId) return;
    const id = deletePlace.id;
    await supabase.from("visits").delete().eq("location_id", id).eq("user_id", userId);
    await supabase.from("locations").delete().eq("id", id);
    setDeletePlace(null);
    await loadPlaces(userId);
  };

  const handleUnmarkVisit = async () => {
    if (!unmarkPlace || !userId) return;
    await supabase.from("visits").delete().eq("location_id", unmarkPlace.id).eq("user_id", userId);
    setVisits((prev) => {
      const next = { ...prev };
      delete next[unmarkPlace.id];
      return next;
    });
    setUnmarkPlace(null);
    showToast("Unvisited");
  };

  const handleUpdateCollection = async () => {
    if (!collection || !userId) return;
    const title = editTitle.trim();
    if (!title) return;
    setSavingCollection(true);
    const { error: err } = await supabase
      .from("collections")
      .update({ title, description: editDescription.trim() || null })
      .eq("id", collection.id)
      .eq("user_id", userId);
    setSavingCollection(false);
    if (err) return;
    setCollection((prev) => prev ? { ...prev, title, description: editDescription.trim() || null } : prev);
    setEditCollectionOpen(false);
    showToast("Changes saved");
  };

  const handleDeleteCollection = async () => {
    if (!collection || !userId) return;
    const { data: locs } = await supabase.from("locations").select("id").eq("collection_id", collectionId);
    const locIds = (locs ?? []).map((l) => l.id);
    if (locIds.length > 0) {
      await supabase.from("visits").delete().in("location_id", locIds).eq("user_id", userId);
      await supabase.from("locations").delete().in("id", locIds);
    }
    await supabase.from("collections").delete().eq("id", collectionId);
    setDeleteCollectionOpen(false);
    navigate({ to: "/dashboard" });
  };

  const handleTogglePrivacy = async () => {
    if (!collection || !userId || togglingPrivacy) return;
    setTogglingPrivacy(true);
    const makeShareable = collection.privacy !== "shareable";
    let nextToken = collection.share_token;
    if (makeShareable && !nextToken) {
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      nextToken = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
    const update = makeShareable
      ? { privacy: "shareable", share_token: nextToken }
      : { privacy: "private", share_token: null };
    const { error: err } = await supabase
      .from("collections")
      .update(update)
      .eq("id", collection.id)
      .eq("user_id", userId);
    setTogglingPrivacy(false);
    if (err) return;
    setCollection((prev) =>
      prev ? { ...prev, privacy: update.privacy, share_token: update.share_token } : prev,
    );
    showToast(makeShareable ? "Now shareable" : "Now private");
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/" });
        return;
      }
      if (!active) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("collections")
        .select("id, title, description, category, privacy, share_token")
        .eq("id", collectionId)
        .maybeSingle();
      if (!active) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCollection(data);
      await loadPlaces(user.id);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [collectionId, navigate, loadPlaces]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono-tag text-ink-muted">Loading…</div>
      </main>
    );
  }

  if (notFound || !collection) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="font-mono-tag text-ink-muted">Collection not found</div>
        <Link to="/dashboard" className="mt-4 text-gold hover:text-gold-soft">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const total = places.length;
  const visited = places.reduce((acc, p) => acc + (visits[p.id] ? 1 : 0), 0);
  const pct = total === 0 ? 0 : Math.round((visited / total) * 100);

  const handleShare = async () => {
    if (!collection.share_token) return;
    const url = `https://bookmrked.com/c/${collection.share_token}`;
    const shareData = { title: collection.title, text: `Check out "${collection.title}" on Bookmrked`, url };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        showToast("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        // Share failed for a non-user reason — fall back to clipboard
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          showToast("Copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard also unavailable — silently fail
        }
      }
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 font-mono-tag text-ink-muted hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            Dashboard
          </Link>
          <button
            onClick={handleShare}
            disabled={collection.privacy !== "shareable" || !collection.share_token}
            className="inline-flex items-center gap-2 rounded-md border border-gold/40 px-3 py-1.5 font-mono-tag text-xs text-gold transition hover:bg-gold hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold"
          >
            <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />
            {copied ? "Link copied" : "Share"}
          </button>
        </div>

        <div className="mt-12">
          {collection.category && (
            <div className="font-mono-tag text-gold">{collection.category}</div>
          )}
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display mt-3 text-5xl text-ink sm:text-6xl">
              {collection.title}
            </h1>
            <div className="mt-3 flex items-center gap-1">
              <button
                onClick={() => { setEditTitle(collection.title); setEditDescription(collection.description ?? ""); setEditCollectionOpen(true); }}
                aria-label="Edit collection"
                className="rounded-md p-2 text-ink-muted transition hover:bg-surface-raised hover:text-gold"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                onClick={() => setDeleteCollectionOpen(true)}
                aria-label="Delete collection"
                className="rounded-md p-2 text-ink-muted transition hover:bg-surface-raised hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
          {collection.description && (
            <p className="mt-4 max-w-xl text-ink-muted">{collection.description}</p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => { if (collection.privacy !== "private") handleTogglePrivacy(); }}
              disabled={togglingPrivacy}
              className={`rounded px-3 py-1 font-mono-tag text-xs transition ${
                collection.privacy === "private"
                  ? "bg-gold text-primary-foreground"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Private
            </button>
            <button
              type="button"
              onClick={() => { if (collection.privacy !== "shareable") handleTogglePrivacy(); }}
              disabled={togglingPrivacy}
              className={`rounded px-3 py-1 font-mono-tag text-xs transition ${
                collection.privacy === "shareable"
                  ? "bg-gold text-primary-foreground"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Shareable
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between">
            <span className="font-mono-tag text-ink-muted">Visited</span>
            <span className="font-mono-tag text-ink">
              {visited} / {total}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Places */}
        {places.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <MapPin className="mx-auto h-6 w-6 text-gold" strokeWidth={2} />
            <h2 className="font-display mt-4 text-3xl text-ink">No places yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-ink-muted">
              Start filling this collection with spots worth remembering.
            </p>
            <button
              onClick={handleAddPlaceClick}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Add a place
            </button>
          </div>
        ) : (
          <>
            <div className="mt-10 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Places</h2>
              <button
                onClick={handleAddPlaceClick}
                className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add a place
              </button>
            </div>
            <ul className="mt-6 space-y-3">
              {places.map((p) => {
                const visit = visits[p.id];
                const isVisited = Boolean(visit);
                return (
                  <li
                    key={p.id}
                    className="rounded-xl border border-border bg-surface/60 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isVisited && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold text-primary-foreground">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                          <div className="font-display text-2xl text-ink">{p.name}</div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                          {p.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                              {p.city}
                            </span>
                          )}
                          {p.category && (
                            <span className="font-mono-tag rounded-full border border-border px-2 py-0.5 text-gold">
                              {p.category}
                            </span>
                          )}
                          {isVisited && visit.star_rating > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={`h-3.5 w-3.5 ${
                                    n <= visit.star_rating
                                      ? "fill-gold text-gold"
                                      : "text-ink-muted/40"
                                  }`}
                                  strokeWidth={1.5}
                                />
                              ))}
                            </span>
                          )}
                        </div>
                        {p.notes && (
                          <p className="mt-3 text-sm text-ink-muted">{p.notes}</p>
                        )}
                        {isVisited && visit.note && (
                          <p className="mt-2 text-sm italic text-ink-muted">
                            “{visit.note}”
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {isVisited ? (
                          <button
                            onClick={() => setUnmarkPlace(p)}
                            className="rounded-md border border-gold/40 px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold/10"
                          >
                            Visited ✓
                          </button>
                        ) : (
                          <button
                            onClick={() => setMarkPlace(p)}
                            className="rounded-md bg-gold px-3 py-2 text-xs font-medium text-primary-foreground transition hover:bg-gold-soft"
                          >
                            Mark Visited
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          {isVisited && (
                            <button
                              onClick={() => setEditVisitPlace(p)}
                              aria-label="Edit visit"
                              className="rounded-md p-1.5 text-ink-muted transition hover:bg-surface-raised hover:text-gold"
                            >
                              <Star className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          )}
                          <button
                            onClick={() => setEditPlace(p)}
                            aria-label="Edit place"
                            className="rounded-md p-1.5 text-ink-muted transition hover:bg-surface-raised hover:text-gold"
                          >
                            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setDeletePlace(p)}
                            aria-label="Delete place"
                            className="rounded-md p-1.5 text-ink-muted transition hover:bg-surface-raised hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {userId && (
          <AddPlaceModal
            open={addOpen}
            onOpenChange={setAddOpen}
            collectionId={collection.id}
            defaultCategory={collection.category}
            onCreated={() => loadPlaces(userId)}
          />
        )}

        {userId && editPlace && (
          <AddPlaceModal
            open={Boolean(editPlace)}
            onOpenChange={(v) => { if (!v) setEditPlace(null); }}
            collectionId={collection.id}
            defaultCategory={collection.category}
            place={editPlace}
            onCreated={() => { setEditPlace(null); loadPlaces(userId); }}
          />
        )}

        {userId && markPlace && (
          <MarkVisitedModal
            open={Boolean(markPlace)}
            onOpenChange={(v) => {
              if (!v) setMarkPlace(null);
            }}
            locationId={markPlace.id}
            userId={userId}
            placeName={markPlace.name}
            onSaved={(data) => {
              setVisits((prev) => ({ ...prev, [markPlace.id]: data }));
              const wasVisited = Boolean(visits[markPlace.id]);
              if (!wasVisited && places.length > 0) {
                const visitedCount = places.reduce(
                  (acc, p) => acc + (p.id === markPlace.id || visits[p.id] ? 1 : 0),
                  0,
                );
                if (visitedCount === places.length) {
                  setCelebrationOpen(true);
                }
              }
              setMarkPlace(null);
            }}
          />
        )}

        {userId && editVisitPlace && (
          <MarkVisitedModal
            open={Boolean(editVisitPlace)}
            onOpenChange={(v) => { if (!v) setEditVisitPlace(null); }}
            locationId={editVisitPlace.id}
            userId={userId}
            placeName={editVisitPlace.name}
            initial={visits[editVisitPlace.id] ?? null}
            onSaved={(data) => {
              setVisits((prev) => ({ ...prev, [editVisitPlace.id]: data }));
              setEditVisitPlace(null);
            }}
          />
        )}

        <BottomNav />

        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          type="places"
        />

        <AlertDialog open={Boolean(deletePlace)} onOpenChange={(v) => { if (!v) setDeletePlace(null); }}>
          <AlertDialogContent className="border-border bg-surface text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl text-ink">
                Delete this place?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                {deletePlace ? `"${deletePlace.name}" will be removed from this collection along with your visit record. This can't be undone.` : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border bg-transparent text-ink hover:bg-surface-raised">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePlace}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unmark visit */}
        <AlertDialog open={Boolean(unmarkPlace)} onOpenChange={(v) => { if (!v) setUnmarkPlace(null); }}>
          <AlertDialogContent className="border-border bg-surface text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl text-ink">
                Mark as not visited?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                {unmarkPlace ? `"${unmarkPlace.name}" will be marked as unvisited and your rating and notes will be removed.` : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border bg-transparent text-ink hover:bg-surface-raised">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnmarkVisit}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Unmark
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit collection */}
        <Dialog open={editCollectionOpen} onOpenChange={(v) => { if (!v) setEditCollectionOpen(false); }}>
          <DialogContent className="border-border bg-surface text-ink sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-ink">Edit collection</DialogTitle>
            </DialogHeader>
            <div className="mt-2 space-y-4">
              <div>
                <label className="font-mono-tag text-ink-muted">Name</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Collection name"
                  className="mt-2 border-border bg-background text-ink placeholder:text-ink-muted/60"
                />
              </div>
              <div>
                <label className="font-mono-tag text-ink-muted">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description"
                  className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditCollectionOpen(false)}
                  className="font-mono-tag text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCollection}
                  disabled={savingCollection || !editTitle.trim()}
                  className="rounded-md bg-gold px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft disabled:opacity-60"
                >
                  {savingCollection ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete collection */}
        <AlertDialog open={deleteCollectionOpen} onOpenChange={(v) => { if (!v) setDeleteCollectionOpen(false); }}>
          <AlertDialogContent className="border-border bg-surface text-ink">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl text-ink">
                Delete this collection?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-ink-muted">
                {collection ? `"${collection.title}" and all its places will be removed. This cannot be undone.` : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border bg-transparent text-ink hover:bg-surface-raised">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCollection}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <CompletionCelebration
        open={celebrationOpen}
        collectionTitle={collection.title}
        canShare={collection.privacy === "shareable" && Boolean(collection.share_token)}
        onShare={() => {
          handleShare();
        }}
        onStartNew={() => {
          setCelebrationOpen(false);
          navigate({ to: "/dashboard" });
        }}
        onClose={() => setCelebrationOpen(false)}
      />
    </main>
  );
}