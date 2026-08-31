# Quote pricing algorithm

This document explains exactly how `src/lib/pricing.ts` turns a submitted
quote request into a price. It's meant to stay in sync with that file —
if you change the numbers or the logic there, update this too.

Every quote runs through the same steps: base hours → access adder →
furniture adder → fragile-items adder → parking adder → packaging/unpacking
adder → round & apply the hourly rate → demand surcharge → add flat-fee
services → VAT.

## 1. Base crew hours

A size-based estimate for a standard 2-person crew, before anything else
is added.

| Property size             | Base hours         |
| ------------------------- | ------------------ |
| Studio                    | 3.0                |
| 1 bedroom                 | 3.5                |
| 2 bedrooms                | 4.5                |
| 3 bedrooms                | 6.0                |
| 4+ bedrooms               | 8.0                |
| Office, under 500 sq ft   | 3.0 (placeholder)  |
| Office, 500–1,000 sq ft   | 5.0 (placeholder)  |
| Office, 1,000–2,500 sq ft | 8.0 (placeholder)  |
| Office, 2,500+ sq ft      | 12.0 (placeholder) |

**Office numbers are always placeholders.** They scale with the declared
floor area band now (they used to be a single flat 5.0 hours regardless of
size), but office moves still vary too much in layout and scope to price
reliably from square footage alone — every office quote is automatically
flagged for manual review regardless of what this table produces (see
step 8).

## 2. Access adder — floor level

Applied **separately for the pickup and drop-off address**, then summed.
Ground floor is always zero. An upper floor adds:

```
adder (per address) = floor number × (has a lift ? 0.10 : 0.25) hours
```

"6+" floors is treated as exactly 6. A lift still gets a small adder
(rather than zero) to account for wait time and multiple trips — it just
costs much less than climbing stairs does.

> This field replaced an earlier "stairs + flights of stairs" adder. Floor
> level/number is a mandatory field on the form, so it's now the single
> source of "how high up" for pricing. The stairs toggle is still shown on
> the form for context, but no longer feeds the calculation.

## 3. Furniture adder

The furniture checklist requires selecting at least 3 items (or describing
what needs moving in free text as a fallback — see below). Items **beyond**
that required minimum of 3 add time, on the assumption that the first 3 are
already covered by the base hours above:

```
extra_items = max(0, furniture_items_selected − 3)
adder = extra_items × 0.25 hours
```

This applies the same way to both the residential furniture checklist
(Sofa, Armchair, Bed, Wardrobe, Chest of drawers, Dining table, Bookshelf,
Fridge/freezer, Washing machine, Other big pieces) and the office one
(Desks, Office chairs, Filing cabinets, IT equipment, Printers, Big
tables, Shelving units, Sofas/reception seating, Server racks, Other big
items) — whichever list applies to the property type.

**If the client used the free-text fallback instead of the checklist**
(fewer than 3 items ticked), no furniture adder is applied — there's no
reliable way to count items from free text — and the quote is
automatically flagged for manual review instead, so a human checks the
description before the price is finalized.

## 4. Fragile items adder

A flat addition to labour time when the client flags fragile items (art,
mirrors, glass, etc.) — extra care and padding takes extra time:

```
adder = fragile_items_flagged ? 0.5 hours : 0
```

Because this is added to labour hours (not a flat fee), it also picks up
the demand surcharge in step 6, same as every other hour on the job.

## 5. Parking adder

Applied **separately for the pickup and drop-off address**, then summed:

```
adder (per address) = no parking available ? 0.25 hours : 0
```

No parking at both ends adds 0.5 hours total — the assumption being a
longer carry distance or an extra trip between the van and the door.

## 6. Packaging and unpacking adders

If requested, each adds hours based on property size (the same table is
used for both — unpacking is assumed to take roughly the same effort as
packing did):

| Property size  | Extra hours (each)                               |
| -------------- | ------------------------------------------------ |
| Studio / 1 bed | +1.5                                             |
| 2 bed          | +2.0                                             |
| 3 bed          | +2.5                                             |
| 4+ bed         | +3.0                                             |
| Office         | +2.0 (placeholder, same rationale as base hours) |

If both packaging **and** unpacking are requested, both adders apply.

## 7. Round and price the labour

```
total_hours = base_hours + access_adder + furniture_adder + fragile_adder
            + parking_adder + packaging_adder + unpacking_adder
total_hours = round UP to the nearest 0.5, with a 4-hour minimum

labour_subtotal = total_hours × £85/hour
```

The £85/hour rate is exported as `HOURLY_RATE` in `pricing.ts`. The
4-hour minimum is a firm floor for the automated formula — exceptions
down to 3 hours happen sometimes in practice, but that's a manual call
made outside this calculation, not something the formula itself allows.

## 8. Demand surcharge

Two independent multipliers are calculated, and **the higher of the two
is used** — they never stack. This keeps a short-notice weekend move
from being punished twice.

