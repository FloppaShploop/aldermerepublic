import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  banned: boolean;
  kicked_at: string | null;
  created_at: string;
};

export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "")}@arcade.local`;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    const signedInAt = Date.now();

    const load = async () => {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);
      if (cancelled) return;
      setProfile((p as Profile) ?? null);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));

      if (p?.banned) {
        setNotice("This account has been banned by the administrator.");
        await supabase.auth.signOut();
        return;
      }
      if (p?.kicked_at && new Date(p.kicked_at).getTime() > signedInAt - 5000) {
        setNotice("You were disconnected by the administrator.");
        await supabase.auth.signOut();
      }
    };

    void load();
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [session]);

  return { session, profile, isAdmin, loading, notice, setNotice };
}
