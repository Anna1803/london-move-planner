import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — The Boys" },
      {
        name: "description",
        content: "How The Boys collects, uses, and protects your personal data.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl uppercase tracking-wide text-primary mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 pb-20">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent mb-1">
          Legal
        </div>
        <h1 className="font-display text-3xl md:text-4xl uppercase leading-none">
          Privacy <span className="text-primary">policy</span>
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl">
          When you ask The Boys to move your life into a van, you're trusting us with your name,
          your address, and photos of your home. Here's exactly what we do with that, in plain
          English.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: 13 September 2026.</p>

        <Section title="Who we are">
          <p>
            The Boys ("we", "us") is a London removals, cleaning, and handyman business. We're the
            data controller for the personal information described here. You can reach us at{" "}
            <a href="mailto:enquiries@theboysremovals.co.uk" className="text-primary underline">
              enquiries@theboysremovals.co.uk
            </a>{" "}
            or 020 3400 9905.
          </p>
        </Section>

        <Section title="What we collect">
          <p>When you fill in a quote request, we collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your name, email address, and phone number</li>
            <li>
              Your pickup and drop-off addresses, and access details like parking, lift, and floor
              level
            </li>
            <li>
              Details about the move itself — property size, what's being moved, and any services
              you've asked for
            </li>
            <li>Any photos or notes you choose to add, to help us quote accurately</li>
          </ul>
          <p>
            We don't collect payment details through this site, and we don't use tracking or
            advertising cookies.
          </p>
        </Section>

        <Section title="Why we collect it">
          <p>
            Purely to give you an accurate quote and, if you go ahead, to plan and carry out your
            move. We don't use your details for anything else — no newsletters, no marketing lists,
            no selling your data to anyone.
          </p>
        </Section>

        <Section title="Who we share it with">
          <p>
            We use a small number of trusted service providers to actually run the business. None of
            them are allowed to use your data for their own purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Supabase</strong> — securely stores your quote
              details and any photos you send
            </li>
            <li>
              <strong className="text-foreground">Airtable</strong> — where our team reviews your
              quote and works out a final price
            </li>
            <li>
              <strong className="text-foreground">Brevo</strong> — sends the automated emails
              confirming your request and your quote
            </li>
            <li>
              <strong className="text-foreground">Google Workspace</strong> — our business email, if
              you reply to us directly
            </li>
          </ul>
          <p>
            Some of these providers may process data outside the UK. Where that happens, it's
            covered by their own data protection safeguards (such as standard contractual clauses).
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            This site doesn't currently use tracking, analytics, or advertising cookies. If that
            ever changes, we'll update this page and ask for your consent first, as required by law.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep quote details for as long as reasonably needed to handle your request and, if
            your move goes ahead, to deliver it. If you'd like your data deleted sooner, just ask —
            see "Your rights" below.
          </p>
        </Section>

        <Section title="Your rights">
          <p>Under UK GDPR, you can ask us to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Show you what data we hold about you</li>
            <li>Correct anything that's inaccurate</li>
            <li>Delete your data</li>
            <li>Stop using your data for a particular purpose</li>
          </ul>
          <p>
            Email{" "}
            <a href="mailto:enquiries@theboysremovals.co.uk" className="text-primary underline">
              enquiries@theboysremovals.co.uk
            </a>{" "}
            and we'll sort it out. You can also complain to the UK Information Commissioner's Office
            (ico.org.uk) if you're unhappy with how we've handled your data.
          </p>
        </Section>
      </main>
    </div>
  );
}
