import { ShieldCheck, Lock, FileCheck, Eye } from "lucide-react";

const points = [
  {
    icon: ShieldCheck,
    title: "HTTPS end-to-end",
    body: "Every byte you send — addresses, inventories, contact details — travels over TLS-encrypted connections.",
  },
  {
    icon: Lock,
    title: "Encrypted storage",
    body: "Quote and booking data live in an isolated database protected by row-level security. No shared spreadsheets.",
  },
  {
    icon: FileCheck,
    title: "Server-side validation",
    body: "Every form is sanitised and validated server-side before it ever touches the database.",
  },
  {
    icon: Eye,
    title: "No marketing leaks",
    body: "We never sell your data. We don't email you discount codes. Your inventory isn't fed to ad networks.",
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
              Vault protocol
            </div>
            <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.9] text-balance">
              Your data is <span className="text-primary">not</span> a&nbsp;perk.<br />
              It's the <span className="text-stroke">whole point</span>.
            </h2>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-md">
              You're handing strangers a list of everything valuable in your home,
              plus the date it will all be on a pavement. We treat that information like
              a bank would — because no other mover does.
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
