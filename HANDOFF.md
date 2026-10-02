# Veerha dashboard prototype — handoff

**Artifact (live, republish to same URL):** https://claude.ai/code/artifact/8ed3e00c-d017-4e50-9902-4fea27954859
**Source:** `veerha-dashboard.html` — single file, no build. Edit → publish with the Artifact tool at the same file path.
**Spec:** `~/Downloads/Veerha_Product_Design_System_v2.md` (v1 is superseded; v2 explicitly replaces it).

## What this is
Client-facing prototype of Veerha (AI workforce OS for a Ganga-side resort). 7 screens × 4 visual directions, one page.

## Directions (switcher panel, bottom-right; keys 1–4)
| | Name | Identity |
|---|---|---|
| A | Warm Editorial | `#F7F7F4` canvas, cobalt `#3154C7`, Inter + Newsreader. The v2 doc executed literally. |
| B | Cold Press | Cool paper, deep pine `#1B4A3A`, Instrument Sans, dense, sharp radii. |
| C | Bureau | Near-white, **ink** buttons `#23262A` + steel accent `#3F5B78`, IBM Plex Sans/Mono figures. |
| D | Indigo Slate | The original first draft: slate + indigo + violet AI + **card layout** (icon-rail timeline, stacked-card lead detail, pill filters). |

Everything is token-driven. A direction = a token block + (for D) a structural overlay. Directions B/C/D each define light **and** dark tokens.

## Screens
Overview · Leads · Inbox (+conversation) · Workforce · Employee detail · Automations · Analytics.
Deep links: `#analytics`, `?dir=c`, `?theme=light` — combinable.

## Key decisions
- **v2 hard rules honoured:** light-first, no purple for AI (AI = warm greige system layer), dividers over cards, no generic sparkle (custom nested-V mark), semantic colour independent of brand.
- **Leads is a CRM table + detail drawer** (client request; also v2 §22/§43). Table/Queue toggle: Queue re-sorts by overdue → score with the recommended action as the primary button.
- **Six signature patterns** present throughout: Veerha's Read, Recommended Next Step, Evidence, Veerha Is Working, Waiting on You, AI Employee.
- Charts: one `--chart-1` token per direction, validated with the dataviz palette script (light + dark pass lightness band + contrast). Every chart has title + context + timeframe + takeaway.
- Content story ties together: **11 of 17 leads arrive on WhatsApp, which is disconnected** — surfaced on Overview, Employee, and Analytics.

## Playwright audit — findings and fixes (15 Sep 2026)

Audited with **Playwright 1.63** driving real device profiles (iPhone SE/14, Pixel 7, Galaxy S9+,
iPad Mini). Its cached browsers were the wrong revision, so it launches with
`executablePath` pointed at the system Chrome. Scripts live in the session scratchpad:
`audit.js` (static per-device), `flows.js` (29 interaction flows), `dirsweep.js`
(device × direction × theme × screen matrix).

