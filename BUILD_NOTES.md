# Veerha screens — build conventions

Static, high-fidelity HTML screens of the redesigned Veerha product.
Design language: `design-system/` (the deliverable), `HANDOFF.md`,
`~/Downloads/Veerha_Product_Design_System_v2.md` (v2 spec; departures are logged).
Contract: `screens/MANIFEST.md`. Plan: `~/.claude/plans/now-let-me-give-fluffy-bengio.md`.

Direction is **Indigo Slate**, light pinned, no serif UI, no direction switcher in-product.

---

## What a screen is

One file per module. Each screen is a **labelled frame** — the artboard, not a website:

```html
<section class="vs-frame vs-frame--h720" id="unique-id">
  <div class="vs-frame__hd">
    <span class="vs-frame__n">42</span><span class="vs-frame__name">Fields &amp; qualification</span>
    <span class="vs-frame__route">/fields</span><span class="t-meta muted">A5 · config</span>
  </div>
  <p class="vs-frame__note">One or two sentences: what this screen is for and what changed.</p>
  <div class="vs-frame__box"><div class="vs-app">
    <nav class="v-rail">…</nav>
    <div class="vs-main"><header class="v-topbar">…</header>
      <div class="vs-body vs-body--sectioned">…</div></div>
  </div></div>
</section>
```

`vs-frame__n` **comes from MANIFEST.md.** Never invent a number from a local sequence —
the gallery pairs before/after by that number, and a collision once put the wrong live
screenshot on three client-facing cards. `build-gallery.py` now hard-fails on duplicates.
State variants take a letter suffix of their base (`1b`, `58b`).

Height classes: `--h420 --h520 --h620 --h720`, or omit for auto.
`screens/_partials.html` is the authoring reference — copy shells from it. It never ships.

## Reference frames — mirror these, do not invent

- **A1 index** → `02-leads.html#leads` — pagehead + action cluster → scope tiles that double
  as filters → filter bar → table → pager.
- **A3 record drawer** → `02-leads.html#lead-drawer` — list stays readable behind at 62%;
  identity → badges → Recommended Next Step → Veerha's Read → Evidence → facts.
- **A5 config** → `14-settings.html#brand` and `10-campaigns.html#sequences` — section nav,
  intro card, pill tabs, stacked form cards, save bar in flow.
- **A6 gallery** → `12-catalog.html#catalogs` — completion meter where each gap states its cost.
- **A7 wizard** → three machines only: top stepper (`#import`), left step list
  (`#property-wizard`), chat transcript (`#onboarding`). Pick one; don't make a fourth.
- **A8 builder** → `10-campaigns.html#landing-pages` — config strip, palette ‖ canvas ‖ inspector.
- **A9 dashboard/measurement** → `01-home.html#analytics`, `10-campaigns.html#attribution`.

## Shared assets — DO NOT EDIT (owner: lead)

`design-system/system/*.css`, `screens/assets/shell.css`, `screens/assets/data.js`.

If a screen needs a component that does not exist, **report it — do not invent it locally.**
The lead adds it to `components.css` and gives it a specimen in `components.html`. A
page-local `.v-*` class is a fork and the check will fail the build.

## Rules

- **Tokens only.** No raw hex, no bare `border-radius: Npx`, anywhere in screen CSS.
- **Money is never mono.** Put `.amount` on any figure with a currency symbol. `.num` is for
  identifiers (`LEAD-0129`), times (`10:42`), scores, deltas and durations. A monospace comma
  takes a full cell, so `₹8,69,500` renders as `₹8 , 69 , 500`.
- **Every state is a frame.** Empty, loading and error are drawn, not described. An empty
  state answers three questions: what is empty, why, and what to do next.
- **Invented data only.** Rivergrove Retreat fixture in `screens/assets/data.js`. Names,
  numbers, emails, domains and booking codes are all fictional; emails use `@example.com`.
  Nothing from `audit/` reaches a screen — those are the client's real customer records.
- **Say the consequence, not the label.** Every control on a config screen states what
  happens, e.g. "anything above this becomes a decision in Waiting on you".
- **Charts**: hand-authored inline SVG, one series colour (`--chart-1`), no library. Four
  required slots: `.label` eyebrow → plain-language `h3` → timeframe/denominator → a bolded
  one-sentence conclusion. Plus `role="img"` and an `aria-label` stating the data in a sentence.
- **Status = text + icon + restrained colour.** Never colour alone.
- **Keep every field.** Columns, filters, tabs, KPIs, status values and actions listed in
  `audit/AUDIT.md` must survive the redesign. Reorganise freely; do not silently drop.
- Dense, not crowded. One primary button per visual group.

## Verify before reporting done

```
node tools/shoot.cjs screens/<file>.html            # overflowX + console errors, both viewports
node tools/mobilecheck.cjs screens/<file>.html      # 390 / 1024 / 1280, must be 0 overflow
```

Then **read the PNG** and fix what looks wrong. A screen is not done because the code looks
right. Targets: `overflowX=0`, no console errors, every `<use href="#i-…">` resolves, no
`.v-*` class that the design system does not define.
