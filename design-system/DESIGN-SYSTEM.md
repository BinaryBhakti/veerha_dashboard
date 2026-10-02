# Veerha Design System — Indigo Slate

**Version 1.0 · September 2026 · Kora Kaagaz**
Engagement KK/VEE/UX-2026-01 · Deliverable 02, *Design system alignment*

This is the written companion to the pages in this folder. Open `index.html` to see everything
rendered; read this when you want the reasoning without a browser, or when you are implementing
and need the rules in one place. The same content is at `spec.html` if you would rather read it
as a page.

| File | What it is |
|---|---|
| `index.html` | Cover and contents |
| `foundations.html` | Colour, type, spacing, radius, elevation, icons, motion |
| `components.html` | The component library, every state drawn |
| `patterns.html` | The six signature Veerha patterns |
| `spec.html` | This document, as a page |
| `departures.html` | `DEPARTURES.md`, as a page |
| `system/tokens.css` | Every value in the system. The single source of truth |
| `system/base.css` | Reset, type roles, layout primitives |
| `system/components.css` | The component layer |
| `system/sheet.css` | Documentation chrome only — not product code |
| `DEPARTURES.md` | Where this knowingly diverges from design-system v2, and why |

**For engineering:** lift `tokens.css`, `base.css` and `components.css`. Leave `sheet.css` — it
styles this document, not the product.

---

## 1 · What this system is for

Veerha is not a conventional CRM. It puts AI employees, customer conversations and business
operations in one workspace, and the interface has to make that manageable rather than
impressive. Five questions have to be answerable at a glance:

> What happened? · What did Veerha do? · Why? · What needs my attention? · What happens next?

Everything here is in service of those. The four principles that decide close calls:

1. **Clarity before personality.** Sales teams keep this open eight hours a day. Hierarchy,
   density and scannability first; character after, and never at their expense.
2. **Humans stay in the loop.** The product always shows whether AI is acting, waiting, asking
   for approval, or handing back.
3. **Every claim shows its evidence.** A recommendation nobody can interrogate is one nobody
   will trust.
4. **Repeated work uses shared patterns.** The 103 routes in the live product collapse to 11
   layouts. A screen that invents its own structure is a screen that will drift.

---

## 2 · Colour

Four independent layers. They do not borrow from one another.

### Neutrals — structure
Cool slate. The canvas is `#F8FAFC`; surfaces are white and separate from it with a 1px border
rather than a shadow. The product is mostly flat.

### Brand — action and selection
Indigo, `#4F46E5` at step 600, with a full 50–900 ramp so components have a lighter or darker
step to reach for. Brand marks primary buttons, the active nav item, the selected row, and links.

**Brand does not carry status,** and it is never applied simply to make the interface look
branded. The one place it tints a whole surface is Recommended Next Step — because that is the
single most actionable thing on a screen.

### AI — the system layer
Warm greige: `#F4F2EA` background, `#D9D4C7` border, `#5F5A4F` text, `#6E6758` mark.

Everything Veerha itself produced sits here. **It is deliberately not a colour.** The earlier
violet measured 19° from the brand hue at 83% saturation — the same colour family as indigo — so
AI surfaces did not read as distinct from ordinary brand chrome, which defeats the point of
marking them at all. This greige is 158° opposite at 11% saturation. Against a cool canvas the
warmth is unmistakably deliberate.

AI identity comes from the Veerha mark, the wording, the evidence and the interaction pattern.
Colour is the quietest part of it.

### Semantic — meaning
Success, warning, danger, info. Each has a background, border, text and icon value, and all four
are independent of the brand. **Colour is never the only signal:** every status carries a label,
and most carry an icon. "Hot" is legible with no colour vision at all.

### Accessibility
All 30 foreground/background pairs in the system have been measured. Text clears 4.5:1; non-text
UI clears 3:1. Three values were changed from the prototype to get there:

| Token | Was | Now | Why |
|---|---|---|---|
| `--text-muted` | `#64748B` | `#626F85` | 4.34:1 on the subtle fill — under AA |
| `--text-faint` | `#94A3B8` | `#7C8899` | 2.45:1 on canvas, and it was being used for placeholder text |
| control borders | `#CBD5E1` | `#8690A3` | 1.48:1 — on a white card the border is the only thing identifying the field |

