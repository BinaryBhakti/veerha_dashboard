# Veerha — the 77-screen build manifest

**Indigo Slate · desktop · light** · derived from the 21 Sep crawl (`audit/`, 103 captures)
Agreed against engagement KK/VEE/UX-2026-01: 51 internal · 10 public · 6 auth · 10 bespoke.

This is the contract of what gets built and where it lives. Nothing gets designed that isn't on
this list; nothing on this list gets skipped without it moving to `ADD-ONS.md`.

---

## How the 103 captures reduce to 77

| | Count | |
|---|---|---|
| Files in `audit/screens/` | 103 | |
| Byte-identical duplicates | −9 | 3 groups, verified by checksum |
| Same design, different record | −12 | 6 lead drawers, 4 opportunity drawers, 2 threads |
| Tab or branch of a listed screen | −7 | 4 workspace tabs, import branch, listing step, integrations |
| A state of a listed screen | −3 | populated Leads, empty inbox, bad-token activate |
| Failed / non-design captures | −2 | blank render, rate-limit error |
| Folded template variants | −7 | see the cut list below |
| **Distinct designs from the crawl** | **63** | |
| Never captured, still in contract | +14 | 10 guest pages, OAuth return, workflow canvas, and 2 hidden states |
| **Total built** | **77** | |

**Use `SCREEN-INVENTORY.md` as the index of record, not `inventory.json`** — the JSON holds only
90 of the 103 entries and is missing every auth screen.

---

## Bucket A — Standard internal · 51

