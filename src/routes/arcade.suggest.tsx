import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/arcade/suggest")({
  ssr: false,
  component: SuggestGame,
});

type Suggestion = { id: string; title: string; note: string; created_at: string };

function SuggestGame() {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mine, setMine] = useState<Suggestion[]>([]);

  const refresh = async () => {
    const { data } = await supabase
      .from("game_suggestions")
      .select("id,title,note,created_at")
      .order("created_at", { ascending: false });
    setMine((data as Suggestion[]) ?? []);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("game_suggestions").insert({
      user_id: profile.id,
      username: profile.username,
      title: title.trim(),
      note: note.trim(),
    });
    setBusy(false);
    if (error) return setStatus(error.message);
    setStatus("Suggestion transmitted to the admin.");
    setTitle("");
    setNote("");
    void refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("game_suggestions").delete().eq("id", id);
    void refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/arcade" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
        ← back to grid
      </Link>
      <h1 className="neon mt-4 text-3xl text-accent">SUGGESTIONS CHANNEL</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Request a game for the grid. The admin reviews every transmission.
      </p>

      {status && (
        <p className="neon-border mt-6 rounded bg-card/70 px-4 py-3 text-sm text-primary">{status}</p>
      )}

      <form onSubmit={submit} className="neon-border mt-6 grid gap-4 rounded-lg bg-card/70 p-6">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Game title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={80}
            className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Why / where to find it</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          disabled={busy}
          className="justify-self-start rounded bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
        >
          {busy ? "sending…" : "Send suggestion"}
        </button>
      </form>

      <section className="neon-border mt-8 rounded-lg bg-card/70 p-6">
        <h2 className="text-xl text-primary">Your suggestions</h2>
        <ul className="mt-4 divide-y divide-border/60">
          {mine.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <span>
                <span className="text-foreground">{s.title}</span>
                {s.note && <span className="block text-xs text-muted-foreground">{s.note}</span>}
              </span>
              <button
                onClick={() => void remove(s.id)}
                className="rounded border border-destructive/60 px-2 py-1 text-xs text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
          {mine.length === 0 && <li className="py-3 text-sm text-muted-foreground">No suggestions yet.</li>}
        </ul>
      </section>
    </div>
  );
}