`--text-faint` is now **decorative only** — dividers, inactive glyphs, disabled controls. Anything
a person has to *read* uses `--text-muted`.

---

## 3 · Typography

Two faces, both open source under the SIL Open Font License 1.1, both self-hosted in
`system/fonts/` so the folder works with no network:

| Face | Token | Used for | Weights |
|---|---|---|---|
| **Geist** | `--ui` | The whole interface. Falls back to Inter, then the system sans | 400 · 500 · 600 |
| **Geist Mono** | `--num` | Figures only — table cells, stat numerals, scores, deltas. Falls back to `ui-monospace`, then Menlo | 400 · 500 |

Geist is built for interfaces — its letterforms stay distinct at 12–14px, which is where most of
this product lives. Geist Mono exists for one reason: every digit occupies the same width, so a
column of ₹ values lines up and can be compared by eye. A column of prices that doesn't align is a
column that can't be scanned. The full specimen — character set, the three weights, and the
tabular-versus-proportional comparison — is on `foundations.html`.

Three weights: **400, 500, 600.** There is no 700. Hierarchy comes from scale and spacing before
weight, and from weight before colour.

| Role | Size / line | Weight | Used for |
|---|---|---|---|
| Display | 32 / 40 | 600 | The daily brief headline |
| Page title | 24 / 32 | 600 | Page headers |
| Section | 18 / 26 | 600 | Section headings |
| Card title | 16 / 24 | 600 | Card and panel titles |
| Body | 14 / 21 | 400 | Default |
| Small | 13 / 19 | 400 | Table cells, secondary copy |
| Metadata | 12 / 18 | 500 | Timestamps, captions |
| Micro label | 11 / 16 | 600 | Uppercase eyebrows, `.075em` tracked |

**No serif anywhere in the interface.** This is a standing client instruction, and it comes from a
real misread: "premium" and "editorial" are principles about clarity and restraint, not
instructions to add a serif face or a dark background.

Fonts are self-hosted in `system/fonts/` so the folder works with no network.

---

## 4 · Space, shape, depth

**Spacing** is an 8px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. Use the token, not the number.

**Grid** is 12 columns, 24px between them, 32px at the page edge. Major elements align to it —
nothing is positioned independently.

**Radius**, one value per role, identical at every breakpoint:

| Role | Value | Applies to |
|---|---|---|
| `--r-chip` | 4px | Badges, chips |
| `--r-ctrl` | 6px | Buttons, inputs, selects |
| `--r-tile` | 10px | Stat tiles, nested surfaces |
| `--r-card` | 12px | Sections, panels, drawers |
| `--r-full` | — | Avatars, dots, compact semantic pills **only** |

The prototype declared a 16px card radius but applied it only on mobile — desktop surfaces were
actually 10px, so cards changed shape between breakpoints for no reason. That is now reconciled.

**Elevation** is mostly absent. L0 (no shadow) is the default for pages, tables and sections. L1
for cards, L2 for menus and popovers, L3 for modals and drawers. Cards should not all appear to
float.

---

## 5 · Components

`components.html` is the reference. Every component is shown with each of its states drawn as a
separate frame — default, hover, pressed, focus, selected, disabled, loading, error — because a
state you can only reach by hovering is a state nobody reviews.

Naming: every class is `v-` prefixed, and forced states use `.is-*`.
`.v-btn:hover, .v-btn.is-hover { … }` — the real pseudo-class for behaviour, the class for
documentation.

### Four components that do not exist in the product today

The live app was crawled across 103 screens. These were absent, and they are designed here rather
than documented:

- **Loading / skeletons.** Not one instance anywhere, in a product whose AI work genuinely takes
  seconds — generating creative, reading a listing, regenerating settings. Skeletons preserve the
  layout that is coming so the page does not jump.
- **Field validation.** No error text and no invalid styling anywhere, including registration and
  the property wizard. Error copy must be specific: *"Add the domain — this address is missing
  its .com"*, not *"Invalid email"*.
