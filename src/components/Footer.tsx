export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-display text-3xl uppercase leading-none">
            The Boys
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            London removals · cleaning · handyman
          </div>
          <p className="mt-5 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Saving Londoners from moving day, one box at a time.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
            Reach us
          </div>
          <ul className="space-y-2 text-sm">
            <li>hello@theboys.london</li>
            <li>020 0000 0000</li>
            <li>Mon–Sat · 07:00–20:00</li>
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
            Boroughs
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Hackney", "Islington", "Camden", "Shoreditch", "Greenwich", "Kensington", "Brixton", "Wandsworth"].map(
              (b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-border"
                >
                  {b}
                </span>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <div>© {new Date().getFullYear()} The Boys Ltd</div>
          <div>Built in London · TLS-encrypted</div>
        </div>
      </div>
    </footer>
  );
}
