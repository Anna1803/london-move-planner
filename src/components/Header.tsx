import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative size-8 grid place-items-center bg-primary skew-tag">
            <span className="font-display text-bone text-lg leading-none">
              <span>TB</span>
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl tracking-tight text-foreground">
              THE BOYS
            </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground -mt-0.5">
              London removals
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <a href="#services" className="hover:text-foreground transition-colors">
            Services
          </a>
          <a href="#quote" className="hover:text-foreground transition-colors">
            Get a Quote
          </a>
          <a href="#security" className="hover:text-foreground transition-colors">
            Security
          </a>
        </nav>

        <a
          href="#quote"
          className="inline-flex items-center h-9 px-4 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest skew-tag hover:bg-blood transition-colors"
        >
          <span>Summon The Boys</span>
        </a>
      </div>
    </header>
  );
}
