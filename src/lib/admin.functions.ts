import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email, subscription_tier, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Pull collection counts per user
    const { data: collections } = await supabaseAdmin
      .from("collections")
      .select("user_id");
    const counts = new Map<string, number>();
    for (const c of collections ?? []) {
      counts.set(c.user_id, (counts.get(c.user_id) ?? 0) + 1);
    }

    return (users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      subscription_tier: u.subscription_tier,
      created_at: u.created_at,
      collection_count: counts.get(u.id) ?? 0,
    }));
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data, userId: context.userId };
  });