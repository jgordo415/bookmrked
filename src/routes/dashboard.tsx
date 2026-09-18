import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Bookmark, Plus, Trash2, X, Check } from "lucide-react";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { BottomNav } from "@/components/BottomNav";
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

export const Route = createFileRoute("/dashboard")({
  staticData: { sitemap: false },
  component: Dashboard,
});

type CollectionCard = {
  id: string;
  title: string;
  category: string | null;
  locationCount: number;
  completion: number; // 0-100
};

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionCard[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const [deleteCollectionTitle, setDeleteCollectionTitle] = useState("");
  const [onboardingDismissed, setOnboardingDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem("bookmrked_onboarding_dismissed") === "true";
    setOnboardingDismissed(dismissed);
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem("bookmrked_onboarding_dismissed", "true");
    setOnboardingDismissed(true);
  };

  const handleDeleteCollection = async () => {
    if (!deleteCollectionId || !user) return;
    const { data: locs } = await supabase.from("locations").select("id").eq("collection_id", deleteCollectionId);
    const locIds = (locs ?? []).map((l) => l.id);
    if (locIds.length > 0) {
      await supabase.from("visits").delete().in("location_id", locIds).eq("user_id", user.id);
      await supabase.from("locations").delete().in("id", locIds);
    }
    await supabase.from("collections").delete().eq("id", deleteCollectionId);
    setDeleteCollectionId(null);
    setDeleteCollectionTitle("");
    // reload collections
    const { data: cols } = await supabase
      .from("collections")
      .select("id, title, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!cols) {
      setCollections([]);
      return;
    }
    const ids = cols.map((c) => c.id);
    const { data: newLocs } = ids.length
      ? await supabase.from("locations").select("id, collection_id").in("collection_id", ids)
      : { data: [] as { id: string; collection_id: string }[] };
    const newLocIds = (newLocs ?? []).map((l) => l.id);
    const { data: visits } = newLocIds.length
      ? await supabase.from("visits").select("location_id").eq("user_id", user.id).in("location_id", newLocIds)
      : { data: [] as { location_id: string }[] };
    const visitedSet = new Set((visits ?? []).map((v) => v.location_id));
    const cards: CollectionCard[] = cols.map((c) => {
      const colLocs = (newLocs ?? []).filter((l) => l.collection_id === c.id);
      const visited = colLocs.filter((l) => visitedSet.has(l.id)).length;
      const completion = colLocs.length === 0 ? 0 : Math.round((visited / colLocs.length) * 100);
      return {
        id: c.id,
        title: c.title,
        category: c.category,
        locationCount: colLocs.length,
        completion,
      };
    });
    setCollections(cards);
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
      if (!data.user) navigate({ to: "/", search: { signin: 1 } as never, replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate({ to: "/", search: { signin: 1 } as never, replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setCollectionsLoading(true);
      const { data: cols } = await supabase
        .from("collections")
        .select("id, title, category")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active || !cols) {
        setCollections([]);
        setCollectionsLoading(false);
        return;
      }
      const ids = cols.map((c) => c.id);
      const { data: locs } = ids.length
        ? await supabase.from("locations").select("id, collection_id").in("collection_id", ids)
        : { data: [] as { id: string; collection_id: string }[] };
      const locIds = (locs ?? []).map((l) => l.id);
      const { data: visits } = locIds.length
        ? await supabase
            .from("visits")
            .select("location_id")
            .eq("user_id", user.id)
            .in("location_id", locIds)
        : { data: [] as { location_id: string }[] };
      const visitedSet = new Set((visits ?? []).map((v) => v.location_id));
      const cards: CollectionCard[] = cols.map((c) => {
        const colLocs = (locs ?? []).filter((l) => l.collection_id === c.id);
        const visited = colLocs.filter((l) => visitedSet.has(l.id)).length;
        const completion = colLocs.length === 0 ? 0 : Math.round((visited / colLocs.length) * 100);
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          locationCount: colLocs.length,
          completion,
        };
      });
      if (active) {
        setCollections(cards);
        setCollectionsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const handleCreateClick = () => {
    dismissOnboarding();
    if (collections.length >= 5) {
      setUpgradeOpen(true);
    } else {
      setCreateOpen(true);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono-tag text-ink-muted">Signing you in…</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono-tag text-ink-muted">
            <Bookmark className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
            bookmrked
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="font-mono-tag text-ink-muted hover:text-gold"
          >
            Sign out
          </button>
        </header>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-mono-tag text-gold">Your collections</div>
            <h1 className="font-display mt-3 text-5xl text-ink sm:text-6xl">
              Places worth returning to
            </h1>
          </div>
          {collections.length > 0 && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New collection
            </button>
          )}
        </div>

        {collectionsLoading ? (
          <div className="mt-16 font-mono-tag text-ink-muted">Loading…</div>
        ) : collections.length === 0 ? (
          <div className="mt-20 rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
            {!onboardingDismissed && (
              <div
                onClick={dismissOnboarding}
                className="animate-fade-in mx-auto mb-8 max-w-lg cursor-pointer rounded-lg border border-gold/30 bg-surface-raised p-6 text-left transition hover:border-gold/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] leading-relaxed text-ink">
                    <span className="font-display text-lg text-gold">Welcome to Bookmrked</span>
                    <span className="block mt-1">
                      This is your space to save the spots worth remembering. Coffee shops, record
                      stores, galleries, hidden bars — anything worth coming back to.
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissOnboarding();
                    }}
                    aria-label="Dismiss welcome message"
                    className="shrink-0 rounded-md p-1 text-ink-muted transition hover:text-gold"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
            <div className="font-mono-tag text-gold">Empty shelf</div>
            <h2 className="font-display mt-4 text-4xl text-ink">
              Start your first collection
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ink-muted">
              Coffee shops, galleries, bookstores, hidden bars — gather the spots
              you'll keep coming back to.
            </p>
            <button
              onClick={handleCreateClick}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-gold-soft"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create collection
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <div
                key={c.id}
                className="group relative rounded-xl border border-border bg-surface p-6 transition hover:border-gold/60 hover:bg-surface-raised"
              >
                <Link
                  to="/collections/$collectionId"
                  params={{ collectionId: c.id }}
                  className="block"
                >
                  {c.locationCount > 0 && c.completion === 100 && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 font-mono-tag text-[10px] uppercase tracking-wider text-primary-foreground shadow-[0_2px_8px_rgba(212,175,55,0.4)]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                      Complete
                    </div>
                  )}
                  {c.category && (
                    <div className="font-mono-tag text-gold">{c.category}</div>
                  )}
                  <h3 className="font-display mt-3 text-2xl text-ink">{c.title}</h3>
                  <div className="mt-5 flex items-center justify-between text-sm text-ink-muted">
                    <span>{c.locationCount} {c.locationCount === 1 ? "place" : "places"}</span>
                    <span className="font-mono-tag text-gold">{c.completion}%</span>
                  </div>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full bg-gold transition-all"
                      style={{ width: `${c.completion}%` }}
                    />
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteCollectionId(c.id);
                    setDeleteCollectionTitle(c.title);
                  }}
                  aria-label="Delete collection"
                  className="absolute right-3 top-3 rounded-md p-1.5 text-ink-muted opacity-0 transition hover:bg-surface-raised hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        type="collections"
      />

      <CreateCollectionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={user.id}
      />

      <AlertDialog open={Boolean(deleteCollectionId)} onOpenChange={(v) => { if (!v) { setDeleteCollectionId(null); setDeleteCollectionTitle(""); } }}>
        <AlertDialogContent className="border-border bg-surface text-ink">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl text-ink">
              Delete this collection?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink-muted">
              {deleteCollectionTitle ? `"${deleteCollectionTitle}" and all its places will be removed. This cannot be undone.` : ""}
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
    </main>
  );
}