import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/academics", label: "Academics" },
  { to: "/admissions", label: "Admissions" },
  { to: "/campus-life", label: "Campus Life" },
  { to: "/portal", label: "Student Portal" },
] as const;

export function CollegeChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-16">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-accent font-serif-display text-xl font-bold italic text-accent">
              A
            </span>
            <span className="hidden text-sm font-semibold uppercase tracking-[0.22em] sm:block">
              Aldermere University
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-xs font-medium uppercase tracking-[0.18em]">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="opacity-80 transition-colors hover:text-accent hover:opacity-100"
                activeProps={{ className: "text-accent opacity-100" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/admissions"
              className="border border-accent px-4 py-2 text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Apply Now
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-primary pt-20 pb-10 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div className="grid grid-cols-1 gap-12 border-b border-primary-foreground/10 pb-14 md:grid-cols-4">
            <div>
              <div className="mb-6 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center border-2 border-accent font-serif-display text-lg font-bold italic text-accent">
                  A
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Aldermere</span>
              </div>
              <p className="text-xs leading-loose text-primary-foreground/50">
                1200 Old Oak Drive
                <br />
                Aldermere, MA 04552
                <br />
                United States
              </p>
            </div>
            <div>
              <h4 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-accent">Connect</h4>
              <ul className="space-y-4 text-sm text-primary-foreground/70">
                <li>Contact Directory</li>
                <li>Visit Campus</li>
                <li>Employment</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-accent">Resources</h4>
              <ul className="space-y-4 text-sm text-primary-foreground/70">
                <li>Library Services</li>
                <li>Alumni Relations</li>
                <li>Campus Safety</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-accent">Newsletter</h4>
              <p className="mb-4 text-xs text-primary-foreground/50">
                Receive the quarterly Aldermere Review.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full border-0 bg-secondary-foreground/15 px-4 py-3 text-sm outline-none placeholder:text-primary-foreground/30 focus:ring-1 focus:ring-ring"
                />
                <button className="bg-accent px-4 py-3 text-xs font-bold uppercase text-accent-foreground">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[10px] uppercase tracking-[0.18em] text-primary-foreground/40 md:flex-row">
            <p>© 2026 Aldermere University. All rights reserved.</p>
            <p>Privacy Policy · Accessibility · Legal Notice</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-16">
        <span className="mb-4 block text-sm font-bold uppercase tracking-[0.22em] text-accent">
          {kicker}
        </span>
        <h1 className="text-4xl leading-tight text-foreground lg:text-6xl">{title}</h1>
        <div className="mt-6 h-1 w-24 bg-accent" />
      </div>
    </div>
  );
}
