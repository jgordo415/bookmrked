import { createFileRoute, Link } from "@tanstack/react-router";
import { getSharedCollection } from "@/lib/share.functions";
import { MapPin, Check, Star, Bookmark } from "lucide-react";
import ogImage from "@/assets/og-default.jpg";

function ShareNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="font-mono-tag text-ink-muted">
        This collection isn't available
      </div>
      <Link to="/" className="mt-4 text-gold hover:text-gold-soft">
        Go home
      </Link>
    </main>
  );
}

function ShareError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono-tag text-destructive">Something went wrong</div>
        <p className="mt-2 text-sm text-ink-muted">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/c/$shareToken")({
  staticData: { sitemap: true },
  loader: async ({ params }) => {
    const data = await getSharedCollection({ data: { shareToken: params.shareToken } });
    return data;
  },
  head: ({ params, loaderData }) => {
    const collection = loaderData?.collection ?? null;
    const places = loaderData?.places ?? [];
    const placeCount = places.length;

    const title = collection
      ? `${collection.title} — Bookmrked`
      : "Shared Collection — Bookmrked";

    const descParts: string[] = [];
    if (collection?.description) descParts.push(collection.description);
    descParts.push(`${placeCount} place${placeCount === 1 ? "" : "s"} · Shared collection on Bookmrked`);
    const description = descParts.join(" · ");

    const shareUrl = `https://bookmrked.com/c/${params.shareToken}`;
    const ogImageUrl = `https://bookmrked.com${ogImage}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: shareUrl },
        { property: "og:image", content: ogImageUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImageUrl },
      ],
      links: [
        { rel: "canonical", href: shareUrl },
      ],
    };
  },
  component: SharedCollection,
  notFoundComponent: ShareNotFound,
  errorComponent: ShareError,
});

type SharedCollectionType = {
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
  const { collection, places } = Route.useLoaderData();

  if (!collection) {
    return <ShareNotFound />;
  }

  const total = places.length;
  const visited = places.reduce((acc: number, p: SharedPlace) => acc + (p.visited ? 1 : 0), 0);
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
            {places.map((p: SharedPlace) => (
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
                    "{p.visit_note}"
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
