import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Bookmark, Mail, FolderOpen, MapPin, LogOut } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionCount, setCollectionCount] = useState(0);
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
      const [{ count: colCount }, { count: visCount }] = await Promise.all([
        supabase
          .from("collections")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("visits")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      if (!active) return;
      setCollectionCount(colCount ?? 0);
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

        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Mail className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="font-mono-tag text-ink-muted">Email</div>
              <div className="text-ink">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
              <FolderOpen className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="font-mono-tag text-ink-muted">Collections</div>
              <div className="text-ink">{collectionCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
              <MapPin className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="font-mono-tag text-ink-muted">Places visited</div>
              <div className="text-ink">{visitedCount}</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-10 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-6 py-3 text-sm font-medium text-ink-muted transition hover:border-gold/40 hover:text-gold"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Sign out
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