| # | Screen | Route | Arch | File | Reference |
|---|---|---|---|---|---|
| 1 | Leads index | `/leads` | A1 | 02-leads | `leads.png` (empty) + `root.png` (populated) |
| 2 | Lead record drawer | `/leads?open=` | A3 | 02-leads | `leads-open-ID.png` |
| 3 | Opportunities index | `/opportunities` | A1 | 03-opportunities | `opportunities.png` |
| 4 | Opportunity drawer | `/opportunities?open=` | A3 | 03-opportunities | `opportunities-open-ID.png` |
| 5 | Proposal builder (stay) | `/opportunities/:id/stay` | A8 | 03-opportunities | `opportunities-ID-stay.png` |
| 6 | Quotations index | `/quotes` | A1 | 04-quotes | `quotes.png` |
| 7 | Customers index | `/customers` | A1 | 09-customers | `customers.png` |
| 8 | Touchpoints | `/touchpoints` | A1 | 07-queues | `touchpoints.png` |
| 9 | Contacts index | `/contacts` | A1 | 02-leads | `contacts.png` |
| 10 | Segments | `/segments` | A6 | 02-leads | `segments.png` |
| 11 | Import wizard | `/imports` | A7 | 02-leads | `imports.png` + `-kind-leads.png` |
| 12 | Lead capture widget | `/capture` | A5 | 02-leads | `capture.png` |
| 13 | Tasks | `/tasks` | A2 | 07-queues | `tasks.png` |
| 14 | Callbacks | `/callbacks` | A2 | 07-queues | `callbacks.png` |
| 15 | Review Queue | `/review` | A2 | 07-queues | `review.png` |
| 16 | Recommendations | `/recommendations` | A2 | 10-campaigns | `recommendations.png` |
| 17 | Workflows index | `/workflows` | A2 | 11-ai | `workflows.png` |
| 18 | WhatsApp inbox | `/conversations` | A4 | 06-conversations | `conversations-open-ID.png` |
| 19 | Channels / speed-to-lead | `/channels` | A5 | 06-conversations | `channels.png` |
| 20 | WhatsApp templates | `/templates/whatsapp` | A8 | 06-conversations | `templates-whatsapp.png` |
| 21 | Bookings (month) | `/bookings` | A10 | 05-bookings | `bookings.png` |
| 22 | Front Desk (day) | `/front-desk` | A10 | 05-bookings | `front-desk.png` |
| 23 | Booking detail | `/front-desk/:id/:ref` | A3 | 05-bookings | `front-desk-ID-*.png` |
| 24 | Booking links | `/booking-links` | A5 | 08-calendar | `booking-links.png` |
| 25 | Your hours | `/settings/hours` | A5 | 08-calendar | `settings-hours.png` |
| 26 | Campaign builder | `/launch` | A7 | 10-campaigns | `launch.png` |
| 27 | Landing page builder | `/landing-pages` | A8 | 10-campaigns | `landing-pages.png` |
| 28 | Sequences / cadence | `/sequences` | A8 | 10-campaigns | `sequences.png` |
| 29 | Marketing attribution | `/attribution` | A9 | 10-campaigns | `attribution.png` |
| 30 | AI Employees index | `/ai-employees` | A1 | 11-ai | `ai-employees.png` |
| 31 | Create AI Employee | `/ai-employees/new` | A5 | 11-ai | `ai-employees-new.png` |
| 32 | Hire AI Employees | `/hire` | A6 | 11-ai | `hire.png` |
| 33 | Knowledge | `/knowledge` | A6 | 11-ai | `knowledge.png` |
| 34 | Agent Memory | `/memory` | A5 | 11-ai | `memory.png` |
| 35 | AI Voice Calling | `/calling` | A5 | 11-ai | `calling.png` |
| 36 | Deliveries & Tools | `/deliveries` | A1 | 11-ai | `deliveries.png` |
| 37 | Properties | `/properties` | A1 | 12-catalog | `properties.png` |
| 38 | Property listing wizard | `/properties/new` | A7 | 12-catalog | `properties-new.png` |
| 39 | Pricing | `/pricing` | A5 | 12-catalog | `pricing.png` |
| 40 | Team & Access | `/team` | A5 | 13-org | `team.png` |
| 41 | Departments | `/departments` | A5 | 13-org | `departments.png` |
| 42 | Fields & Qualification | `/fields` | A5 | 14-settings | `fields.png` |
| 43 | Forms & Intake | `/forms` | A5 | 14-settings | `forms.png` |
| 44 | Workspace settings (5 tabs) | `/settings/workspace/*` | A5 | 14-settings | `settings.png` + 4 tabs |
| 45 | AI Behaviour | `/settings/ai` | A5 | 14-settings | `settings-ai.png` |
| 46 | Pipeline & automation | `/settings/sales` + `/settings/automation` | A5 | 14-settings | `settings-sales.png` + `settings-automation.png` (merged — stages and the thresholds that move them) |
| 47 | Developers | `/settings/developers` | A5 | 14-settings | `settings-developers.png` |
| ~~48~~ | ~~System & Infrastructure~~ | `/system` | — | — | **Retired 7 Oct** — the platform-operator console; the October sitemap puts it out of scope. The number is not reused. |
| 49 | Billing & Plan | `/billing` | A5 | 15-billing | `billing.png` |
| 50 | Wallet | `/wallet` | A5 | 15-billing | `wallet.png` |
| 51 | System states (403/404/500/loading) | global | error | 14-settings | `superadmin.png` |

## Bucket B — Bespoke · 10

The agreement **enumerates these ten by name**. That enumeration is the allocation.

| # | Screen | Route | Arch | File | Reference |
|---|---|---|---|---|---|
| 52 | Email studio | `/templates/email` | A8 | 06-conversations | `templates-email.png` |
| 53 | **Workflow canvas** | `/workflows` → Open | A8 | 11-ai | **never captured** |
| 54 | Catalogues | `/catalogs` | A6 | 12-catalog | `catalogs.png` |
| 55 | Mail (3-pane + folder rail) | `/mail` | A4 | 06-conversations | `mail.png` |
| 56 | Dashboard / shift brief | `/dashboard` | A9 | 01-home | `dashboard.png` |
| 57 | Calendar | `/calendar` | A10 | 08-calendar | `calendar.png` |
| 58 | Organisation chart | `/org` | bespoke | 13-org | `org.png` (tree never rendered) |
| 59 | Onboarding (conversational) | `/onboarding` | A7 | 13-org | `onboarding.png` |
| 60 | Analytics & Control Room | `/analytics` | A9 | 01-home | `analytics.png` |
| 61 | Creative Studio | `/studio` | A8 | 10-campaigns | `studio.png` |

## Bucket C — Authentication · 6

