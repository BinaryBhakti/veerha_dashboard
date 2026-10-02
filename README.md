# Veerha — redesign prototype

Static, high-fidelity HTML for the redesign of **Veerha**, an AI-workforce CRM for
hospitality: AI employees, customer conversations and day-to-day operations in one
workspace. This repository holds the design system (**Indigo Slate**), the 77 agreed
screens built on top of it, a clickable walkthrough, the original single-file
dashboard prototype the direction was chosen from, and the tooling that keeps all of
it consistent.

There is **no framework, no bundler and no build step**. Every page is plain HTML and
CSS that opens from disk. That is a deliberate constraint, not an omission — the
folders are handed to a client who opens them offline — and most of the rules below
exist to make a no-build codebase stay coherent.

> **If you read one section, read [The rules](#the-rules).** They are enforced by
> scripts, and a change that breaks one will fail the deploy gate.

---

## Contents

1. [Quick start](#quick-start)
2. [Repository map](#repository-map)
3. [How the pieces fit](#how-the-pieces-fit)
4. [The design system](#the-design-system)
5. [The screens](#the-screens)
6. [The dashboard prototype](#the-dashboard-prototype)
7. [The rules](#the-rules)
8. [Generated files — do not edit by hand](#generated-files--do-not-edit-by-hand)
9. [Tooling](#tooling)
10. [Common tasks](#common-tasks)
11. [Deploying](#deploying)
12. [What is not in this repository](#what-is-not-in-this-repository)
13. [Known rough edges](#known-rough-edges)
14. [Decisions already taken](#decisions-already-taken)
15. [Further reading](#further-reading)

---

## Quick start

```bash
git clone git@github.com:BinaryBhakti/veerha_dashboard.git
cd veerha_dashboard
open hub.html                      # the landing page; links to everything
```

Opening from disk works for reading. For anything that involves checking rendering,
**serve it over HTTP with an explicit charset** — a plain `python3 -m http.server`
sends HTML without one, and `₹ · — ×` come out as mojibake:

```bash
python3 - <<'EOF'
import http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, p):
        t = super().guess_type(p)
        return t + "; charset=utf-8" if t == "text/html" else t
http.server.HTTPServer(("127.0.0.1", 8731), functools.partial(H, directory=".")).serve_forever()
EOF
# then http://127.0.0.1:8731/hub.html
```

Where to look first:

| Open | To see |
|---|---|
| `hub.html` | The entry point the client sees |
| `design-system/index.html` | The design system, rendered |
| `screens/index.html` | All 17 module files, 96 frames |
| `screens/walkthrough.html` | The same screens as one clickable product |
| `veerha-dashboard.html` | The original prototype: 7 screens in 4 visual directions |

Requirements for the tooling only: Node 20+, Python 3, Google Chrome, and Playwright
(see [Known rough edges](#known-rough-edges) — the scripts need one path fixed first).

---

## Repository map

```
.
├── hub.html                    Landing page. Becomes index.html in the client bundle
├── deploy.sh                   The only supported way to deploy (gate → deploy → verify)
├── BUILD_NOTES.md              Conventions for building a screen. Short; read it
├── veerha-dashboard.html       The original single-file prototype (4 directions, responsive)
├── veerha-dashboard copy.html  An earlier snapshot of it, kept for reference
├── HANDOFF.md                  Engineering notes for that prototype
│
├── design-system/              Indigo Slate — the system and its documentation
│   ├── system/
│   │   ├── tokens.css          Every value in the product. Single source of truth
│   │   ├── fonts.css           @font-face for the self-hosted faces
│   │   ├── fonts/              Geist + Geist Mono, woff2 (SIL OFL 1.1)
│   │   ├── base.css            Reset, type roles, layout primitives
│   │   ├── components.css      The component layer (.v-*)
│   │   └── sheet.css           Documentation chrome ONLY — not product code
│   ├── index.html              Cover and contents
│   ├── foundations.html        Colour, type, spacing, radius, elevation, icons, motion
│   ├── components.html         Every component, every state drawn as its own frame
│   ├── patterns.html           The six signature Veerha patterns
│   ├── spec.html               DESIGN-SYSTEM.md as a page
│   ├── departures.html         DEPARTURES.md as a page
│   ├── DESIGN-SYSTEM.md        The written spec — the reasoning, in one place
│   ├── DEPARTURES.md           Where this knowingly diverges from the v2 brief, and why
│   └── vercel.json
│
├── screens/                    The 77 agreed screens
│   ├── 01-home.html … 17-public.html   One file per module; each holds many frames
│   ├── index.html              Contents page for the module files
│   ├── walkthrough.html        GENERATED — clickable product view of the same frames
│   ├── _partials.html          Authoring reference for the shell. Never ships
│   ├── MANIFEST.md             The contract: which 77 screens, their numbers, their files
│   ├── ADD-ONS.md              Surfaces in the live product that fall outside the 77
│   └── assets/
│       ├── shell.css           Assembles design-system parts into the app frame (.vs-*)
│       ├── behaviour.js        Presentation-only interactions (filter, sort, toast, drawer)
│       └── data.js             The Rivergrove fixture — one invented dataset for all screens
│
└── tools/                      Checks, generators, capture scripts. See "Tooling"
```

---

## How the pieces fit

```
tokens.css ──► base.css ──► components.css ──► (sheet.css: docs chrome only)
   values        reset,        .v-* components
                 type roles
                     │
                     ▼
        screens/assets/shell.css      .vs-* — layout only, no colours or radii
                     │
                     ▼
        screens/NN-module.html        frames: one screen (or one state) each
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
 screens/index.html      screens/walkthrough.html   (generated by tools/wtgen.py)
        └────────────┬─────────────┘
                     ▼
                 hub.html
```

Three things about this are worth internalising before you write anything:

**1. Dependencies only point down.** `tokens.css` knows nothing about components;
`components.css` knows nothing about screens. A screen never defines a visual value of
its own.

**2. Screens link to the design system with a relative path** —
`../design-system/system/tokens.css`. Both folders are opened from disk, so absolute
or remote URLs would blank the pages offline and break `@font-face` across origins.
The consequence is that the *deployed* screens project carries a **copy** of
`design-system/`, and the two copies can drift. `deploy.sh` exists because they did.

**3. Class prefixes tell you who owns a rule.**

| Prefix | Owner | Where it is defined |
|---|---|---|
| `v-` | Design-system component | `design-system/system/components.css` |
| `g-`, `t-` | Layout and type primitives | `design-system/system/base.css` |
| `is-` | A forced state (`is-hover`, `is-active`, `is-expanded`) | alongside the component |
| `vs-` | Screen frame and shell assembly | `screens/assets/shell.css` |
| `wt-` | Walkthrough chrome | `screens/walkthrough.html` |

---

## The design system

`design-system/DESIGN-SYSTEM.md` is the full written spec. The short version:

### Tokens

Everything visual is a custom property in `tokens.css`, grouped in this order:
neutrals, brand, AI layer, semantic, charts, type, spacing, radius, elevation, layout,
motion, reserved.

The names you will reach for most, and the ones most often misremembered:

| Need | Token | Not |
|---|---|---|
| Success surface / icon | `--ok-bg` `--ok-bd` `--ok-tx` `--ok-ic` | `--success-*` |
| Warning | `--wn-bg` `--wn-bd` `--wn-tx` `--wn-ic` | `--warning-*` |
| Danger | `--dn-bg` `--dn-bd` `--dn-tx` `--dn-ic` | `--danger-*`, `--error-*` |
| Info | `--in-bg` `--in-bd` `--in-tx` `--in-ic` | `--info-*` |
| Text you must be able to read | `--text-muted` | `--text-faint` |
| Decorative only (dividers, disabled) | `--text-faint` | — |
| Form control edge | `--field-border` | `--border` |
| Chart series | `--chart-1` (the only one) | a second colour |
| Radius | `--r-chip` `--r-ctrl` `--r-tile` `--r-card` `--r-full` | a px value |

A wrong token name is the nastiest bug in this codebase: `var(--success-50)` is not a
syntax error, it simply resolves to nothing and renders a transparent background that
no structural check notices. `tools/tokencheck.py` catches it — run it.

### Four colour layers that do not borrow from each other

- **Neutrals** — cool slate. Structure. Surfaces separate with a 1px border, not a shadow.
- **Brand** — indigo `#4F46E5`. Action and selection only. Never status.
- **AI layer** — warm greige. Everything Veerha itself produced. Deliberately *not*
  violet: violet sat 19° from the brand hue and read as ordinary brand chrome.
- **Semantic** — ok / warning / danger / info. Colour is never the only signal; every
  status also carries a label, and most an icon.

### Type

Geist for the interface, Geist Mono for figures in a column. Weights 400, 500, 600 —
there is no 700. **No serif anywhere in the interface.**

### Components and states

Every component state is written twice: the real pseudo-class so it behaves, and a
forced `.is-*` class so the documentation can draw it as a static frame.

```css
.v-btn:hover, .v-btn.is-hover { … }
```

That is what lets `components.html` show every state with no JavaScript, and it is a
convention you must keep when you add a state.

### The six signature patterns

Veerha's Read · Recommended Next Step · Evidence · Veerha Is Working · Waiting on You ·
AI Employee. They share one order — **insight, then evidence, then action** — and
`patterns.html` gives the anatomy of each. Use them as they are; do not build a
near-copy.

---

## The screens

### One file per module, many frames per file

A module file is not a page of the product. It is a **sheet of artboards**: each
`<section class="vs-frame">` is one screen, or one state of a screen, with a label
above it and the app drawn inside.

```html
<section class="vs-frame vs-frame--h720" id="unique-id">
  <div class="vs-frame__hd">
    <span class="vs-frame__n">42</span>
    <span class="vs-frame__name">Fields &amp; qualification</span>
    <span class="vs-frame__route">/fields</span>
    <span class="t-meta muted">A5 · config</span>
  </div>
  <p class="vs-frame__note">What this screen is for and what changed.</p>
  <div class="vs-frame__box"><div class="vs-app">
    <nav class="v-rail">…</nav>
    <div class="vs-main">
      <header class="v-topbar">…</header>
      <div class="vs-body vs-body--sectioned">…</div>
    </div>
  </div></div>
</section>
```

- **`vs-frame__n` comes from `MANIFEST.md`.** Never invent a number. The before/after
  gallery pairs screens by it, and a collision once put the wrong screenshot on three
  client-facing cards. State variants take a letter suffix of their base: `1b`, `58b`.
- **`id`** is the anchor other pages and the walkthrough link to. Keep it stable.
- Height classes `--h420 --h520 --h620 --h720` fix the viewport for screens whose
  panes only make sense at a real height. Omit for auto.

### The module files

| File | Module | Frames include |
|---|---|---|
| `01-home` | Home & intelligence | Dashboard / shift brief, loading state, Analytics & Control Room |
| `02-leads` | Leads | Index, record drawer, queue view, empty, channel error, Contacts, Segments, Import wizard, Capture widget |
| `03-opportunities` | Opportunities | Index, pipeline board, proposal builder, record drawer |
| `04-quotes` | Quotations | Index, empty |
| `05-bookings` | Bookings | Month, Front Desk day, booking detail |
| `06-conversations` | Conversations | Inbox (AI handling / human takeover), Channels, WhatsApp templates, Mail, Email studio |
| `07-queues` | Work queues | Tasks, Review queue, Callbacks, Touchpoints |
| `08-calendar` | Calendar | Day view, Your hours, Booking links |
| `09-customers` | Customers | Index, customer record |
| `10-campaigns` | Campaigns | Recommendations, Campaign builder, Sequences, Landing pages, Creative studio, Attribution |
| `11-ai` | AI workforce | AI employees, Workflow canvas, Workflows, Create / Hire, Knowledge, Memory, Voice calling, Deliveries |
| `12-catalog` | Catalogue | Catalogues, Properties, listing wizard, Pricing |
| `13-org` | Organisation | Org chart, Team & access, Onboarding, Departments |
| `14-settings` | Settings | Workspace, AI behaviour, Fields, Forms, Sales pipeline, Developers, System states |
| `15-billing` | Billing | Billing & plan, Wallet |
| `16-auth` | Authentication | Sign in, Register, Forgot / Reset password, Activate, OAuth return |
| `17-public` | Guest pages | Enquiry form, Quotation, Proposal, Meeting booking, Stay hub, Check-in, Preferences, Review, terminal states |

`16-auth` and `17-public` have **no app shell** — they sit outside the product, so
they have no rail or top bar and are skipped by the walkthrough generator.

### Archetypes

The live product's 103 routes collapse to a small set of layouts. Every frame is
tagged with one, and a new screen should reuse one rather than invent a structure.

| | Archetype | Reference frame to copy from |
|---|---|---|
| A1 | Index (table) | `02-leads.html#leads` |
| A2 | Work queue | `07-queues.html` |
| A3 | Record drawer | `02-leads.html#lead-drawer` |
| A4 | Conversation / multi-pane | `06-conversations.html` |
| A5 | Config | `14-settings.html#brand`, `10-campaigns.html#sequences` |
| A6 | Gallery | `12-catalog.html#catalogs` |
| A7 | Wizard — three machines only | `#import` (top stepper), `#property-wizard` (left steps), `#onboarding` (chat) |
| A8 | Builder | `10-campaigns.html#landing-pages` |
| A9 | Dashboard / measurement | `01-home.html#analytics`, `10-campaigns.html#attribution` |
| A10 | Calendar / schedule | `05-bookings.html`, `08-calendar.html` |
| A11 | Auth | `16-auth.html` |
| A12 | Public, customer-facing | `17-public.html` |

A5 is the biggest lever in the project: 19 screens share one shell, section nav, tab
strip and save bar.

### The fixture — `screens/assets/data.js`

One fictional world, **Rivergrove Retreat**, used across every screen so that a lead
on the dashboard is the same lead in the drawer, the quote, the booking and the
analytics. It exports `workspace`, `totals`, `leads`, `pipeline`, `employees`,
`working`, `waiting`, `insights`, `plan` and `charts`.

It is an **authoring reference, not a runtime dependency** — no page imports it. The
screens are static, and the numbers are written into the HTML by hand. When you
change a figure, change it in `data.js` first and then everywhere it appears; that
file is the reason counts agree across screens.

### Interactions — `screens/assets/behaviour.js`

Loaded by every module file and by the walkthrough. Toasts, row filtering, sort,
bulk-select, drawer open/close, rail expand. Two properties to preserve:

- **Presentation only.** It changes what is on screen, never any data.
- **Scoped to its own frame.** Every behaviour resolves its scope with
  `el.closest('.vs-frame, .wt-screen')`, so filtering one table cannot touch another
  on the same sheet.

---

## The dashboard prototype

`veerha-dashboard.html` is where the project started and it is a different kind of
artefact from everything in `screens/`. It is **one self-contained file** — its own
CSS, its own JavaScript, its own data — and it does **not** use `design-system/`.

| | `veerha-dashboard.html` | `screens/` |
|---|---|---|
| Purpose | Explore four visual directions | Deliver the chosen one across 77 screens |
| Structure | One file, ~5,900 lines | One file per module, shared CSS |
| Styling | Its own token blocks, one per direction | `design-system/system/*.css` |
| Rendering | JavaScript renders from an inline dataset | Static HTML |
| Responsive | Fully: mobile, tablet, desktop | Desktop; guest pages mobile-first |
| Theme | Light and dark | Light only |

What it contains: Overview, Leads, Inbox, Workforce, Employee detail, Automations and
Analytics, each in four directions — **A** Warm Editorial, **B** Cold Press,
**C** Bureau, **D** Indigo Slate. A direction is a token block under
`[data-dir="…"]`; D additionally carries a structural overlay. Direction D is what
became the design system.

Deep links combine: `#analytics`, `?dir=c`, `?theme=light`, `?review=0` (hides the
direction switcher for a clean screenshot).

**Read `HANDOFF.md` before changing it.** It documents things that are not visible
from the code and that each cost real time to find:

- **Mobile sizes are `calc(Npx * var(--k))`**, never bare px. Embedded viewers hand a
  phone a 650–840px layout viewport and shrink the result; `uiScale()` sets `--k` to
  the ratio so type lands at the intended physical size.
- **The mobile band is keyed to the pointer, not only the width** — for the same
  reason.
- **Each direction owns `--r-card` / `--r-tile` / `--r-pill` / `--r-chip`.** A px
  radius on a mobile surface makes all four directions look identical.
- **Specificity traps.** In a 5,900-line file a more specific rule almost always
  already exists; `.bstat span` silently out-ranked `.bs-ic`, and a second `.delta`
  hid the first.
- **The stored-theme key is versioned** (`veerha-theme-2`). Bump it to re-assert light
  for reviewers; do not delete the toggle.

Use it as the reference for **responsive behaviour and interaction** — the three
bands, the mobile card system, touch targets — which the static screens do not yet
implement. Do not use it as a source of styles or of sample data: its values are the
pre-system ones, and its dataset predates the Rivergrove fixture. The names in it are
on the block-list in `tools/piicheck.sh` and will fail the gate if they reach a
screen.

---

## The rules

Each of these is checked by a script in the deploy gate. They are listed with the
reason, because the reason is what tells you how to handle a case the rule did not
anticipate.

**1. Tokens only.** No raw hex and no bare `border-radius: Npx` in screen CSS, and
every `var(--x)` must name a token that exists.
*Why:* the moment one component carries its own value, the system stops being one.
*Checked by:* `deploy.sh` step 5, `tools/tokencheck.py`.

**2. No forked components.** A screen may only use `.v-*` / `.g-*` classes that the
design system defines. If a screen needs a component that does not exist, add it to
`components.css` **and** give it a specimen in `components.html` — never a page-local
`.v-*` class.
*Why:* a local class is invisible to everyone else and guarantees drift.
*Checked by:* `tools/forkcheck.py`.

**3. Invented data only.** Names, phone numbers, emails, domains and booking codes
are all fictional. Emails use `@example.com`; phones use the `+91 90000 100xx` block.
Nothing from the live-app capture reaches a screen.
*Why:* the capture is the client's real customer records, and it is the most
convenient source of realistic-looking data — which is exactly how it leaked twice.
*Checked by:* `tools/piicheck.sh`, `deploy.sh` step 6 (which also rejects any email
on a non-reserved domain).

**4. Money is never monospace.** Put `.amount` on any figure with a currency symbol.
`.num` (Geist Mono) is for identifiers, times, scores, deltas and durations.
*Why:* a monospace comma takes a full cell, so `₹8,69,500` renders as `₹8 , 69 , 500`.
*Checked by:* `tools/check.cjs` (computed-style probe).

**5. Every state is a frame.** Empty, loading and error are drawn, not described. An
empty state answers three questions: what is empty, why, and what to do next.
*Why:* a state with no design gets an accidental one.

**6. One shell.** The rail and top bar in every frame are byte-identical, written by
`tools/shell.py`. Do not hand-edit navigation in a frame.
*Why:* hand-written shells drifted into 26 rail variants and 68 top-bar variants; a
client clicking through watched the navigation change between screens.
*Checked by:* `python3 tools/shell.py --check`.

**7. Status is text + icon + restrained colour.** Never colour alone.

**8. Charts are hand-authored inline SVG**, one series colour (`--chart-1`), no
library. Four required slots: eyebrow label → plain-language `h3` → timeframe and
denominator → one bolded sentence of conclusion. Plus `role="img"` and an
`aria-label` that states the data in a sentence.

**9. Keep every field.** Columns, filters, tabs, KPIs and actions that exist in the
live product must survive the redesign. Reorganise freely; do not silently drop.

**10. Grep before you name a class.** In the original single-file prototype an
unprefixed `.delta` collided with an existing one and silently broke the desktop
timeline. Assume a more specific rule already exists.

---

## Generated files — do not edit by hand

| File | Generated by | From |
|---|---|---|
| `screens/walkthrough.html` (the stage and palette) | `python3 tools/wtgen.py` | the frames in the module files |
| The rail and top bar inside every frame | `python3 tools/shell.py` | the `NAV` table at the top of that script |
| `audit/gallery.html` | `python3 tools/build-gallery.py` | frames + `MANIFEST.md` + `tools/gallery_tags.py` |
| `dist/` | `tools/build-dist.sh` | the whole tree |

The walkthrough is a **view** of the module files, never a second copy. It went stale
once when it was maintained by hand. Edit the frame in its module file, then
regenerate.

---

## Tooling

Everything lives in `tools/`. Nothing here is needed to *view* the prototype.

### Checks (the deploy gate runs these)

| Script | What it asserts |
|---|---|
| `check.cjs` | Every screen file at 1512 and 1280: no horizontal overflow, every `<use href="#i-…">` resolves, fonts loaded, no JS errors, no failed requests, no currency in a mono face |
| `dscheck.cjs` | The same render checks for the six design-system pages |
| `wtdrive.cjs` | Drives the walkthrough: every panel link resolves, drawer and command palette open, nothing throws |
| `rail.cjs` | Measures the sidebar collapsed and expanded in pixels (240 expanded) rather than trusting a class |
| `forkcheck.py` | No `.v-*` / `.g-*` class is used that the design system does not define |
| `tokencheck.py` | Every `var(--name)` resolves to a defined token |
| `piicheck.sh` | No identifier from the live-app capture appears in `screens/` or `design-system/` |
| `shell.py --check` | Exactly one rail variant and one top-bar variant exist |

### While you work

| Script | Use |
|---|---|
| `shoot.cjs <file>…` | Screenshot at 1440 and 390, report overflow and console errors. `SEL="#a,#b"` captures elements |
| `mobilecheck.cjs <file>…` | Overflow and JS errors at 390 / 1024 / 1280 |
| `shot.js` | Standalone screenshotter with its own static server; documented in `SCREENSHOTS.md` |
| `linkcheck.cjs` | Crawls from `hub.html`, reports broken local links and unreachable pages |
| `livecheck.cjs <url>` | The same crawl against a deployed URL |

### Generators

| Script | Use |
|---|---|
| `shell.py` | Rewrites the canonical rail and top bar into every frame |
| `wtgen.py` | Regenerates the walkthrough stage from the module files |
| `build-gallery.py` + `gallery_tags.py` | The before/after gallery; `gallery_tags.py` holds the hand-written "what changed" tags per screen |
| `build-dist.sh` | Builds the client-facing bundle into `dist/`, with a secret scan and an exclusion check |

### Live-app capture (read-only)

`crawl.cjs`, `interactions.cjs`, `harvest.cjs`, `guest.cjs`, `audit-draft.py`,
`audit-packets.py`, `features.py`. These drove the audit of the client's production
app and write into `audit/`, which is not in this repository. They read credentials
from `VEERHA_USER` / `VEERHA_PASS` and never write them to disk. They navigate, hover
and open — they never submit, send, pay or change a setting, and `interactions.cjs`
keeps a skip-list of every control it refused to click. You do not need them to work
on the screens.

---

## Common tasks

### Change a colour, size or radius

Edit `design-system/system/tokens.css`. Nothing else. If it is a text or UI colour,
measure the contrast — text 4.5:1, non-text UI 3:1 — and update the swatch on
`foundations.html`.

### Add a component

1. Grep the class name you intend to use.
2. Add it to `components.css`, `v-` prefixed, tokens only.
3. Write every state twice (`:hover, .is-hover`).
4. Add a specimen to `components.html` showing **every** state, including disabled,
   loading and error.
5. `python3 tools/forkcheck.py && python3 tools/tokencheck.py`.

### Add or change a screen

1. Find its number and file in `screens/MANIFEST.md`. If it is not there, it is out of
   scope — it belongs in `ADD-ONS.md`, not in a module file.
2. Copy the nearest archetype's reference frame (see [Archetypes](#archetypes)); copy
   the shell from `_partials.html`.
3. Use the Rivergrove fixture. Keep figures consistent with `data.js`.
4. Draw the empty, loading and error states as their own frames.
5. Regenerate and check:

   ```bash
   python3 tools/shell.py                              # canonical rail + top bar
   python3 tools/wtgen.py                              # refresh the walkthrough
   node tools/shoot.cjs screens/NN-module.html         # then LOOK at the PNG
   node tools/mobilecheck.cjs screens/NN-module.html   # must be 0 overflow
   ./deploy.sh --check                                 # the full gate, no deploy
   ```

A screen is not done because the code looks right. Read the screenshot.

### Change the navigation

Edit the `NAV` table in `tools/shell.py`, then run it. It rewrites every frame and
patches the walkthrough. Do not edit a rail in place.

---

## Deploying

Three Vercel projects are served from this one tree:

| Project | URL | Built from |
|---|---|---|
| `veerha-design-system` | https://veerha-design-system.vercel.app | `design-system/` |
| `veerha-screens` | https://veerha-screens.vercel.app | `screens/` **plus a copy of** `design-system/` |
| `veerha-prototype` | https://veerha-prototype.vercel.app | `dist/`, from `tools/build-dist.sh` |

**Never run `vercel deploy` by hand for the first two.** Use:

```bash
./deploy.sh            # gate → stage → deploy both → verify
./deploy.sh --check    # run the gate only
./deploy.sh --verify   # checksum live against local; non-zero exit on drift
```

Because the screens project bundles a copy of the design system, deploying one
project alone lets the two live copies diverge silently — and they did, for several
batches. `deploy.sh` deploys both from one staged copy and then checksums every
shared file against both live URLs. **A green `--verify` is the only evidence that
live matches local;** a deploy log that says "success" proves nothing about what is
being served.

`.vercel/` links are per-machine and git-ignored, so a fresh clone has to be linked to
the Vercel projects before `deploy.sh` can push. `--check` needs no Vercel access.

---

## What is not in this repository

This repository is public. The following exist in the original working tree but are
git-ignored:

| Path | What it is | Why it is withheld |
|---|---|---|
| `audit/` | The crawl of the live app: screenshots, page-text dumps, interaction states, the written audit and feature inventory | Real customer names, phone numbers and emails; a workspace API key and a webhook token rendered in the UI; live guest share links |
| `WhatsApp Image … .jpeg` | A reference screenshot the client sent of another product | Shows that product's customer records |
| `dist/` | Build output of `tools/build-dist.sh` | A copy of the tree, including `audit/` captures |

Consequences you will notice:

- `hub.html` links to `audit/gallery.html`, which is a dead link in a fresh clone.
- `tools/build-gallery.py`, `tools/build-dist.sh` and the capture scripts expect
  `audit/` to exist and will fail without it.
- `MANIFEST.md` cites `audit/` screenshots as the reference for each screen.

Ask the project owner for `audit/` if you need it. **Do not un-ignore it** while the
repository is public.

---

## Known rough edges

Honest notes, so you do not lose an afternoon to them.

- **The Playwright path is hard-coded.** Most `tools/*.cjs` scripts `require()` an
  absolute path on the original author's machine
  (`/Users/ashmit/.npm/_npx/…/node_modules/playwright`). Only `shot.js` and `rail.cjs`
  honour `PLAYWRIGHT_PATH`. Before the gate will run for you:

  ```bash
  npm i -D playwright
  sed -i '' "s#'/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright'#'playwright'#" tools/*.cjs
  ```

  (drop the `''` after `-i` on Linux). The scripts launch the installed Chrome with
  `channel: 'chrome'`, so no browser download is needed.
- **`tools/wtgen.py` hard-codes `ROOT`** to an absolute path. Change it to resolve
  from `__file__`, as the other Python tools do.
- **`tools/shoot.cjs` defaults `OUT`** to a temporary directory that no longer exists.
  Set `OUT=./shots` when you run it.
- **`deploy.sh` uses `md5 -q`**, which is macOS-only.
- **`data.js` is kept in sync by hand.** There is no generator from fixture to HTML.
- **Light mode and desktop only.** Dark theme is deferred. Tablet and mobile bands are
  specified (see below) but only the guest pages in `17-public.html` are built
  mobile-first.
- **`dscheck.cjs` binds port 8809**; the other checks pick a free port.

---

## Decisions already taken

These were settled with the client. Reopening them costs a review cycle.

- **Indigo Slate is the direction.** Of four explored, it is the one that was chosen.
- **The AI layer is warm greige, not violet.** "AI is not purple."
- **No serif in the interface, light is pinned, and there is no theme or direction
  switcher inside the product.**
- **Do not read design adjectives literally.** "Premium", "editorial" and
  "structured" are principles about clarity and restraint — not instructions to add a
  serif face, a dark background or decoration. The target is operational software a
  sales team keeps open eight hours a day: clarity, density, hierarchy, usability,
  then personality.
- **Grouping is at the section level** — a surface per block with ruled rows inside,
  never one card per metric.
- **Scope is 77 screens.** The live product has more; the difference is documented in
  `screens/ADD-ONS.md` rather than quietly built.
- **Three responsive bands**, desktop built first:

  | Band | Condition |
  |---|---|
  | Mobile | `max-width: 767px`, **or** `max-width: 1023px` with a coarse pointer / no hover |
  | Tablet | 768–1023px with a fine pointer and hover — 64px icon rail |
  | Desktop | 1024px and up |

  The mobile band is keyed to the *device*, not only the width, because embedded
  viewers hand phones an 840px layout viewport. `--k` in `tokens.css` is reserved for
  the mobile scale factor and stays `1` until that band lands.
- **Where the system departs from the v2 brief, it says so.** Five conflicts are
  argued in `design-system/DEPARTURES.md`: two complied with, two departed from, one
  deferred.

---

## Further reading

| Document | Read it when |
|---|---|
| `BUILD_NOTES.md` | Before building or editing any screen |
| `HANDOFF.md` | Before touching `veerha-dashboard.html`, or when implementing responsive behaviour |
| `design-system/DESIGN-SYSTEM.md` | You need the reasoning behind a token or component |
| `design-system/DEPARTURES.md` | Someone asks why this is not what the v2 brief said |
| `screens/MANIFEST.md` | You need to know what is in scope, its number and its file |
| `screens/ADD-ONS.md` | Something is asked for that is not in the 77 |
| `tools/SCREENSHOTS.md` | You are screenshotting local HTML and it looks wrong |
