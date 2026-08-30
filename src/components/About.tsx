import { Sparkles, Zap, HeartHandshake, ShieldCheck } from "lucide-react";

const traits = [
  {
    icon: Zap,
    title: "Young & driven",
    body: "We're hungry, hard-working, and tired of the same old van-and-a-bloke routine. Every move is a chance to prove ourselves.",
  },
  {
    icon: HeartHandshake,
    title: "Flexible with you",
    body: "Need a last-minute date change? Extra stop? Help packing a fragile heirloom? Just say the word — we bend the plan around your life.",
  },
  {
    icon: Sparkles,
    title: "8+ years on the road",
    body: "We've moved studios, family homes, offices, and everything in between across London. We've seen the tight staircase — twice.",
  },
  {
    icon: ShieldCheck,
    title: "Peace of mind",
    body: "Moving can be stressful enough. We take care of your belongings every step of the way, so you can relax knowing everything is being handled properly.",
  },
];

export function About() {
  return (
    <section id="about" className="relative border-b border-border py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 halftone opacity-10 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="text-[15px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Who are The Boys?
            </div>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.9] text-balance">
              A young crew on a <span className="text-primary">mission</span>.
            </h2>
            <div className="mt-6 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
              <p>
                We're a team of{" "}
                <span className="text-foreground font-semibold">young professionals</span> with more
                than <span className="text-foreground font-semibold">8 years</span> in the removals
                game. We've spent enough time inside other companies' vans to know exactly what's
                broken about moving day.
              </p>
              <p>
                So we started our own thing. Our goal:{" "}
                <span className="text-foreground">change how moving feels</span>: flexible, honest,
                almost telepathic. You tell us a bit and we handle the rest.
              </p>
              <p>
                We're not doing this because someone told us to. We're doing it because we want to
                build{" "}
                <span className="text-foreground font-semibold">something we're proud of</span>.
                That energy goes into every box we carry.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-1 gap-3">
            {traits.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.title}
                  className="bg-card border border-border p-5 hover:border-primary/50 transition-colors flex gap-4"
                >
                  <div className="size-10 shrink-0 grid place-items-center bg-background border border-border text-primary">
                    <Icon className="size-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-1">{t.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {t.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
