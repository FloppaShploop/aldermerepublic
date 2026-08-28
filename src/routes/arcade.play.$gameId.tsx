import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/arcade/play/$gameId")({
  ssr: false,
  component: PlayGame,
});

const BRIDGE = `<script>
(function(){
  var pending = [];
  var resolved = null;
  window.ArcadeSave = function(data){ parent.postMessage({__arcade:'save', data: data}, '*'); };
  window.ArcadeLoad = function(){
    if (resolved) return Promise.resolve(resolved);
    return new Promise(function(res){ pending.push(res); });
  };
  window.addEventListener('message', function(e){
    if (e.data && e.data.__arcadeHost === 'progress') {
      resolved = e.data.data || {};
      pending.splice(0).forEach(function(r){ r(resolved); });
    }
  });
  parent.postMessage({__arcade:'ready'}, '*');
})();
</script>`;

type Game = { id: string; name: string; description: string; html: string; url: string | null };

function PlayGame() {
  const { gameId } = Route.useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [saveState, setSaveState] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase.from("games").select("id,name,description,html,url").eq("id", gameId).maybeSingle();
      setGame((g as Game) ?? null);
      const { data: p } = await supabase.from("game_progress").select("data").eq("game_id", gameId).maybeSingle();
      progressRef.current = (p?.data as Record<string, unknown>) ?? {};
    };
    void load();
  }, [gameId]);

  const saveProgress = useCallback(
    async (data: Record<string, unknown>) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      progressRef.current = data;
      const { error } = await supabase
        .from("game_progress")
        .upsert({ user_id: u.user.id, game_id: gameId, data: data as never, updated_at: new Date().toISOString() }, { onConflict: "user_id,game_id" });
      setSaveState(error ? "save failed" : `progress saved · ${new Date().toLocaleTimeString()}`);
    },
    [gameId],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { __arcade?: string; data?: Record<string, unknown> };
      if (!d || !d.__arcade) return;
      if (d.__arcade === "ready") {
        frameRef.current?.contentWindow?.postMessage(
          { __arcadeHost: "progress", data: progressRef.current },
          "*",
        );
      }
      if (d.__arcade === "save") void saveProgress(d.data ?? {});
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [saveProgress]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen errors (e.g. unsupported iframe content).
    }
  }, []);

  if (!game) {
    return <p className="p-10 text-center text-sm text-muted-foreground">loading cartridge…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link to="/arcade" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
        ← back to grid
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="neon text-2xl text-primary">{game.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{game.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">{saveState}</p>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="neon-border inline-flex items-center gap-2 rounded-md bg-card/70 px-3 py-2 text-xs uppercase tracking-widest text-primary transition-transform hover:-translate-y-0.5"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            {isFullscreen ? "exit" : "fullscreen"}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="neon-border mt-6 overflow-hidden rounded-lg bg-black">
        {game.url ? (
          <iframe
            ref={frameRef}
            title={game.name}
            src={game.url}
            referrerPolicy="no-referrer"
            allow="autoplay; fullscreen; gamepad; pointer-lock"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals allow-forms allow-popups"
            className={`w-full border-0 bg-black ${isFullscreen ? "h-full" : "h-[70vh]"}`}
          />
        ) : (
          <iframe
            ref={frameRef}
            title={game.name}
            srcDoc={BRIDGE + game.html}
            sandbox="allow-scripts allow-pointer-lock allow-modals"
            className={`w-full border-0 bg-black ${isFullscreen ? "h-full" : "h-[70vh]"}`}
          />
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Games can save your progress by calling <code className="text-primary">ArcadeSave(&#123;...&#125;)</code> and
        read it back with <code className="text-primary">await ArcadeLoad()</code>.
      </p>
    </div>
  );
}