**By day of the week** (of the move date):
| Day | Multiplier |
|---|---|
| Weekday | ×1.00 |
| Saturday | ×1.15 |
| Sunday, or a UK bank holiday | ×1.25 |

Bank holiday dates are hardcoded from the official England & Wales list
(`gov.uk/bank-holidays.json`) and currently cover **2026–2027 only** —
this list needs extending before it runs out, or bank-holiday moves
after 2027 will silently price as ordinary weekdays.

**By lead time** (move date minus the moment the quote was submitted):
| Booked | Multiplier |
|---|---|
| 7+ days ahead | ×1.00 |
| Less than 7 days | ×1.15 |
| Less than 48 hours | ×1.25 |

```
demand_multiplier = max(day_of_week_multiplier, lead_time_multiplier)
labour_total = labour_subtotal × demand_multiplier
```

## 9. Add-on services (flat fees, no demand surcharge)

These are priced independently of the labour calculation and are **not**
affected by the demand multiplier above.

**End-of-tenancy cleaning** — flat fee by property size:

| Property size  | Fee                                              |
| -------------- | ------------------------------------------------ |
| Studio / 1 bed | £180                                             |
| 2 bed          | £260                                             |
| 3 bed          | £340                                             |
| 4+ bed         | £420                                             |
| Office         | £340 (placeholder, same rationale as base hours) |

**Handyman services** — a flat placeholder of **£110** (2 hours × £55/hr).
There's no item-count field yet, so this is always an estimate pending
manual confirmation against whatever the client wrote in their notes.

**Furniture assembly/disassembly** — a flat placeholder of **£110**,
same rationale as handyman, and priced independently — if both handyman
and assembly are requested, both fees apply. This is deliberately
separate from Handyman services (which covers mounting and small repairs,
not furniture assembly — that's treated as the moving crew's job).

## 10. Final total and manual review

```
subtotal = labour_total + cleaning_fee + handyman_fee + assembly_fee
vat_amount = VAT_registered ? subtotal × 20% : 0
total = round(subtotal + vat_amount) to the nearest whole pound
```

VAT is controlled by the `VAT_REGISTERED` environment variable
(`"true"`/`"false"`), off by default.

A quote is automatically flagged `needs_manual_review` (and the specific
reasons are recorded) whenever any of the following is true:

- **Property type is office** — always, regardless of any other factor.
- **Handyman services requested** — the fee is a placeholder estimate.
- **Assembly/disassembly requested** — same reason.
- **Furniture was described in free text** rather than the checklist —
  fewer than 3 items were selected, so item count couldn't feed the
  furniture adder and a human needs to judge the load from the description.

Flagged quotes still get a calculated price (so they can be triaged and
sorted like any other request), but that price should be treated as a
starting point for review, not a final number.

## What isn't priced

- **Property photos** — deliberately excluded. Photos are for human (or
  future AI-assisted) visual review, not something a formula can weigh.
- **Crew size** — the whole model assumes a fixed 2-person crew. A move
  that would realistically need 3+ people isn't just "more hours," it's
  a different hourly rate, which isn't modeled.
- **Distance between the two addresses** — not currently collected or
  priced.

## Worked examples

**2-bed flat, pickup on the 3rd floor with no lift and no parking,
drop-off ground floor with parking, 5 furniture items (2 over the
minimum), fragile items flagged, booked well ahead on a weekday:**

```
base_hours = 4.5
access_adder = 3 floors × 0.25 (no lift) = 0.75
furniture_adder = (5 − 3) × 0.25 = 0.5
fragile_adder = 0.5
parking_adder = 0 (pickup has parking) + 0.25 (drop-off, wait — see note) = 0.25
total_hours = round_up(4.5 + 0.75 + 0.5 + 0.5 + 0.25) = 6.5
labour_subtotal = 6.5 × £85 = £552.50
demand_multiplier = 1.0 (weekday, well ahead of the booking window)
labour_total = £552.50
total = round(£552.50) = £553
```

(Verified against a real submission through the actual form, not just
hand-calculated — the numbers matched exactly.)

**Studio, ground floor both ends, minimum 3 furniture items, nothing
else requested — the new 4-hour minimum in action:**

```
base_hours = 3.0
total_hours = max(4.0, round_up(3.0)) = 4.0   ← the 4-hour minimum applies
labour_subtotal = 4.0 × £85 = £340
total = £340
```

## Where this runs

The calculation is triggered server-side, right after a quote request
is inserted — see `src/integrations/pricing/calculate-quote-price.ts`.
It's never run in the browser or trusted from client input; the price a
customer sees quoted back to them always comes from this same
server-side calculation, written onto the `quote_requests` row
(`calculated_hours`, `calculated_total`, `needs_manual_review`,
`pricing_breakdown`) and synced from there into Airtable.
