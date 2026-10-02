# Departures from Design System v2

**Veerha · Indigo Slate v1.0 · September 2026**

`Veerha_Product_Design_System_v2.md` governs this engagement. Indigo Slate — the direction
selected for the revamp — originated as the product's *first draft*, written before v2 existed.
In several places the two disagree.

This document exists so those disagreements are settled in writing, once, rather than re-argued in
every review. Each entry gives the rule as v2 states it, what Indigo Slate does, the reasoning, and
what we do to hold onto the rule's intent even where we depart from its letter.

The same content is at `departures.html` if you would rather read it as a page — that version also
renders the three AI-layer candidates side by side, and the card comparison.

**Summary: five conflicts. Two complied with, two departed from, one deferred.**

| # | v2 rule | Status |
|---|---|---|
| 1 | §02.5 / §08 / §65.7 — "AI does not equal purple" | ✅ **Complied** |
| 2 | §05 — warm-neutral canvas, not cool blue-grey | ⚠️ **Departed** |
| 3 | §06 — "Do not default to generic AI indigo" | ⚠️ **Departed** |
| 4 | §02.3 / §65.8 — "Do not design everything as cards" | ◐ **Partially complied** |
| 5 | §54 / §60 — dark mode must avoid navy + purple | ⏸ **Deferred** |

---

## 1 · "AI does not equal purple" — complied

> **v2 §02, rule 5:** "AI should have a subtle visual language, but it should not be represented by
> purple everywhere. AI identity should come primarily from: Veerha symbol + typography + wording +
> evidence + interaction pattern."
>
> **§65.7:** "Do not use purple as the default AI color."

**Indigo Slate as built:** a violet AI layer — `--ai-bg:#F5F3FF`, `--ai-bd:#DDD6FE`,
`--ai-tx:#6D28D9`, `--ai-ic:#7C3AED`.

**What we did:** removed it. The AI layer is now v2's warm greige — `#F4F2EA / #D9D4C7 / #5F5A4F /
#6E6758`.

**Why, beyond compliance.** This was measured rather than asserted. The violet mark sat **19° from
the brand indigo hue at 83% saturation** — by any reasonable definition the same colour family. An
AI panel therefore looked like ordinary brand chrome, which defeats the entire purpose of marking
it. The greige sits **158° opposite at 11% saturation**, and against the cool slate canvas the
warmth reads as deliberate rather than accidental.

Three candidates were rendered side by side on the actual canvas before choosing: warm greige, a
chromaless slate, and the existing violet. The slate was so quiet that AI went unmarked; the
violet's body text was noisy and its chip competed with the indigo primary button beneath it.

---

## 2 · The canvas is cool, not warm — departed

> **v2 §05:** "Use a **warm-neutral canvas** rather than the common cool blue-grey SaaS
> background." … "The warmth should be subtle. Do NOT make the application beige."

**Indigo Slate as built:** `--canvas:#F8FAFC` — a cool slate, which is precisely the blue-grey
the rule names.

**Status: departure, accepted.**

**Why.** The client selected this direction with the live product in front of them, and the live
product is cool-toned. A warmer canvas would have been the more faithful reading of v2, but it
would also mean the direction they chose is not the direction they receive.

**What we do to keep the rule's intent.** v2 wants warmth so the product doesn't read as a generic
cool SaaS template. We get that warmth from the **AI layer instead of the canvas** — and arguably
get it working harder there, because the warm greige only appears where Veerha itself has done
something. The contrast between a cool operational canvas and a warm system layer is now carrying
meaning rather than just being a mood.

**If the client wants to revisit:** warming the canvas is a two-token change (`--canvas`,
`--surface-subtle`) and nothing else in the system moves. It is genuinely cheap to try.

---

## 3 · Indigo as the brand accent — departed

> **v2 §06:** "Do not use the existing dashboard purple. **Do not default to generic AI indigo.**
> Explore a distinctive **cobalt / blue** or another controlled brand accent."

**Indigo Slate as built:** `--brand:#4F46E5` — indigo 600.

**Status: departure, accepted.** This is the direction's defining characteristic; removing the
indigo would make it a different direction. The client chose it knowing the alternatives — three
other directions were built and shown, including the cobalt one v2 points toward.

**What we do to keep the rule's intent.** v2's concern in §06 and §02.4 is that a brand colour gets
sprayed around to make a product look branded rather than to mean anything. So indigo is
constrained:

- It marks **action and selection only** — primary buttons, active nav, selected rows, links, focus.
- It **never carries status.** Semantic colour is fully independent of it.
- It tints exactly **one** whole surface in the system — Recommended Next Step — because that is
  the most actionable element on any screen.

A full 50–900 ramp now exists, which the prototype lacked. That matters for discipline as well as
convenience: without a ramp, components invent one-off indigos.

---

## 4 · Cards — partially complied

> **v2 §02, rule 3:** "Do not design everything as cards. Use typography, whitespace, dividers,
> tables, lists, grid, alignment **before** adding a card. Cards should represent meaningful
> grouped surfaces, not every piece of content."
>
> **§60 anti-patterns:** "Excessive cards."

**Indigo Slate as built:** a structural overlay whose own source comment reads *"every section
becomes its own bordered surface."*

**Status: partial compliance.** We keep the card structure, bounded by a rule the client
themselves supplied.

**Why it isn't a straight departure.** This exact question has already cost this project two
rounds. The first pass was judged to have too many cards; the correction went too far the other
way and was rejected as "a dark editorial productivity app" with too little structure. The
resolution the client landed on is specific and it is the rule we follow:

> **Group at the section level, not the metric level.** A surface per block with ruled rows inside.
> Never one card per number; never a wall of text and hairlines either.

So: a section is a card. The rows **inside** it are ruled, not carded. Nothing nests a card in a
card. No metric gets its own floating tile. That satisfies v2's actual concern — cards as
meaningful grouped surfaces — while giving the client the structure they asked for twice.

The client also later supplied three reference dashboards and asked explicitly for a card-based
mobile language, which supersedes the "dividers over cards" stance on mobile specifically.

---

## 5 · Dark mode — deferred

> **v2 §54:** "Dark mode is a theme inversion, not a new aesthetic. Do NOT use: neon purple,
> glowing cards, blue/purple gradients, luminous AI borders, glassmorphism." It should feel like
> "Veerha at night", not an "AI cyber dashboard".
>
> **§60 anti-pattern:** "Dark navy + purple combination."

**Indigo Slate as built:** `--canvas:#080D18` (a navy-black) with indigo `#6366F1` and a violet AI
layer — which is close to the exact combination §60 names.

**Status: deferred with the dark theme.** Version 1.0 is light only, by decision.

**What is already known for when it lands.** The prototype's dark palette was measured and it has a
real structural problem: it is compressed so close to black that surfaces cannot separate by fill.
Card-against-canvas came out at **1.20:1**, topbar-against-canvas at **1.07:1** — which is why it
read as one flat slab. Separation had to come entirely from borders.

So the dark theme should be rebuilt rather than inverted value-by-value: lifted surfaces with real
steps between them, and the AI layer re-derived as a dark warm neutral rather than a violet. The
navy-plus-violet objection resolves itself once the AI layer is greige, which is already done in
light.

---

## How to use this document

If a v2 rule is quoted in a review and it appears here, the answer is already written — point at
the entry. If a v2 rule is quoted and it **isn't** here, that is worth taking seriously: it means
we are either complying with it or we have missed it, and the second is worth checking.

Departures 2 and 3 are the two that are purely a matter of the client's preference rather than
evidence. Both are reversible at low cost, and both should be re-confirmed with the client at the
first design review rather than assumed settled.
