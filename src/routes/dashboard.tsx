import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Bookmark, Plus } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono-tag text-ink-muted">Signing you in…</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
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

        <div className="mt-16">
          <div className="font-mono-tag text-gold">Welcome</div>
          <h1 className="font-display mt-3 text-5xl text-ink sm:text-6xl">
            {user.email}
          </h1>
          <p className="mt-4 max-w-xl text-ink-muted">
            This is your dashboard. Start a collection — coffee shops, galleries, bookstores,
            anywhere worth coming back to.
          </p>

          <button
            onClick={() => setCreateOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-base font-medium text-primary-foreground transition-transform hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create a collection
          </button>
        </div>

        <div className="mt-20 rounded-lg border border-dashed border-border p-10 text-center">
          <div className="font-mono-tag text-ink-muted">No collections yet</div>
          <p className="mt-2 text-ink">Your saved spots will live here.</p>
        </div>
      </div>

      {/* Re-uses the same modal — gracefully asks user to confirm before we wire creation */}
      <AuthModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultEmail={user.email ?? ""}
        title="Coming soon"
        description="Collection creation is rolling out next. You're all set up — we'll let you know."
      />
    </main>
  );
}