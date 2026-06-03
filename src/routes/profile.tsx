import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Bookmark,
  Mail,
  FolderOpen,
  MapPin,
  LogOut,
  LayoutGrid,
  ChevronRight,
  Layers,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionCount, setCollectionCount] = useState(0);
  const [placeCount, setPlaceCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
      if (!data.user) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate({ to: "/" });
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
      const [{ count: colCount, data: cols }, { count: visCount }] = await Promise.all([
        supabase
          .from("collections")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
        supabase
          .from("visits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const colIds = (cols ?? []).map((c) => c.id);

      let locCount = 0;
      if (colIds.length > 0) {
        const { count } = await supabase
          .from("locations")
          .select("id", { count: "exact", head: true })
          .in("collection_id", colIds);
        locCount = count ?? 0;
      }

      if (!active) return;
      setCollectionCount(colCount ?? 0);
      setPlaceCount(locCount);
      setVisitedCount(visCount ?? 0);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const overallCompletion =
    placeCount === 0 ? 0 : Math.round((visitedCount / placeCount) * 100);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono-tag text-ink-muted">Loading…</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono-tag text-ink-muted">
            <Bookmark className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
            bookmrked
          </div>
        </header>

        <div className="mt-14">
          <div className="font-mono-tag text-gold">Your profile</div>
          <h1 className="font-display mt-3 text-5xl text-ink sm:text-6xl">
            Account
          </h1>
        </div>

        {/* Email */}
        <div className="mt-10 flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Mail className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="font-mono-tag text-ink-muted">Email</div>
            <div className="truncate text-ink">{user.email}</div>
          </div>
        </div>

        {/* Your Stats */}
        <div className="mt-10">
          <div className="font-mono-tag text-ink-muted">Your Stats</div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<FolderOpen className="h-4 w-4" strokeWidth={2} />}
              label="Collections"
              value={collectionCount}
            />
            <StatCard
              icon={<Layers className="h-4 w-4" strokeWidth={2} />}
              label="Places saved"
              value={placeCount}
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" strokeWidth={2} />}
              label="Places visited"
              value={visitedCount}
            />
            <StatCard
              icon={<Percent className="h-4 w-4" strokeWidth={2} />}
              label="Completion"
              value={`${overallCompletion}%`}
            />
          </div>
        </div>

        {/* My Collections shortcut */}
        <Link
          to="/dashboard"
          className="mt-10 flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition hover:border-gold/40 hover:bg-surface-raised"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
              <LayoutGrid className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="font-mono-tag text-ink-muted">Shortcut</div>
              <div className="text-ink">My Collections</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-ink-muted" strokeWidth={2} />
        </Link>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-4 text-sm font-medium text-ink-muted transition hover:border-gold/40 hover:text-gold sm:w-auto sm:px-8"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Sign out
        </button>
      </div>

      <BottomNav />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface p-5 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
        {icon}
      </div>
      <div className="font-display mt-3 text-3xl text-gold">{value}</div>
      <div className="font-mono-tag mt-1 text-xs text-ink-muted">{label}</div>
    </div>
  );
}
