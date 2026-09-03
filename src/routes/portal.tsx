import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CollegeChrome, PageHeader } from "@/components/CollegeChrome";
import { PORTAL_EMAIL, PORTAL_PASSWORD, unlockPortal } from "@/lib/portalGate";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Student Portal — Aldermere University" },
      {
        name: "description",
        content: "Sign in to the Aldermere Student Portal for registration, grades, housing and campus services.",
      },
      { property: "og:title", content: "Student Portal — Aldermere University" },
      { property: "og:description", content: "Secure sign-in for Aldermere students and staff." },
    ],
  }),
  component: Portal,
});

function Portal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === PORTAL_EMAIL && password === PORTAL_PASSWORD) {
      unlockPortal();
      void navigate({ to: "/access" });
    } else {
      setError("The credentials you entered do not match an Aldermere account.");
    }
  };

  return (
    <CollegeChrome>
      <PageHeader kicker="Secure Sign-In" title="Student Portal" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1fr_400px] lg:px-16">
        <div>
          <h2 className="text-3xl">Aldermere ID sign-in</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Use your university email address and password. Sessions expire after 30 minutes of
            inactivity. Never share your Aldermere ID credentials with anyone, including IT staff.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li>· Course registration and add/drop</li>
            <li>· Grades, transcripts and degree audit</li>
            <li>· Housing, dining plans and student billing</li>
            <li>· Campus network and lab resources</li>
          </ul>
        </div>
        <form onSubmit={submit} className="h-fit border border-border bg-card p-8">
          <span className="mb-4 block h-1 w-10 bg-accent" />
          <label className="block text-sm text-foreground" htmlFor="email">
            University email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="name@aldermere.edu"
            required
          />
          <label className="mt-4 block text-sm text-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="mt-6 w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
          <p className="mt-4 text-xs text-muted-foreground">
            Trouble signing in? Contact the IT Service Desk at (617) 555-0100.
          </p>
        </form>
      </div>
    </CollegeChrome>
  );
}
