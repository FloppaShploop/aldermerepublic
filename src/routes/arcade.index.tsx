import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/arcade/")({
  ssr: false,
  component: ArcadeIndex,
});

type Game = { id: string; name: string; description: string; created_at: string };

function ArcadeIndex() {
  const [games, setGames] = useState<Game[]>([]);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: g }, { data: p }] = await Promise.all([
        supabase.from("games").select("id,name,description,created_at").order("created_at", { ascending: false }),
        supabase.from("game_progress").select("game_id,updated_at"),
      ]);
      setGames((g as Game[]) ?? []);
      setProgress(Object.fromEntries((p ?? []).map((r) => [r.game_id, r.updated_at])));
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="neon text-3xl text-primary">GAME GRID</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Every title here runs sandboxed in your browser. Progress is written to your operator ID.
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">scanning grid…</p>
      ) : games.length === 0 ? (
        <div className="neon-border mt-10 rounded-lg bg-card/60 p-10 text-center">
          <p className="text-muted-foreground">No games have been uploaded to the grid yet.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <Link
              key={g.id}
              to="/arcade/play/$gameId"
              params={{ gameId: g.id }}
              className="neon-border group animate-rise rounded-lg bg-card/70 p-5 transition-transform hover:-translate-y-1"
            >
              <h2 className="text-lg text-primary">{g.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{g.description}</p>
              <p className="mt-4 text-[11px] uppercase tracking-widest text-accent">
                {progress[g.id] ? "saved progress found" : "new · no save data"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
