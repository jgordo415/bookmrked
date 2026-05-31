import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, MapPin } from "lucide-react";

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

function CollectionDetail() {
  const { collectionId } = Route.useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/" });
        return;
      }
      const { data } = await supabase
        .from("collections")
        .select("id, title, description, category, privacy")
        .eq("id", collectionId)
        .maybeSingle();
      if (!active) return;
      if (!data) setNotFound(true);
      else setCollection(data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [collectionId, navigate]);

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

        <div className="mt-16 rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
          <MapPin className="mx-auto h-6 w-6 text-gold" strokeWidth={2} />
          <h2 className="font-display mt-4 text-3xl text-ink">No places yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-ink-muted">
            Start filling this collection with spots worth remembering.
          </p>
          <button className="mt-8 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add a place
          </button>
        </div>
      </div>
    </main>
  );
}