| # | Screen | Route | Arch | File | Reference |
|---|---|---|---|---|---|
| 62 | Sign in | `/login` | A11 | 16-auth | `login.png` |
| 63 | Create your company | `/register` | A11 | 16-auth | `register.png` |
| 64 | Forgot password | `/forgot-password` | A11 | 16-auth | `forgot-password.png` |
| 65 | Set a new password | `/reset-password` | A11 | 16-auth | `reset-password.png` |
| 66 | Activate account (+ bad token) | `/activate` | A11 | 16-auth | `activate.png` (failure branch only) |
| 67 | **OAuth return / Google callback** | `/auth/callback` | A11 | 16-auth | **never captured** |

## Bucket D — Public / customer-facing · 10 · **archetype A12, new**

No app shell. Mobile-first single column, brand-themed from Workspace → Brand.
**Built — 28 September 2026**, in `17-public.html`, and judged at 390 before desktop.

Four of the ten are drawn against live captures of the current pages; six are designed from the
product's own definitions (`settings/fields` gives the enquiry and preference field sets,
`settings/hours` the slot rules). Two routes the contract names **do not resolve in production at
all**: `/s/:token/review` falls through to the marketing page, and `/book/:token` reports *"No
bookable people yet"*. `/q/` and `/p/` render nothing because there is no data behind them.
That is a finding about the product, not a gap in the research — and the **Evidence** column below
says, per row, which of the two a frame stands on.

All ten use the Rivergrove fixture, continuous with the dashboard on purpose: #73–76 are the guest
side of **BKG-4417 / Kavya Reddy** (frame 30), #69 is **QT-0100 / Nandini Gokhale** — the quote the
dashboard calls *"never opened, 4 days"* — and #71 books time with **Tara Menon** (frame 57). The
booking record says her preferences were *"answered on the check-in page, not guessed"*; #74 is
that page, and it collects exactly those four answers.

| # | Screen | Route | File | Evidence | Anchored in |
|---|---|---|---|---|---|
| 68 | Public enquiry form | `/f/:slug` | 17-public | live `/f/` capture — field set + layout | `forms.png` builds the field set; `onboarding.png` publishes the link |
| 69 | Quotation — view & respond | `/q/:token` | 17-public | designed — `/q/` has no page yet | `quotes.png` has *Awaiting reply · Accepted · Rejected* |
| 70 | Stay page — ready to confirm | `/s/:token` | 17-public | designed — `/p/` empty in production | stay builder: *"one page they can confirm on"*; drawer shows an **Expired** chip |
| 71 | Meeting booking | `/book/:token` | 17-public | designed — *"No bookable people yet"* | `booking-links.png`; checked against `settings/hours` |
| 72 | Reschedule / cancel | `/book/r/:token` | 17-public | designed | `calendar.png` rows offer Reschedule / Cancel |
| 73 | Stay page — after booking | `/s/:token` | 17-public | **live `/s/` capture** — structure verified | guest mirror of `front-desk-ID-*.png` |
| 74 | Online check-in | `/s/:token/check-in` | 17-public | **live `/s/…/check-in` capture** | front desk complains it *"holds nothing"* for outside bookings |
| 75 | Preferences & consent | `/pref/:token` | 17-public | designed from `settings/fields` | `fields.png` — bed pref, allergies (Sensitive), birthday (PII), all at **0% filled** |
| 76 | After-stay page — rate your stay | `/p/:token` | 17-public | confirmed **absent** in production | contract names "review"; attribution closes on confirmed bookings |
| 77 | Terminal states (thank-you / expired / actioned) | all tokenized | 17-public | **expired copy verbatim from live** | `landing-pages.png` thank-you field; Expired chip |

---

## The cut — 7 screens folded into a listed template

Each is a copy-and-entity variant of a design already in the manifest, not a new layout.

| Cut | Folds into | Why |
|---|---|---|
| `/contact-lists` | #9 Contacts | Identical skeleton; only the noun changes |
| `/catalog-synonyms` | #16 Recommendations | Same Pending/Approved/Rejected approve-reject queue |
| `/occasions` | #16 Recommendations | Header + centred empty card + CTA, identical |
| `/inventory` | #37 Properties | Same 4-column flat table, no stat row, no filter bar |
| `/settings/automation` | #46 Sales settings | One card of three numeric inputs; belongs as a second group |
| `/learning` | #15 Review Queue | Literally the downstream half of Review Queue |
| `/settings/integrations` | #19 Channels | Same breadcrumb, same shell, different section content |

