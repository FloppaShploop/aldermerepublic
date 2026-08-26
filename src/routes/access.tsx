import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isPortalUnlocked } from "@/lib/portalGate";

export const Route = createFileRoute("/access")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Access Granted — NEXUS Arcade" },
      { name: "description", content: "Secure terminal handshake into the NEXUS Arcade network." },
      { property: "og:title", content: "Access Granted — NEXUS Arcade" },
      { property: "og:description", content: "Terminal handshake into the NEXUS Arcade network." },
    ],
  }),
  component: Access,
});

const lines = [
  "> establishing uplink to node WX-07 ...",
  "> bypassing registrar subnet ...........",
  "> decrypting credential envelope .......",
  "> identity signature verified ..........",
  "> mounting NEXUS ARCADE runtime ........",
];

function Access() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!isPortalUnlocked()) {
      void navigate({ to: "/portal", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (step < lines.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 420);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setGranted(true), 300);
    const t2 = setTimeout(() => void navigate({ to: "/arcade", replace: true }), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step, navigate]);

  return (
    <div className="cyber grid-floor relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-primary/10 blur-2xl animate-scan" />
      <div className="w-full max-w-xl">
        <div className="neon-border rounded-lg bg-card/70 p-6 font-mono text-sm">
          {lines.slice(0, step).map((l) => (
            <p key={l} className="animate-rise text-primary/90">
              {l} <span className="text-accent">ok</span>
            </p>
          ))}
          {step >= lines.length && (
            <p className="mt-2 text-muted-foreground">handshake complete · latency 12ms</p>
          )}
        </div>
        {granted && (
          <div className="mt-10 text-center">
            <h1 className="neon animate-flicker text-4xl text-primary sm:text-6xl">ACCESS GRANTED</h1>
            <p className="mt-4 text-sm uppercase tracking-[0.4em] text-muted-foreground">
              entering nexus arcade
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
