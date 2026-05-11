import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import houseImg from "@/assets/cat-house.jpg";
import apartmentImg from "@/assets/cat-apartment.jpg";
import officeImg from "@/assets/cat-office.jpg";

const categories = [
  {
    type: "house" as const,
    image: houseImg,
    title: "House",
    subtitle: "Townhouse · Terrace · Detached",
    blurb: "Multi-floor moves with bedrooms, living, kitchen and the lot.",
    number: "01",
  },
  {
    type: "apartment" as const,
    image: apartmentImg,
    title: "Apartment / Flat",
    subtitle: "Studio · 1-bed · 2-bed · Larger",
    blurb: "Stairs, lifts, narrow doorways — we know your block.",
    number: "02",
  },
  {
    type: "office" as const,
    image: officeImg,
    title: "Office",
    subtitle: "Studios · Suites · Floors",
    blurb: "Out-of-hours commercial moves with zero downtime.",
    number: "03",
  },
];

export function CategoryPicker() {
  return (
    <section id="quote" className="relative border-b border-border py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="mb-14">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
            Step 01 · Choose your battlefield
          </div>
          <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.9] text-balance max-w-3xl">
            Tap your property type.<br />
            <span className="text-primary">We'll draw the floor plan.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Then click the furniture you're taking from above. No forms, no haggling —
            a live volume estimate and price builds as you go.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {categories.map((c) => (
            <Link
              key={c.type}
              to="/quote/$type"
              params={{ type: c.type }}
              className="group relative block border border-border bg-card overflow-hidden hover:border-primary transition-all"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 halftone opacity-20 mix-blend-overlay" />

                <span className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest text-bone/80">
                  {c.number}
                </span>

                <div className="absolute top-4 right-4 size-9 grid place-items-center bg-background/80 backdrop-blur-sm border border-border group-hover:bg-primary group-hover:border-primary transition-colors">
                  <ArrowUpRight className="size-4" strokeWidth={2} />
                </div>

                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="font-display text-3xl md:text-4xl uppercase leading-none text-foreground">
                    {c.title}
                  </h3>
                  <div className="mt-1.5 text-[10px] font-mono uppercase tracking-widest text-accent">
                    {c.subtitle}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.blurb}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary group-hover:gap-3 transition-all">
                  Start building
                  <ArrowUpRight className="size-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
