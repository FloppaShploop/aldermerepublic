import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ARCADE_BRIDGE } from "@/lib/arcade-bridge";

export const Route = createFileRoute("/arcade/play/$gameId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Login Page" },
      { name: "description", content: "Student game session with account-based saved progress." },
      { property: "og:title", content: "Student Login Page" },
      { property: "og:description", content: "Student game session with account-based saved progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayGame,
});

type Game = { id: string; name: string; description: string; html: string; url: string | null };

function progressFrameName(progress: Record<string, unknown>): string {
  try {
    return `__arcade_progress__:${encodeURIComponent(JSON.stringify(progress))}`;
  } catch {
    return "__arcade_progress__:%7B%7D";
  }
}

function PlayGame() {
  const { gameId } = Route.useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [saveState, setSaveState] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<Record<string, unknown>>({});
  const aliveRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());


  const reportError = useCallback(
    async (message: string) => {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("game_errors").insert({
        game_id: gameId,
        user_id: u.user?.id ?? null,
        message: message.slice(0, 500),
      });
    },
    [gameId],
  );

  useEffect(() => {
    const load = async () => {
      const [{ data: g }, { data: p }] = await Promise.all([
        supabase.from("games").select("id,name,description,html,url").eq("id", gameId).maybeSingle(),
        supabase.from("game_progress").select("data").eq("game_id", gameId).maybeSingle(),
      ]);
      progressRef.current = (p?.data as Record<string, unknown>) ?? {};
      setGame((g as Game) ?? null);
    };
    void load();
  }, [gameId]);

  // Some external sites refuse to be embedded (X-Frame-Options / CSP frame-ancestors).
  // If nothing ever loads, surface a fallback instead of a permanently black frame.
  // Heavy games can take a long time to fire `load` (wasm, audio packs, trackers),
  // so any sign of life from the bridge counts as loaded.
  useEffect(() => {
    if (!game?.url) return;
    aliveRef.current = false;
    setBlocked(false);
    const t = setTimeout(() => {
      if (aliveRef.current) return;
      void reportError("Embed blocked or timed out — the site refused to load in a frame.");
      setBlocked(true);
    }, 30000);
    return () => clearTimeout(t);
  }, [game?.url, reportError]);



  const saveProgress = useCallback(
    async (data: Record<string, unknown>) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setSaveState("save failed · sign in again");
        return;
      }
      progressRef.current = data;
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        const { error } = await supabase
          .from("game_progress")
          .upsert(
            { user_id: u.user.id, game_id: gameId, data: data as never, updated_at: new Date().toISOString() },
            { onConflict: "user_id,game_id" },
          );
        setSaveState(error ? `save failed · ${error.message}` : `progress saved · ${new Date().toLocaleTimeString()}`);
      });
      await saveQueueRef.current;
    },
    [gameId],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { __arcade?: string; data?: Record<string, unknown>; message?: string };
      if (!d || !d.__arcade) return;
      if (d.__arcade === "ready") {
        aliveRef.current = true;
        setBlocked(false);
        frameRef.current?.contentWindow?.postMessage(
          { __arcadeHost: "progress", data: progressRef.current },
          "*",
        );
      }

      if (d.__arcade === "save") void saveProgress(d.data ?? {});
      if (d.__arcade === "error") {
        const msg = (d.message ?? "").trim();
        // Ignore censored cross-origin "Script error." reports — they carry no
        // detail and usually don't stop the game from running.
        if (!msg || /^script error\.?$/i.test(msg)) return;
        setGameError(msg);
        void reportError(msg);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [saveProgress, reportError]);



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
            name={progressFrameName(progressRef.current)}
            src={`/api/public/embed/${game.id}`}
            onLoad={() => {
              aliveRef.current = true;
              setBlocked(false);
            }}

            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; fullscreen; gamepad; pointer-lock; accelerometer; gyroscope; xr-spatial-tracking; clipboard-write; encrypted-media"
            sandbox="allow-scripts allow-pointer-lock allow-modals allow-forms allow-popups allow-downloads allow-presentation allow-popups-to-escape-sandbox"
            className={`w-full border-0 bg-black ${isFullscreen ? "h-full" : "h-[70vh]"}`}
          />
        ) : (
          <iframe
            ref={frameRef}
            title={game.name}
            name={progressFrameName(progressRef.current)}
            srcDoc={ARCADE_BRIDGE + game.html}
            allow="autoplay; fullscreen; gamepad; pointer-lock; accelerometer; gyroscope; xr-spatial-tracking; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals allow-forms allow-popups allow-downloads"
            className={`w-full border-0 bg-black ${isFullscreen ? "h-full" : "h-[70vh]"}`}
          />
        )}
      </div>
      {blocked && game.url && (
        <div className="mt-3 rounded border border-destructive/60 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          This game’s host refuses to run inside an embed (it blocks framing), so it can stay black or
          half-loaded here. Reported to the admin panel — you can still launch it in its own tab.
          <a
            href={game.url}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-2 underline text-primary"
          >
            open game in a new tab
          </a>
        </div>
      )}
      {gameError && (
        <p className="mt-3 text-xs text-destructive">
          Cartridge reported an error: {gameError} — this game may rely on external files that aren’t included.
        </p>
      )}


      <p className="mt-4 text-xs text-muted-foreground">
        Games can save your progress by calling <code className="text-primary">ArcadeSave(&#123;...&#125;)</code> and
        read it back with <code className="text-primary">await ArcadeLoad()</code>.
      </p>
    </div>
  );
}
