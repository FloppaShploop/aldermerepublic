import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usernameToEmail } from "@/lib/useAuth";
import { isPortalUnlocked, lockPortal } from "@/lib/portalGate";

export const Route = createFileRoute("/arcade")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Login Page" },
      {
        name: "description",
        content: "Student login page for course resources and saved coursework progress.",
      },
      { property: "og:title", content: "Student Login Page" },
      { property: "og:description", content: "Student login page for course resources and saved progress." },
    ],
  }),
  component: ArcadeLayout,
});

function ArcadeLayout() {
  const navigate = useNavigate();
  const { session, profile, isAdmin, loading, notice, setNotice } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isPortalUnlocked()) setAllowed(true);
    else void navigate({ to: "/portal", replace: true });
  }, [navigate]);

  if (!allowed) return null;

  return (
    <div className="cyber grid-floor min-h-screen">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/arcade" className="neon text-lg font-bold tracking-widest text-primary">
            NEXUS//ARCADE
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest">
            {session && (
              <Link to="/arcade/suggest" className="text-primary hover:opacity-80">
                Suggest a game
              </Link>
            )}
            {isAdmin && (
              <Link to="/arcade/admin" className="text-accent hover:opacity-80">
                Admin Panel
              </Link>
            )}

            {profile && <span className="text-muted-foreground">operator: {profile.username}</span>}
            {session && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
                className="rounded border border-border px-3 py-1 text-muted-foreground hover:text-primary"
              >
                Disconnect
              </button>
            )}
            <button
              onClick={() => {
                lockPortal();
                void navigate({ to: "/" });
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="mx-auto mt-4 max-w-6xl px-5">
          <div className="rounded border border-destructive/60 bg-destructive/15 px-4 py-3 text-sm text-destructive-foreground">
            {notice}{" "}
            <button className="underline" onClick={() => setNotice(null)}>
              dismiss
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="p-10 text-center text-sm text-muted-foreground">initialising…</p>
      ) : session && profile ? (
        <Outlet />
      ) : (
        <AccountGate />
      )}
    </div>
  );
}

function AccountGate() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const email = usernameToEmail(username);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-16">
      <h1 className="neon text-2xl text-primary">
        {mode === "signup" ? "CREATE OPERATOR ID" : "OPERATOR SIGN-IN"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        An operator ID is required before launching any game. Your progress is stored against this
        ID and follows you between sessions.
      </p>
      <form onSubmit={submit} className="neon-border mt-6 rounded-lg bg-card/70 p-6">
        <label className="text-xs uppercase tracking-widest text-muted-foreground" htmlFor="u">
          Username
        </label>
        <input
          id="u"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={24}
          className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <label className="mt-4 block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="p">
          Password
        </label>
        <input
          id="p"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button
          disabled={busy}
          className="mt-6 w-full rounded bg-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {busy ? "working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-4 w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          {mode === "signup" ? "I already have an operator ID" : "Create a new operator ID"}
        </button>
      </form>
    </div>
  );
}
