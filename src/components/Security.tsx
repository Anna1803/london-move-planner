import { ShieldCheck, Lock, Eye, HandshakeIcon } from "lucide-react";

const points = [
  {
    icon: ShieldCheck,
    title: "Safe connection",
    body: "Everything you type on this site — your name, address, move date — travels through a secure, padlocked connection. Same tech your bank uses.",
  },
  {
    icon: Lock,
    title: "Only us see it",
    body: "Your details land straight in our private inbox. No shared spreadsheets, no random staff scrolling through, no third parties peeking.",
  },
  {
    icon: Eye,
    title: "No spam, ever",
    body: "We won't sign you up to a newsletter. We won't pass your number to a call centre. One quote, one call, that's it.",
  },
  {
    icon: HandshakeIcon,
    title: "Used only for your quote",
    body: "Your info is used to give you a price and plan your move. Nothing else. If you want it deleted after, just ask.",
  },
];

export function Security() {
  return (
    <section id="security" className="relative border-b border-border py-20 md:py-28">
      <div className="absolute inset-0 halftone opacity-10 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary mb-3">
              Your privacy
            </div>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.9] text-balance">
              We treat your info like <span className="text-primary">our own</span>.
            </h2>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-md">
              When you book a move, you're trusting strangers with your address and the date
              your whole life will be in a van. We get it — so we keep things simple,
              private, and honest.
            </p>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
            {points.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="bg-card border border-border p-5 hover:border-accent/50 transition-colors"
                >
                  <div className="size-9 grid place-items-center bg-background border border-border mb-4 text-accent">
                    <Icon className="size-4" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1.5">
                    {p.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
