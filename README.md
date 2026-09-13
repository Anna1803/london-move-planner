# The Boys — London Move Planner

A quote-request site for a London removals company ("The Boys"). A visitor
picks house, apartment, or office, fills in a detailed quote form, and the
system automatically prices the job and routes it to the business owner for
a final decision — no manual price-crunching, no forgotten leads.

This document explains what the app does end to end, and walks through the
full lifecycle of a single quote request. For the pricing formula itself,
see [PRICING.md](PRICING.md).

## What it's built on

| Piece                             | Role                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Start** (React + Vite) | The site itself — pages, the quote form, server-side logic                                                                                                    |
| **Supabase**                      | Database (`quote_requests`, `quote_photos`) and private file storage for property photos                                                                      |
| **Airtable**                      | Where the business owner reviews priced quotes — calendar view for spotting date overlaps, sortable by price, Accept/Reject workflow                          |
| **Brevo**                         | Sends the three transactional emails (thank-you, admin notification, final quote/decline) from `enquiries@theboysremovals.co.uk`. A Postmark integration also exists in the codebase (`src/integrations/postmark/`) but is currently unused — kept as a ready fallback since Brevo and Postmark share the exact same interface, so switching providers is a 3-line import change |
| **Google Workspace**              | The real business mailbox (`enquiries@theboysremovals.co.uk`) — where humans reply to customers; separate from Brevo, which only sends automated mail          |

Nothing here needs a login system — the site is public, and the "admin" side
of things happens in Airtable and email, not a custom dashboard.

## The full lifecycle of a quote request

### 1. The client fills in the form

At `/quote/house`, `/quote/apartment`, or `/quote/office`. Depending on the
type, the form asks for:

- Contact details (name, email, phone)
- Property size (bedrooms, or floor area for offices)
- Both addresses, each with its own parking availability, lift, and floor
  level (ground or a specific upper floor)
- A furniture checklist (at least 3 items required, or a free-text
  description of what needs moving as a fallback)
- Add-on services: packaging, unpacking, end-of-tenancy cleaning, handyman,
  furniture assembly/disassembly
- Whether there are fragile items needing special care
- Optional property photos (drag-and-drop or file picker)
- An optional free-text notes field

Every required field is validated both in the browser (for instant feedback)
and again by the database itself (Row Level Security policies mirror the
same rules), so the price that eventually gets calculated is always built
from complete, valid data.

### 2. The client submits

The moment "Send to The Boys" is clicked:

- A row is inserted directly into Supabase's `quote_requests` table. The
  public site can only ever _insert_ rows — it has no ability to read,
  update, or delete anyone's data, including its own submission.
- If photos were attached, each one uploads to a private Supabase Storage
  bucket, with a matching row in `quote_photos` linking it to the quote.
- The client immediately sees a "Request sent" confirmation. Everything
  from here on happens in the background and never makes them wait.

### 3. Behind the scenes, automatically

Three things happen right after the row is created, all server-side:

1. **A thank-you email** goes to the client, confirming their request was
   received.
2. **The price gets calculated.** A pure pricing function (see
   [PRICING.md](PRICING.md)) works out crew hours from property size,
   access difficulty, furniture load, fragile items, and parking, applies a
   weekend/short-notice demand surcharge, adds any flat-fee services, and
   writes the result back onto the row — along with whether it needs manual
   review (offices, and quotes with placeholder-priced services like
   Handyman or Assembly, always do).
3. **The priced quote is synced to Airtable**, and **an email notifies the
   business owner** that a new quote is ready to review — no need to keep
   Airtable open and refreshing.

### 4. The business owner reviews in Airtable

This is the one manual step in the whole process. In Airtable, the owner
can:

- See every open quote on a calendar view, so overlapping move dates are
  obvious at a glance
- Sort or filter by `Calculated Total` to prioritize the most valuable jobs
- Edit the price themselves if the automated number needs adjusting
- Check `Access Notes` for parking/lift/floor details, `Furniture` for
  what's being moved, and `Services` for which add-ons were requested