**The critical find: the file had no `<meta name="viewport">`.** It relied entirely on the
artifact wrapper injecting one. Served any other way — a plain server, `file://`, an embed, a
webview — every device reported `clientWidth: 980` (Chrome's no-meta fallback), which drove
`uiScale()` to its 2.4 cap: **37px body text and a 151px nav bar on an iPhone**.

| Device | Real | Reported (before) | `--k` | Body |
|---|---|---|---|---|
| iPhone 14 | 390 | 980 | 2.40 | 37.2px |
| iPhone SE | 320 | 980 | 2.40 | 37.2px |
| Pixel 7 | 412 | 980 | 2.38 | 36.9px |

One line fixed it; every device now reports true width with `k=1.000`, body 15.5px, nav 64px.
**This is why iframe-based testing was not enough** — a fixed-width iframe constrains the
viewport and hides exactly this class of bug. Test with a device profile, not a sized frame.

Five other issues found and fixed:

1. **Lead names truncated at 320px** ("Gaurav Purwar", "Meera Iyer", "Rakesh Sharma").
   `.rc-nm` now wraps and the enquiry pill drops to its own row.
2. **Badges were 11.5px**, the smallest text in the UI — now 12.5px, which is the floor
   across the whole mobile UI (pipeline stage labels and chart notes were raised to match).
3. **One screen had three names** — breadcrumb "Employees", heading "Workforce", nav "Team".
   It is **Workforce** everywhere now; the sidebar *group* became "AI staff" so it does not
   read "Workforce › Workforce".
4. **The direction dial floated over content** (it covered the "Read only" badge on Workforce).
   It moved into the drawer — More → Direction. Nothing floats over the page any more.
5. **Analytics tiles were structurally inconsistent** — two carried a delta pill, two put prose
   in its place. All four now have label / figure / pill / caption and measure the same height.
6. **Employee status dot** centred against a two-line block; `align-items:flex-start` with a
   `.45em` nudge aligns it to the first line.

**Verified after:** 29/29 interaction flows pass, no JS errors, and a sweep of 3 devices ×
4 directions × 2 themes × 7 screens is clean — no overflow, no clipped text, nothing under 12px.

Two audit flags are **not** bugs: the `INPUT` reported at 24px tall is wrapped by a 50px
`.search` label which is the real tap target, and the 404 is a first-load `favicon.ico` the
published artifact supplies. Offline runs also log failed Google Fonts requests; the stacks
fall back cleanly.

## The four directions on mobile (15 Sep 2026)

The switcher is **back** (it was briefly hidden behind `?review=1`; the four directions are the
point of this prototype). `?review=0` hides both controls for a clean screenshot.

- **Desktop** keeps the panel, bottom-right, exactly as before.
- **Mobile** gets a compact dial (`#dirFab`, bottom-right above the nav) showing the current
  direction's swatch and letter. Tapping it opens the same four choices in the shared sheet,
  with the theme toggle in the footer. The panel itself covered the work on a phone.
  `setDir()` calls `syncDial()`, so the two can never disagree.

**The mobile card system was flattening all four directions.** It hardcoded every radius
(16/14/18/19/13/10/9/7px), so Cold Press and Bureau — both sharp-cornered directions — rendered
with the same soft 16px cards as Warm Editorial. Four new tokens per direction fix it:

| | `--r-card` | `--r-tile` | `--r-pill` | `--r-chip` |
|---|---|---|---|---|
| A Warm Editorial | 16px | 14px | 999px | 10px |
| B Cold Press | 6px | 5px | 4px | 4px |
| C Bureau | 4px | 4px | 3px | 3px |
| D Indigo Slate | 16px | 14px | 999px | 12px |

**Any new mobile surface must use these tokens, not a px radius**, or it will look identical in
all four directions.

**Direction reconciliation.** D carries its own *desktop* card overlay (`.brief`, `.plan`,
`.sect`, `.work-sect` all become bordered surfaces). On a phone the mobile system already cards
everything, so D was drawing a card around the cards — a double border that squeezed the KPI
tiles and clipped their labels. A reconciliation block in the mobile query stands D's overlay
down and keeps only its tokens; B gets a slightly tighter card, since dense is its character.

Related: `.bs-l` no longer truncates. "Leads captur…" is not a label — it wraps, and grid rows
stretch together so tiles stay level. D's Geist is wider than A's Inter, which is what exposed it.

## UI scale — why mobile type is `calc(Npx * var(--k))` (15 Sep 2026)

**The single most important thing to understand about this file's mobile CSS.**

A phone does not always report a phone-sized viewport. The artifact viewer handed this page
layout viewports of **650–840px** on a handset and then shrank the rendered page to fit the
physical screen. Fixed-px type therefore arrived about a third smaller than specified: 15px
body text at a 652px layout viewport on a ~390pt screen lands at roughly **9pt in the hand**.
No amount of re-tuning px values fixes that, because the shrink factor varies by viewer.

So every size in the mobile type block is `calc(Npx * var(--k))`, and `uiScale()` sets `--k`:

```
k = clientWidth / screen.width        clamped to [1, 2.4], and 1 outside the mobile band
```

`screen.width` is the device's own width; `clientWidth` is what the viewer claims. Their ratio
**is** the shrink factor. On a phone that reports honestly the ratio is 1 and nothing changes —
`--k` defaults to `1` in `:root`, so desktop and tablet are completely unaffected
(verified: desktop resolves `k=1.000`, row title 14px, buttons 36px).

**Rules when touching mobile sizes:**

- Any new `font-size`, `height`, `width` or `line-height` in the mobile block must be
  `calc(Npx * var(--k))`. A bare px value will look right at 390 and be wrong on a real phone.
- **Anything sized in px that sits beside scaled text must scale too** — a 12px numeral column
  under 20px text collides; a 52px topbar holding 73px buttons is a cramped bar. Icon chips,
  meter heights, avatar sizes, status dots and the topbar are all scaled for this reason.
- **Grid track minimums scale.** `.rcards` uses
  `minmax(min(calc(358px * var(--k)),100%),1fr)` — 358px is the width the card's *content*
  needs, so at 2.15× two columns left a card too narrow for its own phone number.

**How to find what you missed:** render the page twice, once at `--k:1` and once at `--k:2`,
walk every element that paints text, and report any whose font-size ratio is under 1.85. That
caught **ten** rules that bare-eye review had passed — almost all of them cases where a more
specific selector earlier in the query (`.screen .sect-head p`, `.bstat.attn b`, `.kpi b`)
silently out-ranked the scaled rule. Re-run it after any mobile type change.

## Dark mode and the stored-theme trap (15 Sep 2026)

**The client kept landing in dark even after light was pinned.** Cause: `localStorage`
held `veerha-theme = "dark"` from tapping the review switcher's Dark button in an earlier
build, and the light default deliberately respects a stored choice. Fixed by migrating the
key to **`veerha-theme-2`**, so the stale value is ignored once and everyone starts on light;
the toggle still persists from there. **If light ever needs to be re-asserted for reviewers,
bump the key again — do not delete the toggle.**

**Dark needed edges, not fills.** Measured on mobile: card-vs-canvas **1.20:1**, card border
**1.33:1**, topbar-vs-canvas **1.07:1** — which is why it read as one flat slab. The dark
palette is compressed near black, so two surfaces cannot separate by fill; contrast has to come
from the border. Every mobile card, the bottom nav and the topbar take `--border-strong` under
`[data-theme="dark"]` (border now 1.78:1) plus a real shadow on the nav. Text was already fine
at 4.9:1 and was not touched.

**Bottom nav:** the active state was a square-cornered fill inside an 18px-rounded bar, which
reads as a rendering glitch. It is now a rounded chip inset `6px 10px` drawn with `::before`.
Gotcha: lifting the content above that chip with `.bn > *{position:relative}` **broke the "17"
count and the alert dot**, which are absolutely positioned — it must be `.bn > svg,.bn > span`
only. Inactive nav items also moved from `--text-faint` to `--text-muted`; faint measured
2.5:1 on the dark bar.

## Mobile type scale and touch targets (15 Sep 2026)

The client's last note was that nothing was easy to tap. Measured, not guessed: **281 painted
text nodes were under 13px and 26 targets were under 44px**, because the desktop sizes had been
inherited wholesale into the mobile block.

Fixed with one block at the **end** of the mobile media query (so it wins over everything above
it), grouped by role rather than by selector:

- Body 15px/22. Row titles 15–15.5px, row metadata 13–13.5px, eyebrow `.label` 12px.
- Figures up: `.bstat b` 28px, `.stg-n` 22px, `.scoren` 16px.
- Avatars up: `.av-24` 30px, `.av` 36px, `.av-40` 44px — a 24px circle with 10.5px initials
  reads as a dot.
- Dense chips deliberately hold near 12.5–13px (`.badge`, `.kdelta`, `.rchip`) so rows still fit
  320px. **Everything you read went up; only what you glance at stayed small.**
- Targets: `.btn` 46, `.btn-sm` 44, `.period`/`.filter-btn` 46, `.search` 50, `.tab` 48,
  `.mfilt`/`.msort` 48, `.sheet-i` 52, `.rc-cta` 52, `.drawer-act .btn` 50, `.bn` 62.
  Where a control must stay visually small (`.cbox`, `.rc-edit`, `.quick button`, `.rowmore`)
  the hit area is grown with `::after{inset:-N}` instead of inflating the glyph.

**Audited after the change: 154 interactive targets across all 7 screens, none under 44×44;
smallest painted text 11.5px** (badge labels only).

**Two gotchas this surfaced:**
- `.rc-hd .cbox` (0,0,2,0) silently beat the mobile `.cbox` rule (0,0,1,0) and stayed 19px.
  Same specificity trap as `.bstat span` — in this file, always check whether a more specific
  rule already exists before setting a size in the mobile block.
- Larger badges broke `.lrow-o .rt` onto one line at 320px; it needed `flex-wrap`. **Re-run the
  overflow regression after any type change** — bigger text is a layout change.

## Mobile card system (15 Sep 2026) — built to client reference screenshots

The client supplied three reference dashboards (CloudForce sales, a freight console, a lease
manager) and asked for the complete mobile dashboard in that language. What was adopted:

| Reference pattern | In Veerha |
|---|---|
| 2×2 KPI tiles: icon chip, label, figure, delta pill | `.bstat` tiles; "Waiting on you" spans the row in the danger tint |
| A `···` on every panel | `.card-ovf`, injected into each `.sect-head` on mobile; its first sheet item is the card's own existing link, so control and destination cannot disagree |
| Period selector | `.period` pill on Today and Analytics, opening the shared sheet |
| Progress meters with values | Pipeline stages and lead scores; `.meter` is 7px and rounded on mobile |
| Cards on a tinted canvas | `.screen .sect`, `.emp`, `.ins`, `.plan`, `.list-pane`, `.kpi` — 16px radius, hairline border, `--e1` |
| Floating pill nav | `.botnav` inset 12px, 18px radius, lifted off the edge |
| Avatar in the header | `.topbar-av` |

**Two traps in this file that cost real time — do not repeat them:**

1. **`.delta` was already taken.** The timeline uses `<span class="delta">Score 72 → 91</span>`.
   A new `.delta` for the KPI pill hid it on desktop. The KPI pill is `.kdelta`. **Grep before
   naming a class in a 4,000-line single file.**
2. **`.bstat span` out-specifies `.bs-ic`.** The base CSS has `.bstat span{display:block}`
   (0,0,1,1), so hiding the tile parts with bare classes (0,0,1,0) silently failed on
   desktop while appearing to work on mobile. The hide and the show are both written as
   `.bstat .bs-ic` etc. If a mobile-only part leaks onto desktop, check specificity first.

Both were caught by the regression probe, not by eye — it compares each screen against the
previous build and reports any element wider than the viewport whose parent is not.

## Visual correction (15 Sep 2026) — read this before restyling anything

The client rejected an earlier pass as "a dark editorial productivity app". Four things
changed, and they should not be reintroduced:

1. **No serif in the interface.** Direction A had `--display-font:var(--editorial)`, which set
   the daily-brief headline and Veerha's read in Newsreader. All four directions now use
   `var(--ui)`. `--editorial` stays defined for a limited brand accent; no UI text uses it.
   The italic `em` in the brief headline is gone too — it was the last editorial tell.
2. **Light is pinned, not preferred.** Without a stored choice or `?theme=`, the page now sets
   `data-theme="light"` explicitly instead of following `prefers-color-scheme`. The client kept
   opening it on a dark-mode phone and read dark as the brand. Dark is still one toggle away.
   *(For the record: dark was never the default — `:root` was always light. The complaint was
   about what their device did, but pinning light is the right call for a review prototype.)*
3. **The direction switcher is out of the product.** It only renders with `?review=1`, which
   sets `data-review` on the root. Keys 1–4 and `?dir=` still work. A design-exploration
   control inside the product is the single most obvious "this is a concept" tell.
4. **The dashboard got its anchors back.** The critique was that the recomposition went from
   too many cards to too little structure. Grouping is now at the **section** level — a surface
   per block with ruled rows inside — never one card per metric. The daily summary is a single
   grouped data block with ruled cells, with "Waiting on you" tinted and spanning the row.

**Standing instruction from the client:** *do not interpret design adjectives literally.*
"Premium", "editorial", "structured" are principles, not instructions to add serif faces,
dark backgrounds or decorative styling. The target is premium operational software that a
sales team keeps open eight hours a day — clarity, density, hierarchy, usability, then personality.

**Mobile dashboard order** (client-specified, implemented via `data-m` + `order`):
daily summary → recommended actions → waiting on you → top leads → Veerha is working →
pipeline → live → insights.

**Lead detail first viewport:** WHO → score as one line → RECOMMENDED NEXT STEP with its two
actions → contact rail → Veerha's read. The contact toolbar and the full-width SCORE block used
to sit above the recommendation and pushed it off the first screen; the toolbar is now its own
`.ws-tools` section below the recommendation and the score is a single line.

## Responsive — recomposed to the mobile spec (15 Sep 2026)

Built to `VEERHA — MOBILE RESPONSIVE DESIGN GUIDELINES` (§ numbers below refer to it).
The visual system — type, colour, tokens — was **not** touched; only layout, navigation,
density, component presentation and interaction.

### Bands (§02)

| Band | Condition | Behaviour |
|---|---|---|
| **Mobile** | `max-width:767px`, **or** `max-width:1023px` with `pointer:coarse` / `hover:none` | Full app shell: drawer nav, bottom nav, records as cards, split views become screens. |
| **Tablet** | `768–1023px` **and** `pointer:fine` and `hover:hover` | Intermediate (§51, §52): 64px icon rail, secondary table columns dropped, `.tbl` min-width 880, page actions in overflow, inbox split kept at `270px + 1fr` down to 880px. |
| **Desktop** | `1024px+` (icon rail persists to 1080) | Unchanged. |

**The mobile band is keyed to the device, not only the width, and that is deliberate.**
A viewer handed a handset an **840px layout viewport**; a width-only test put that phone
in the tablet band and the client saw a clipped desktop. §02 says components should respond
to available space "not only device category" — here the reverse also holds: the category is
the only honest signal when the width lies. Any coarse-pointer or hoverless viewport below
1024 is a phone as far as the shell is concerned.

### What each component does on mobile (§50 contract)

| Component | Behaviour | Notes |
|---|---|---|
| Sidebar | **FULL-SCREEN** | Off-canvas drawer, full hierarchy, closes on select (§05). |
| Bottom nav | **TRANSFORM** | Today / Leads / Inbox / Team / **More**; More opens the drawer rather than being a sixth destination (§06). |
| Page actions | **MOVE** | Primary stays, `.ovf` (•••) opens a sheet built by reading the hidden `.btn-secondary`s, so the two cannot drift apart (§08). |
| Filters | **FULL-SCREEN** | `#leadScopes` renders into the bottom sheet; the control carries a count, and "All open" does not count as a filter (§10). |
| Sort | **FULL-SCREEN** | Same sheet, option list (§11, §38). |
| Leads table | **TRANSFORM** | `.rcard` grid, `auto-fill minmax(min(358px,100%),1fr)` — one column on a phone, two from 768 (§12, §30). |
| Table/Queue + List/Grid | **TRANSFORM** | Merged into one 3-way switch (List / Cards / Queue). On a phone there is no "table", so they were the same axis and cost two rows (§07). |
| Lead detail | **TRANSFORM** | Full-screen drawer; sections reordered by `order` to Facts → Follow-ups → Conversation → Options → Past dealings (§15). |
| Detail actions | **PRESERVE** | Sticky `.drawer-act` carries `next.a1` + `next.a2` — the recommendation's own two actions, so it never reads "Call" beside "Call now" (§16). |
| Pipeline | **STACK** | Five stages become a ruled vertical list (§28). |
| Facts | **STACK** | Definition list, label above value (§20). |
| Inbox | **TRANSFORM** | Master → detail; composer sticky above the bottom nav (§22, §23). |
| Employee detail | **COLLAPSE** | Every `.sect` becomes an accordion, first one open (§32). |
| Command centre | **FULL-SCREEN** | Bottom sheet, not a centred modal (§35). |
| Overview | **STACK** | Both grids `display:contents` so sections interleave by priority via `data-m`: brief → waiting on you → top leads → live → Veerha is working → pipeline → insights (§24, §25). |

### Rules worth not re-deriving

- **Touch targets (§40).** 44px everywhere. Where a control must stay visually small
  (`.cbox`, `.rc-edit`) the hit area is grown with `::after{inset:-12px}` rather than by
  inflating the glyph. The card rail is **six** 44px actions — seven would exceed the
  328px card interior and scroll by a margin that reads as a bug.
- **Scroll affordance (§45).** `.tabs` and `.rc-rail` carry a right-edge `mask-image` fade.
  A scroller with a hidden scrollbar and no fade is just hidden content.
- **Chrome budget (§07).** Leads content starts at **398px** on a 390-wide phone (was 456
  before the switch merge and the short count). Keep it under half the viewport.
- `.mcount` has long and short forms (`.mc-long` / `.mc-short`); it gives up its words
  before it gives up its row.

### Verified (§57)

320 / 360 / 390 / 430 / 768 / 840 / 1023 in the mobile shell and 768 / 900 / 1024 / 1280 / 1440
on the pointer bands, across all 7 screens, light and dark, directions A and D.
`scrollWidth === clientWidth` everywhere. The only elements wider than the viewport are the
two intentional scroll frames (`.tabs`, `.rc-rail`), both of which now show a fade.

**Testing the coarse-pointer branch:** headless Chrome always reports `pointer:fine`, so it
cannot match the mobile block above 767px. Copy the file, swap the mobile block's condition
to a plain `max-width:1023px` and neutralise the tablet block's `pointer:fine`, then test the
copy. That is how 840 was verified.

## Still open
- Settings screen; sidebar items Contacts / Companies / Activity / Insights / Integrations are inert.
- States kit: empty / loading skeletons / error / toasts / modals.
- Filters and the ⌘K palette navigate but don't actually search/filter.

## Verifying changes (no browser extension available)
Chrome headless works:
```bash
# serve with charset (a plain http.server mangles ₹ and · )
python3 - <<'EOF' &
import http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, p):
        t = super().guess_type(p)
        return t + "; charset=utf-8" if t == "text/html" else t
http.server.HTTPServer(("127.0.0.1",8731), functools.partial(H, directory="/Users/ashmit/Desktop/Projects/VEERHA")).serve_forever()
EOF
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --virtual-time-budget=5000 --window-size=1760,1250 \
  --screenshot=out.png "http://localhost:8731/veerha-dashboard.html?theme=light&dir=a#leads"
```
Headless defaults to **dark**, so pass `?theme=light` to check the primary theme.

**For phone widths you need an iframe harness.** macOS clamps the Chrome window to ~500px, so `--window-size=390,...` lays the page out at 500 and merely *crops* the shot — the page looks broken in ways the CSS isn't. Load the dashboard in a fixed-width `<iframe>` inside a wrapper page and screenshot the wrapper; log `document.documentElement.clientWidth` from inside the frame to confirm the width really took.

**Always syntax-check after editing the script** — two bugs this session came from Python string-replace landing code in the wrong scope:
```bash
python3 -c "s=open('veerha-dashboard.html').read();open('/tmp/c.js','w').write(s[s.rindex('<script>')+8:s.rindex('</script>')])"
node --check /tmp/c.js
```
`node --check` passes on scope bugs, so also confirm the DOM actually rendered (`--dump-dom`, or inject `window.onerror` into a temp copy to capture runtime errors).
