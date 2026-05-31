import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, MapPin, Check, Star } from "lucide-react";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { MarkVisitedModal, type VisitData } from "@/components/MarkVisitedModal";

export const Route = createFileRoute("/collections/$collectionId")({
  component: CollectionDetail,
});

type Collection = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  privacy: string;
};

type Place = {
  id: string;
  name: string;
  city: string | null;
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
  const [markPlace, setMarkPlace] = useState<Place | null>(null);

  const loadPlaces = useCallback(
    async (uid: string) => {
      const { data: locs } = await supabase
        .from("locations")
        .select("id, name, city, category, notes")
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
        .select("id, title, description, category, privacy")
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

  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-mono-tag text-ink-muted hover:text-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Dashboard
        </Link>

        <div className="mt-12">
          {collection.category && (
            <div className="font-mono-tag text-gold">{collection.category}</div>
          )}
          <h1 className="font-display mt-3 text-5xl text-ink sm:text-6xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-4 max-w-xl text-ink-muted">{collection.description}</p>
          )}
          <div className="mt-4 font-mono-tag text-ink-muted/70">
            {collection.privacy === "shareable" ? "Shareable" : "Private"}
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
              onClick={() => setAddOpen(true)}
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
                onClick={() => setAddOpen(true)}
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
                      <button
                        onClick={() => !isVisited && setMarkPlace(p)}
                        disabled={isVisited}
                        className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium transition ${
                          isVisited
                            ? "border border-gold/40 text-gold"
                            : "bg-gold text-primary-foreground hover:bg-gold-soft"
                        } disabled:cursor-default disabled:opacity-100`}
                      >
                        {isVisited ? "Visited ✓" : "Mark Visited"}
                      </button>
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
              setMarkPlace(null);
            }}
          />
        )}
      </div>
    </main>
  );
}