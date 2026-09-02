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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-primary-foreground/40 font-serif-display text-lg">
              A
            </span>
            <span className="leading-tight">
              <span className="block font-serif-display text-xl">Aldermere University</span>
              <span className="block text-xs uppercase tracking-[0.22em] opacity-75">
                Founded 1782 · New England
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="opacity-85 transition-opacity hover:opacity-100"
                activeProps={{ className: "underline underline-offset-4 opacity-100" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-border bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-serif-display text-base text-foreground">Aldermere University</p>
            <p className="mt-2">14 Harrow Yard, Aldermere, MA 02138</p>
          </div>
          <div>
            <p className="text-foreground">Quick Links</p>
            <p className="mt-2">Libraries · Athletics · Giving · Careers</p>
          </div>
          <div>
            <p className="text-foreground">Contact</p>
            <p className="mt-2">(617) 555-0182 · info@aldermere.edu</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{kicker}</p>
        <h1 className="mt-3 text-4xl text-foreground">{title}</h1>
      </div>
    </div>
  );
}