- (Photos, if any were attached, currently live in Supabase Storage rather
  than Airtable — see [Known limitations](#known-limitations))

Once a decision is made, the owner sets the row's `Status` field to
**Accepted** or **Rejected**. That's the entire interaction — nothing else
needs to be clicked or configured.

### 5. The decision reaches the client, automatically

A polling endpoint (`/api/check-quote-decisions`) periodically asks
Airtable: "any rows marked Accepted or Rejected that I haven't handled
yet?" For each one it finds — but only once the status has held steady for
a **15-minute grace period** (so an accidental click can be undone by
flipping it back) — it:

- Sends the client their final quote email (with whatever price is
  currently on the row, in case the owner edited it), or a polite decline
- Marks the row `Processed` in Airtable, so it's never actioned twice

This design deliberately avoids Airtable's automation features (sending a
webhook or running a script from within Airtable requires a paid plan) —
instead, the app reaches out to Airtable on its own schedule, which works
identically on the free tier.

**Note:** this endpoint needs something to actually call it every few
minutes once the site is deployed (a free service like cron-job.org or a
scheduled GitHub Action, pointed at the URL with the `CRON_SECRET` header).
There's nothing to poll while developing locally, so this hasn't been
wired up yet — see [Known limitations](#known-limitations).

## Local development

```bash
npm install
npm run dev       # http://localhost:8080
```

You'll need a `.env` file (see `.env.example` for the full list) with your
own Supabase project, Brevo account, and Airtable base credentials. None
of the required third-party accounts cost anything at the scale this app
currently runs at.

Other useful commands:

```bash
npm run build      # production build
npm start          # run that build as a plain Node server (see Deployment below)
npm run preview    # serve the build locally via Vite's preview server
npm run lint        # eslint
npm run format      # prettier
```

### Deployment

`npm run build` produces a Web-standard `fetch` handler (`dist/server/server.js`)
rather than a ready-to-run Node server — that's intentional, since TanStack
Start leaves wiring it up to whatever platform you deploy to. `server.entry.mjs`
at the repo root does that wiring for a plain Node host (Railway, Render,
etc.): it uses `h3-v2`'s `serve()` to listen on `process.env.PORT`, and — this
part matters — it also serves the built static files from `dist/client/assets`
itself, since nothing else does that for you on a bare Node host. Without that
static-file layer the page loads as an empty, non-interactive shell (this was
caught and fixed by testing the built app in a real browser, not just checking
HTTP status codes on routes).

To run the production build locally exactly as a host would:

```bash
npm run build
npm start          # http://localhost:3000 by default, or $PORT
```

### Database migrations

Migrations live in `supabase/migrations/` in the order they should be
applied. There's no automated migration runner connected yet — each one
needs to be pasted into the Supabase project's SQL Editor and run by hand,
in filename order, the first time you set up a new project.

## Known limitations

Things that are deliberately incomplete right now, not oversights:

- **Email deliverability is still warming up.** `theboysremovals.co.uk` is a
  brand-new sending domain — SPF, DKIM, and DMARC are all correctly
  configured and verified (via Google Postmaster Tools and per-message
  "Show original" checks), but new domains still land in spam intermittently
  for the first weeks with some providers (Yahoo especially) simply because
  they have no sending history yet. This resolves on its own with time and
  consistent legitimate sending; there's nothing further to configure.
- **Photos aren't synced to Airtable.** They're securely stored in Supabase
  and can be viewed there (by quote ID), but don't yet show up as
  attachments alongside the rest of a quote's details in Airtable.
- **No live deployment yet.** The app runs locally; `server.entry.mjs` and
  `npm start` make it deployable to a plain Node host (Railway and Render
  are good fits), but actually deploying it is a separate, not-yet-done
  step — and it's the prerequisite for wiring up the decision-polling
  endpoint's schedule.
- **No privacy policy or data retention automation yet.** The site
  collects real personal data (names, addresses, photos of properties),
  which has real UK GDPR obligations — a privacy policy page and an
  automated retention/deletion policy for old quotes are planned but not
  yet built.
- **Single fixed crew size.** The pricing model assumes one standard
  2-person crew; it doesn't yet account for jobs that would realistically
  need a larger team.

## Project structure

```
src/
├── routes/
│   ├── index.tsx                    # Landing page
│   ├── quote.$type.tsx              # The quote form (house/apartment/office)
│   └── api.check-quote-decisions.ts # Polling endpoint for Airtable decisions
├── integrations/
│   ├── supabase/                    # DB client (anon + admin), generated types
│   ├── brevo/                       # Thank-you, admin-notification, decision emails (active)
│   ├── postmark/                    # Same emails, unused fallback provider
│   ├── airtable/                    # Sync a quote to Airtable, check for decisions
│   └── pricing/                     # Server function that runs the price calculation
├── lib/
│   └── pricing.ts                   # The pricing formula itself — see PRICING.md
└── components/                      # Landing page sections (Hero, Services, etc.)

supabase/migrations/                 # Every schema/RLS change, in order
PRICING.md                           # The pricing algorithm, explained in detail
server.entry.mjs                     # Node entry point for deployment — see Deployment
```
