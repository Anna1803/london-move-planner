import heroImg from "@/assets/hero.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
      <div className="absolute inset-0 halftone opacity-40 mix-blend-overlay" />
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-32 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-6 skew-tag bg-primary/10 border border-primary/40 px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-primary animate-flicker" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">
              <span>Operational across all 32 boroughs</span>
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.85] uppercase text-balance">
            <span className="block">Your moving</span>
            <span className="block text-primary">supes</span>
            <span className="block">
              are <span className="text-stroke">here</span>.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base md:text-lg text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">The Boys</span> handle the
            heavy lifting, the end-of-tenancy scrub, and the broken bits — so London's worst
            chore becomes someone else's problem.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#quote"
              className="inline-flex items-center h-12 px-6 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs skew-tag hover:bg-blood transition-all"
              style={{ boxShadow: "var(--shadow-hero)" }}
            >
              <span>Build my quote</span>
            </a>
            <a
              href="#services"
              className="inline-flex items-center h-12 px-6 border border-border text-foreground font-bold uppercase tracking-widest text-xs hover:border-accent hover:text-accent transition-all"
            >
              See services
            </a>
          </div>
        </div>

        <div className="hidden md:block relative">
          <div className="absolute -top-6 -right-6 bg-accent text-accent-foreground p-5 max-w-[260px] skew-tag z-10" style={{ boxShadow: "var(--shadow-pop)" }}>
            <div className="font-display text-2xl leading-none uppercase">
              <span>"No diabolical&nbsp;moving day."</span>
            </div>
            <div className="mt-2 text-[10px] font-mono uppercase tracking-widest opacity-70">
              <span>— Hackney client, May</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
