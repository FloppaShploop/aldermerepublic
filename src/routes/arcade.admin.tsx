import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { deleteAccount, deleteGame as deleteGameFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/arcade/admin")({
  ssr: false,
  component: AdminPanel,
});

type Row = { id: string; username: string; banned: boolean; kicked_at: string | null; created_at: string };
type Game = { id: string; name: string; description: string; created_at: string };
type ErrRow = { id: string; game_id: string | null; message: string; created_at: string };
type Suggestion = { id: string; username: string; title: string; note: string; created_at: string };

function AdminPanel() {
  const { isAdmin, loading, profile } = useAuth();
  const [users, setUsers] = useState<Row[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [errors, setErrors] = useState<ErrRow[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [html, setHtml] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const removeAccount = useServerFn(deleteAccount);
  const removeGame = useServerFn(deleteGameFn);

  const refresh = async () => {
    const [{ data: p }, { data: g }, { data: r }, { data: e }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("games").select("id,name,description,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
      supabase
        .from("game_errors")
        .select("id,game_id,message,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("game_suggestions")
        .select("id,username,title,note,created_at")
        .order("created_at", { ascending: false }),
    ]);
    setUsers((p as Row[]) ?? []);
    setGames((g as Game[]) ?? []);
    setAdmins((r ?? []).map((x) => x.user_id));
    setErrors((e as ErrRow[]) ?? []);
    setSuggestions((s as Suggestion[]) ?? []);
  };

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin]);


  if (loading) return <p className="p-10 text-center text-sm text-muted-foreground">verifying clearance…</p>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="neon text-2xl text-destructive">ACCESS DENIED</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This terminal is restricted to the network administrator.
        </p>
        <Link to="/arcade" className="mt-6 inline-block text-xs uppercase tracking-widest text-primary">
          ← back to grid
        </Link>
      </div>
    );
  }

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    const link = url.trim();
    if (!html.trim() && !link) return setStatus("Provide HTML code or a game link.");
    if (link && !/^https:\/\/\S+$/i.test(link)) return setStatus("Link must be a full https:// URL.");
    setBusy(true);
    const { error } = await supabase.from("games").insert({
      name: name.trim(),
      description: description.trim(),
      html: link ? "" : html,
      url: link || null,
      created_by: profile?.id ?? null,
    });
    setBusy(false);
    if (error) return setStatus(error.message);
    setStatus(`"${name}" published to the grid.`);
    setName("");
    setDescription("");
    setHtml("");
    setUrl("");
    void refresh();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setHtml(await file.text());
    if (!name) setName(file.name.replace(/\.html?$/i, ""));
  };

  const setBanned = async (id: string, banned: boolean) => {
    await supabase.from("profiles").update({ banned }).eq("id", id);
    setStatus(banned ? "Account banned." : "Ban lifted.");
    void refresh();
  };

  const kick = async (id: string) => {
    await supabase.from("profiles").update({ kicked_at: new Date().toISOString() }).eq("id", id);
    setStatus("Kick signal sent — the operator will be disconnected within 15 seconds.");
    void refresh();
  };

  const remove = async (id: string, username: string) => {
    if (!confirm(`Permanently delete "${username}" and all of their progress?`)) return;
    try {
      await removeAccount({ data: { userId: id } });
      setStatus(`Account "${username}" deleted.`);
      void refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const deleteGame = async (id: string, gname: string) => {
    if (!confirm(`Permanently delete "${gname}" and all saved progress for it?`)) return;
    setStatus(`Deleting "${gname}"…`);
    try {
      await removeGame({ data: { gameId: id } });
      setStatus(`"${gname}" removed from the grid.`);
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? `Delete failed: ${err.message}` : "Delete failed");
    }
  };


  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="neon text-3xl text-accent">ADMIN CONTROL</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Root operator: {profile?.username} · {users.length} accounts · {games.length} games
          </p>
        </div>
        <Link to="/arcade" className="text-xs uppercase tracking-widest text-primary">
          ← back to grid
        </Link>
      </div>

      {status && (
        <p className="neon-border mt-6 rounded bg-card/70 px-4 py-3 text-sm text-primary">{status}</p>
      )}

      <section className="neon-border mt-8 rounded-lg bg-card/70 p-6">
        <h2 className="text-xl text-primary">Upload a game</h2>
        <form onSubmit={upload} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Upload single HTML file
              </label>
              <input
                type="file"
                accept=".html,.htm,text/html"
                onChange={(e) => void onFile(e.target.files?.[0])}
                className="mt-2 w-full rounded border border-input bg-background px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-secondary-foreground"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Or paste the HTML code
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder="<!DOCTYPE html> ..."
              className="mt-2 w-full rounded border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Or import from a link (embedded, URL hidden)
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/game"
              className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              A link takes priority over pasted code. Links are routed through the arcade’s embed
              relay, so most hosts load — a few may still refuse or misbehave.
            </p>
          </div>
          <button
            disabled={busy}
            className="justify-self-start rounded bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {busy ? "publishing…" : "Publish to grid"}
          </button>
        </form>
      </section>

      <section className="neon-border mt-8 overflow-x-auto rounded-lg bg-card/70 p-6">
        <h2 className="text-xl text-primary">Accounts</h2>
        <table className="mt-4 w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="pb-2">Username</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Joined</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3 text-foreground">
                  {u.username}
                  {admins.includes(u.id) && <span className="ml-2 text-xs text-accent">ADMIN</span>}
                </td>
                <td className={u.banned ? "text-destructive" : "text-muted-foreground"}>
                  {u.banned ? "banned" : "active"}
                </td>
                <td className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  {u.id !== profile?.id && (
                    <span className="inline-flex gap-2">
                      <button
                        onClick={() => void kick(u.id)}
                        className="rounded border border-border px-2 py-1 text-xs hover:text-primary"
                      >
                        Kick
                      </button>
                      <button
                        onClick={() => void setBanned(u.id, !u.banned)}
                        className="rounded border border-border px-2 py-1 text-xs hover:text-accent"
                      >
                        {u.banned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => void remove(u.id, u.username)}
                        className="rounded border border-destructive/60 px-2 py-1 text-xs text-destructive"
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="neon-border mt-8 rounded-lg bg-card/70 p-6">
        <h2 className="text-xl text-primary">Published games</h2>
        <ul className="mt-4 divide-y divide-border/60">
          {games.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="text-foreground">{g.name}</span>
              <button
                onClick={() => void deleteGame(g.id, g.name)}
                className="rounded border border-destructive/60 px-2 py-1 text-xs text-destructive"
              >
                Delete
              </button>
            </li>
          ))}
          {games.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nothing published yet.</li>}
        </ul>
      </section>

      <section className="neon-border mt-8 rounded-lg bg-card/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl text-primary">Game error log</h2>
          <button
            onClick={async () => {
              if (!confirm("Clear all logged game errors?")) return;
              const { error } = await supabase.from("game_errors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              setStatus(error ? `Clear failed: ${error.message}` : "Error log cleared.");
              void refresh();
            }}
            className="rounded border border-border px-3 py-1 text-xs uppercase tracking-widest hover:text-primary"
          >
            Clear log
          </button>
        </div>
        <ul className="mt-4 divide-y divide-border/60">
          {errors.map((e) => (
            <li key={e.id} className="py-3 text-sm">
              <span className="text-accent">{games.find((g) => g.id === e.game_id)?.name ?? "unknown game"}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </span>
              <p className="mt-1 font-mono text-xs text-destructive break-words">{e.message}</p>
            </li>
          ))}
          {errors.length === 0 && <li className="py-3 text-sm text-muted-foreground">No errors reported.</li>}
        </ul>
      </section>

      <section className="neon-border mt-8 rounded-lg bg-card/70 p-6">
        <h2 className="text-xl text-primary">Suggestions channel</h2>
        <ul className="mt-4 divide-y divide-border/60">
          {suggestions.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <span>
                <span className="text-foreground">{s.title}</span>
                <span className="ml-2 text-xs text-accent">{s.username || "operator"}</span>
                {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
              </span>
              <button
                onClick={async () => {
                  await supabase.from("game_suggestions").delete().eq("id", s.id);
                  setStatus("Suggestion dismissed.");
                  void refresh();
                }}
                className="rounded border border-destructive/60 px-2 py-1 text-xs text-destructive"
              >
                Dismiss
              </button>
            </li>
          ))}
          {suggestions.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">No suggestions yet.</li>
          )}
        </ul>
      </section>

    </div>
  );
}