These are the marginal calls. If the client wants any designed individually, the cheapest swaps
out are #36 Deliveries, #29 Attribution or #48 System — all low-traffic admin surfaces.

---

## Effort shape

**46 of 77 are template-and-configure.** A1 (9) + A2 (5) + A5 (19) + A6 (4) + A11 (6) plus two
A10s and one A3. Build the template once, then the rest is a column schema and copy.

**A5 is the single biggest win in the project** — 19 screens whose shell, nav, tab strip and save
bar are byte-identical. Build the frame plus ~12 field primitives once and 19 screens become
content.

**~21 are genuinely bespoke** — A8 (7), A7 (3 different machines: top stepper / left step list /
chat transcript), A9 (3), A3 (2 of 3), A4 (1 of 2), the org chart and the error page.

**10 guest pages are one new shell plus copy** — but the shell does not exist and neither does
any reference for it.

---

## ⚠ Risk register

**12 of the 77 have no screenshot at all** — the 10 guest pages, the OAuth return and the workflow
canvas. That is 16% of the contract and effectively 100% of the design risk. The guest pages need
**one real share link per route** from the client to close; ask before `17-public.html` is
scheduled.

**Three captured screens are hiding a second, undesigned state** — and in each case it is the
state the product actually exists for:
- **Proposal builder** — only the empty basket has ever rendered. The populated state (line items,
  per-night maths, totals, validity, *Create link*) is undesigned.
- **Org chart** — every person is unplaced, so the tree, its connectors, its depth handling and the
  visibility preview it implies have never rendered. Highest-uncertainty screen here.
- **Booking detail** — only the *booked elsewhere* variant exists, which deliberately shows
  nothing. The Veerha-originated booking with payment, extras and check-in status is undesigned.

**Two states are known-broken in the live app** and should be designed as they ought to be, not as
captured: `settings/workspace/localization` renders blank, and two captures returned rate-limit
errors.

---

## October additions · #78–#99 — and what changed in the 77

Source: the client sitemap of 2 Oct 2026 and a read-only re-crawl of the live app on 7 Oct
(Hotels workspace, owner role; `audit/oct/`). Plan and findings: `PLAN-2026-10.md`.
**#78–#99 are new scope** and are listed in `ADD-ONS.md`. Numbers continue; none is reused.

**Evidence** says what each frame stands on: *live* = captured on 7 Oct; *live (empty)* = the
route exists but holds nothing in that workspace, so the populated state is designed;
*sitemap* = designed from the client's description, not observed.

| # | Screen | Route | Arch | File | Evidence |
|---|---|---|---|---|---|
| 78 | Navigation by edition and role (spec) | global | spec | 14-settings | live sidebar + sitemap §0 |
| 79 | Connections | `/settings/integrations` | A5 | 14-settings | live |
| 80 | Rules — tiers and inactivity | `/settings/automation` | A5 | 14-settings | live |
| 81 | Google Reviews (+ answered, not connected) | `/google-reviews` | A4 | 06-conversations | live (empty) |
| 82 | Verify email (+ verified, expired) | `/verify-email` | A11 | 16-auth | live (missing-token copy) |
| 83 | Contact Lists (+ empty) | `/contact-lists` | A1 | 02-leads | live (empty) |
| 84 | Occasions (+ empty) | `/occasions` | A1 | 14-settings | live (empty) |
| 85 | AI synonyms | `/catalog-synonyms` | A2 | 12-catalog | live (empty) |
| 86 | Learning | `/learning` | A2 | 11-ai | live (empty) |
| 87 | Entry points (+ empty) | `/entry-points` | A1 | 14-settings | live (empty) |
| 88 | WhatsApp Forms (+ builder) | `/whatsapp-forms` | A1 / A8 | 14-settings | live (empty) |
| 89 | Teach Veerha (Business, Qualifying, How to talk) | `/settings/teach/*` | A5 | 11-ai | live — **not in the sitemap** |
| 90 | Grow | `/settings/grow` | A6 | 15-billing | live — **not in the sitemap** |
| 91 | Bring your CRM (+ stages/consent step) | `/imports/migrate` | A7 | 02-leads | live |
| 92 | AI Employee detail / edit | `/ai-employees/:id` | A3 | 11-ai | sitemap |
| 93 | Property detail | `/properties/:id` | A3 | 12-catalog | sitemap |
| 94 | Counter [E] (+ payment) | `/counter` | A10 | 18-commerce | sitemap — redirects in Hotels |
| 95 | Orders [E] | `/orders` | A1 | 18-commerce | sitemap — redirects in Hotels |
| 96 | Order drawer [E] | `/orders?open=` | A3 | 18-commerce | sitemap |
| 97 | Offers & coupons [E] | `/catalogs/offers` | A1 | 12-catalog | sitemap — redirects in Hotels |
| 98 | Photo Studio | `/photo-studio` | A8 | 10-campaigns | sitemap — redirects in Hotels |
| 99 | Guest record [H] | `/front-desk/:id` | A3 | 05-bookings | sitemap |

