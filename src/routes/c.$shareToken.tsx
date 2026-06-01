import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Check, Star, Bookmark } from "lucide-react";

export const Route = createFileRoute("/c/$shareToken")({
  component: SharedCollection,
});

type SharedCollection = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  privacy: string;
  share_token: string;
};

type SharedPlace = {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  notes: string | null;
  visited: boolean;
  star_rating: number | null;
  visit_note: string | null;
};

function SharedCollection() {
  const { shareToken } = Route.useParams();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [places, setPlaces] = useState<SharedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: cData } = await supabase.rpc("get_shared_collection", {
        _token: shareToken,
      });
      if (!active) return;
      const c = (cData ?? [])[0] as SharedCollection | undefined;
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCollection(c);
      const { data: pData } = await supabase.rpc("get_shared_places", {
        _token: shareToken,
      });
      if (!active) return;
      setPlaces((pData ?? []) as SharedPlace[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [shareToken]);

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
        <div className="font-mono-tag text-ink-muted">
          This collection isn’t available
        </div>
        <Link to="/" className="mt-4 text-gold hover:text-gold-soft">
          Go home
        </Link>
      </main>
    );
  }

  const total = places.length;
  const visited = places.reduce((acc, p) => acc + (p.visited ? 1 : 0), 0);
  const pct = total === 0 ? 0 : Math.round((visited / total) * 100);

  return (
    <main className="min-h-screen bg-background px-5 pb-20 pt-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono-tag text-ink-muted hover:text-gold"
        >
          <Bookmark className="h-3.5 w-3.5" strokeWidth={2.5} />
          Bookmrked
        </Link>

        <div className="mt-12">
          {collection.category && (
            <div className="font-mono-tag text-gold">{collection.category}</div>
          )}
          <h1 className="font-display mt-3 text-5xl text-ink sm:text-6xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-4 max-w-xl text-ink-muted">
              {collection.description}
            </p>
          )}
          <div className="mt-4 font-mono-tag text-ink-muted/70">Shared collection</div>
        </div>

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

        {places.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <MapPin className="mx-auto h-6 w-6 text-gold" strokeWidth={2} />
            <h2 className="font-display mt-4 text-3xl text-ink">No places yet</h2>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {places.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-border bg-surface/60 p-5"
              >
                <div className="flex items-center gap-2">
                  {p.visited && (
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
                  {p.visited && p.star_rating && p.star_rating > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= (p.star_rating ?? 0)
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
                {p.visited && p.visit_note && (
                  <p className="mt-2 text-sm italic text-ink-muted">
                    “{p.visit_note}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16 rounded-xl border border-border bg-surface/40 p-6 text-center">
          <p className="font-mono-tag text-ink-muted">
            Build your own collections
          </p>
          <Link
            to="/"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
          >
            Try Bookmrked
          </Link>
        </div>
      </div>
    </main>
  );
}