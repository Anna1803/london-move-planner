import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.jpg";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="The Boys logo" className="h-16 w-auto" />
          <div className="flex flex-col leading-none"></div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <a href="#about" className="hover:text-foreground transition-colors">
            About
          </a>
          <a href="#services" className="hover:text-foreground transition-colors">
            Services
          </a>
          <a href="#quote" className="hover:text-foreground transition-colors">
            Get a Quote
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