### Corrections to screens already in the 77

| # | Change |
|---|---|
| all | Re-framed inside the live navigation: 11-row sidebar, top tabs, Marketing and Settings rails |
| 8 · 14 · 55 · 60 | Re-homed under tabs: Touchpoints → Customers; Callbacks, Mail → Conversations; Analytics → Dashboard |
| 14b | Callbacks, populated |
| 19 | Becomes **Status & test**; the account half moves to #79 |
| 44b–e | Workspace: Localization, Tax, Storage, Access |
| 45 | AI behaviour reconciled to the four live sections |
| 46 | Becomes **Lead Stages**; thresholds move to #80 |
| 49 · 50b | Billing legal identity; Wallet low balance |
| 55b | Mail with no mailbox connected |
| 56 | Dashboard reconciled to the live shift brief |
| 59 | Onboarding becomes the **Setup Guide** steps |
| 63 | Register offers all three editions |
| 70 · 73 · 76 | Guest routes re-mapped: `/p/:token` is the After-stay page |
| 5 | Stay workspace states where its rates come from and that a missing rate is unknown |
| 18c | Chat — channel marker on every thread; composer modes for the 24-hour rule and public Instagram comments |
| 20 | WhatsApp templates show In review and Rejected, with Meta's reason |
| 59b | Setup Guide — Go live step |
| 70b | Stay page — paid, failed and closed after the Razorpay window |
| 81b · 81c · 82b · 82c · 83b · 84b · 87b · 88b · 89b · 89c · 91b · 94b | States and steps of the new screens |

## The working prototype · states and dialogs (8 Oct)

The walkthrough is the product: every button in it does something. These frames are the
modals and states that make that possible. They are **states of listed screens, not new
scope**. In the walkthrough they open as layers over the screen; on the sheets each one is
drawn as its own frame. Behaviours the live app never showed (Convert's landing, Mark won /
lost, quote send, stay-link send, Start my day, draft approve / edit) are designed from the
live copy and sitemap §6, and say so in their notes.

| # | Frame | File | Opened from |
|---|---|---|---|
| 2b | Lead — convert to opportunity | 02-leads | lead drawer strip, row Convert, row `…` menu, Review Queue card |
| 2c | Lead — now a deal | 02-leads | after Convert (sheet only) |
| 2d | Lead — action dialogs: follow-up, log call, meeting, note, assign, sequence, archive, delete, add a lead | 02-leads | drawer action row, row menus, *New lead* |
| 4b | Opportunity — mark won, mark lost, archive, delete | 03-opportunities | opportunity drawer |
| 5b | Stay workspace — send the stay page | 03-opportunities | *Create link* |
| 6c | Quotation — who is it for → items → review and send | 04-quotes | *New quotation* anywhere |
| 15b | Work queues — edit before approving, new task, reschedule | 07-queues | Review Queue, Tasks |
| 55e | Conversations — compose | 06-conversations | Mail *Compose*, `c` |
| 56c | Shared dialogs — create anything | 01-home | top bar *Create* |
