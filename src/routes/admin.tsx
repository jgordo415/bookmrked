import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAdminUsers, checkIsAdmin } from "@/lib/admin.functions";
import { Loader2, Search, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Bookmrked" }] }),
  component: AdminPage,
});

type AdminUser = {
  id: string;
  email: string | null;
  subscription_tier: string;
  created_at: string;
  collection_count: number;
};

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(checkIsAdmin);
  const fetchUsers = useServerFn(getAdminUsers);

  const [status, setStatus] = useState<"loading" | "forbidden" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate({ to: "/", search: {} as never });
        return;
      }
      try {
        const res = await checkAdmin({});
        if (cancelled) return;
        if (!res.isAdmin) {
          setStatus("forbidden");
          return;
        }
        const data = await fetchUsers({});
        if (cancelled) return;
        setUsers(data);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Failed to load");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkAdmin, fetchUsers, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm underline">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Couldn't load admin data</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const filtered = users.filter((u) =>
    query.trim() === ""
      ? true
      : (u.email ?? "").toLowerCase().includes(query.trim().toLowerCase()),
  );

  const total = users.length;
  const paid = users.filter((u) => u.subscription_tier !== "free").length;
  const last7 = users.filter(
    (u) => Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Users</h1>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Total signups" value={total} />
          <StatCard label="New (7d)" value={last7} />
          <StatCard label="Paid" value={paid} />
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Collections</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No users match.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          u.subscription_tier === "free"
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.collection_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Showing {filtered.length} of {total}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}