- **Confirmation dialog.** None captured, yet destructive buttons exist — red trash icons on
  workflows and tasks, cancel links on follow-ups. **Worth verifying in the live app** whether
  those fire unconfirmed.
- **Pipeline board.** `/opportunities` offers a `Table | Pipeline` toggle, but every pipeline view
  captured was an identical table. **Look at the live app before designing this** — a kanban for
  61 deals designed blind is a bad bet.

### Two structural fixes carried into the system

- **The detail drawer has one header and one close button.** The live drawer has two of each — an
  outer drawer header and a second record header nested inside it — on all twelve drawer screens.
- **The save bar sits in the page footer, in flow.** Today it is pinned bottom-right on every
  settings screen and covers the content beneath it.

---

## 6 · The signature patterns

Six compositions that should become more recognisable than the palette. `patterns.html` has the
full anatomy of each.

| Pattern | Carries | Must contain |
|---|---|---|
| **Veerha's Read** | Interpretation | Conclusion sentence · evidence paragraph · attribute line · "Based on:" provenance |
| **Recommended Next Step** | Action | The action with a time · one-line justification · exactly two buttons |
| **Evidence** | Reasoning | Claim/source ledger, gaps included, every source clickable |
| **Veerha Is Working** | Autonomy | Timeline of time / action / object-or-delta |
| **Waiting on You** | Human judgment | A count · ruled rows · a right-aligned verb link |
| **AI Employee** | Accountability | Role · live state · scope · three performance figures |

They all obey one order: **insight, then evidence, then action.** A conclusion with no evidence is
a guess nobody can check; evidence with no action is homework. Reversing that order is the most
common way these patterns fail.

**Human handoff** has five states — AI handling, Human handling, Needs a human, Waiting for
approval, Paused — and when a person takes over the product says so in one unmissable line:
*"You are handling this conversation. Veerha's automation is paused."* Ambiguity about who is
replying is the worst failure this product can have.

---

## 7 · Writing

Short, direct, human, operational.

| Use | Not |
|---|---|
| "Needs your attention" | "Pending human intervention required" |
| "Veerha recommends a callback" | "AI-generated next-best-action recommendation" |
| "Take over" | "Initiate manual handling workflow" |
| "WhatsApp could not be connected. Your credentials expired on 18 September." | "Something went wrong." |

No hype, no "magic", no exclamation marks, no fake certainty, no anthropomorphic claims about what
the AI "feels".

---

## 8 · Extending this

New surfaces are composed from existing components before a new component is invented. When one is
genuinely needed:

1. **Grep the class name first.** In the prototype an unprefixed `.delta` collided with an existing
   one and silently broke the desktop timeline. Assume a more specific rule already exists.
2. **Reach only for tokens.** No raw hex, no bare pixel radius. This is checkable —
   `grep -nE '#[0-9A-Fa-f]{3,8}' system/base.css system/components.css` should return nothing.
3. **Draw every state** it can be in, including empty, loading and error. If a state has no
   design, it will get an accidental one.
4. **Measure the contrast** of any new colour pair. Text 4.5:1, non-text UI 3:1.
5. **Use variants, not duplicates.** A component with six looks is one component.

---

## 9 · Scope of version 1.0

**In:** light mode, desktop, the foundations, the component library and the six patterns.

**Next:** tablet and mobile (three bands — desktop, tablet at a 64px icon rail, mobile as a full
app shell), then the dark theme, then the 77-screen inventory itself.

The tokens the responsive layer will need are already declared — including `--k`, the mobile scale
factor, which stays at 1 everywhere until the mobile band lands — so nothing has to be retrofitted.

Two known gaps worth naming:

- **The mobile responsive specification is not in hand.** *VEERHA — MOBILE RESPONSIVE DESIGN
  GUIDELINES*, 60 numbered sections, is referenced throughout the prototype handoff but is not on
  file. Worth requesting before the responsive phase.
- **Ten customer-facing screens have not been seen.** The tokenized guest pages — quote,
  proposal, stay, check-in, booking, form, preferences — need one real share link each to capture.

See `DEPARTURES.md` for where this system knowingly diverges from design-system v2.
