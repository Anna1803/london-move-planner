import { Truck, Sparkles, Wrench } from "lucide-react";

const services = [
  {
    icon: Truck,
    tag: "Vol. 01",
    title: "Removals",
    blurb:
      "Door-to-door across London. Crated, padded, tracked. We treat your stuff like it's our own — only better.",
    points: ["Packing materials supplied", "GPS-tracked vans", "Goods-in-transit insurance"],
  },
  {
    icon: Sparkles,
    tag: "Vol. 02",
    title: "End-of-tenancy Clean",
    blurb:
      "Deposit-back deep clean to letting-agent standard. Ovens, limescale, skirting — every diabolical corner.",
    points: ["Agent-approved checklist", "Eco-friendly products", "48-hour re-clean guarantee"],
  },
  {
    icon: Wrench,
    tag: "Vol. 03",
    title: "Handyman & Painting",
    blurb:
      "Patch the holes, fix the wobble, freshen the walls. One crew, no contractor merry-go-round.",
    points: ["Filling & touch-ups", "Full-room repainting", "Furniture assembly & repair"],
  },
];

export function Services() {
  return (
    <section id="services" className="relative border-b border-border py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Three powers · one crew
            </div>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.9] text-balance">
              We don't just <span className="text-primary">move you</span>.<br />
              We finish the job.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Most movers vanish once the van pulls away. We stay until the keys are
            handed back, the walls are smooth and the oven sparkles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <article
                key={s.title}
                className="group relative bg-card border border-border p-7 transition-all hover:border-primary/60"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform" />

                <div className="flex items-start justify-between mb-8">
                  <div className="size-12 grid place-items-center bg-background border border-border group-hover:border-primary group-hover:text-primary transition-colors">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.tag}
                  </span>
                </div>

                <h3 className="font-display text-2xl uppercase leading-none mb-3">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {s.blurb}
                </p>

                <ul className="space-y-1.5 border-t border-border pt-4">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 text-xs text-foreground/80"
                    >
                      <span className="size-1 bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
