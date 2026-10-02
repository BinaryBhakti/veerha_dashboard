# Veerha — screens outside the agreed 77

**For the scope-control clause of KK/VEE/UX-2026-01**, which requires additional effort and fee to
be confirmed in writing before the work begins.

This is not a list of things we forgot. It is the gap between what the contract fixed at 77 and
what the live application actually contains, established by crawling it on 21 September 2026.
Each item below is a real, distinct surface in the product that the agreed scope does not cover.

---

## Group 1 — Template variants · 7 screens

Each of these exists in the product and each is a near-copy of a screen already in the 77 — same
layout, different entity. They are folded in the manifest, which means the pattern is delivered
but the specific screen is not drawn.

| Screen | Route | Folded into | What designing it separately would add |
|---|---|---|---|
| Contact lists | `/contact-lists` | Contacts | Its own list-management actions and empty state |
| Catalog synonyms | `/catalog-synonyms` | Recommendations | The AI-proposed-synonym approval copy |
| Occasions | `/occasions` | Recommendations | Occasion-specific fields and calendar tie-in |
| Inventory | `/inventory` | Properties | Stock-level columns and availability states |
| Automation settings | `/settings/automation` | Sales settings | Its own section grouping |
| Learning | `/learning` | Review Queue | The curation-set half of the loop |
| Integrations | `/settings/integrations` | Channels | Per-integration detail and connection states |

**Recommendation:** leave folded. The client gets the pattern and their engineers can apply it.
If any are wanted individually, they are the cheapest possible add-on because the layout is
already designed — it is copy and configuration work only.

---

## Group 2 — Undesigned states of screens that ARE in the 77 · 3 screens

These are the ones worth raising, because in each case **the captured state is the empty one and
the missing state is what the product is actually for.** The 77 includes the screen; it does not
include the second state.

| Screen | What we have | What has never rendered |
|---|---|---|
| **Proposal builder** `/opportunities/:id/stay` | The empty basket — *"Nothing picked yet"* | The populated basket: line items, per-night maths, totals, validity, *Create link*. This is the screen that actually sends a proposal. |
| **Organisation chart** `/org` | Every person unplaced, two explainer cards | The tree itself — connectors, depth, drag behaviour, and the record-visibility preview the explainer promises |
| **Booking detail** `/front-desk/:id/:ref` | The *booked elsewhere* variant, which deliberately shows nothing | A Veerha-originated booking: payment taken, extras, the guest's own answers, check-in status |

**Recommendation:** price these three. They are the highest-value screens in their modules and
designing the empty state alone is close to designing nothing. The org chart in particular is the
single highest-uncertainty item in the whole product.

---

## Group 3 — Responsive · the whole set

The agreement promises *"Responsive layout considerations for desktop, tablet and mobile where
relevant"* and the proposal says layouts will be *"intentionally recomposed around the task rather
than compressed from desktop."*

Phase 1 delivers **desktop only**. Tablet and mobile are a second pass across all 77.

The audit found this is not cosmetic work — the live app's mobile has real structural failures:
- The section sub-navigation renders **inline above the page content** on ~55 of 103 routes. On
  Settings the nav is ~27 items ≈ 1,400px, so more than half the app opens on a phone showing
  nothing but a menu.
- The data table does not respond at all — it renders at desktop width in a horizontal scroller,
  with only the checkbox column visible.
- The three-pane inbox loses two panes with no affordance to reach them.

**Recommendation:** quote as phase 2. It also needs the *VEERHA — MOBILE RESPONSIVE DESIGN
GUIDELINES* document (60 numbered sections), which is referenced throughout the prototype handoff
but is not in our possession.

---

## Group 4 — Dark mode

Deferred from the design system by agreement. The tokens are structured for it and the light
system is a genuine inversion away, but the prototype's dark palette was measured and has a real
structural problem: it sits so close to black that surfaces cannot separate by fill —
card-against-canvas measured **1.20:1**, topbar-against-canvas **1.07:1**. It needs rebuilding
rather than inverting.

**Recommendation:** quote separately, after the light screens are approved.

---

## Summary for the conversation with the client

| Group | Screens | Recommendation |
|---|---|---|
| Template variants | 7 | Leave folded — pattern is delivered |
| Undesigned second states | 3 | **Price these.** Highest value, and the empty state alone delivers little |
| Responsive, all three bands | 77 | Phase 2. Needs the mobile spec document |
| Dark mode | — | Phase 3 |

Nothing in the crawl is out of scope because the product is bigger than the contract — the
application is actually *smaller* than its route table suggests. The gap is duplicated routes and
undesigned states, not missing modules.
