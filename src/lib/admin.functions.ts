import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: adminRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    const isAdmin = !!adminRows?.length;
    if (!isAdmin) throw new Error("Forbidden");
    if (data.userId === context.userId) throw new Error("Cannot delete the admin account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { gameId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: adminRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    const isAdmin = !!adminRows?.length;
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: pErr } = await supabaseAdmin.from("game_progress").delete().eq("game_id", data.gameId);
    if (pErr) throw new Error(pErr.message);
    const { error } = await supabaseAdmin.from("games").delete().eq("id", data.gameId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
