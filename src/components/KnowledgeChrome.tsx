import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, UserRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function KnowledgeChrome({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="knowledge min-h-screen bg-background text-foreground">
      <header className="knowledge-header sticky top-0 z-50 bg-background">
        <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 text-primary" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="knowledge-menu" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </Button>
            <Link to="/" className="knowledge-logo text-primary">Knowledge</Link>
          </div>
          <Button asChild className="h-11 shrink-0 gap-2 rounded-lg px-4 md:px-6">
            <Link to="/portal"><UserRound /> Log in</Link>
          </Button>
        </div>
        {menuOpen && (
          <nav id="knowledge-menu" aria-label="Main navigation" className="absolute inset-x-0 top-full border-t border-border bg-background px-8 py-6 shadow-lg">
            <div className="mx-auto grid max-w-6xl gap-1 sm:grid-cols-4">
              {([{ to: "/", label: "Home" }, { to: "/academics", label: "For schools" }, { to: "/campus-life", label: "Student life" }, { to: "/portal", label: "Student login" }] as const).map(item => (
                <Button key={item.to} asChild variant="ghost" className="justify-between" onClick={() => setMenuOpen(false)}><Link to={item.to}>{item.label}<ArrowRight /></Link></Button>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-background px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <Link to="/" className="knowledge-logo text-primary">Knowledge</Link>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground"><Link to="/academics">For schools</Link><Link to="/portal">Student login</Link><span>© 2026 Knowledge</span></div>
        </div>
      </footer>
    </div>
  );
}