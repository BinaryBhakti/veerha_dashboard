# Screenshotting local HTML pages with Playwright

Hand this file plus `shot.js` to whoever needs it. The script is tested; the
notes below are the five decisions that actually matter — each one is a bug that
cost time before it was fixed.

## Quick start

```bash
npm i -D playwright            # or point PLAYWRIGHT_PATH at an existing copy
node tools/shot.js --root . --page screens/13-org.html --sel "#org-chart,#team"
node tools/shot.js --root . --page index.html --full --width 1280
```

Output lands in `./shots` (override with `--out`). Env overrides:
`CHROME_PATH`, `PLAYWRIGHT_PATH`.

## The five things that matter

**1. Serve over HTTP — never open `file://`.**
`shot.js` starts a tiny static server in the same process. Over `file://`,
relative CSS and font paths break, `document.fonts.check()` cannot be trusted,
and origin restrictions make style probes misreport. Serving also lets you set
a correct `Content-Type` charset — without `charset=utf-8`, characters like
`₹ · — ×` come out as mojibake **in the PNG**, which is easy to mistake for a
font problem.

**2. Use the system Chrome via `executablePath`.**
Playwright's own browser download is often absent and fetching it is a ~300MB
detour. Point at the installed Chrome instead:
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` on macOS.

**3. `deviceScaleFactor: 2`.**
At 1× the type is soft and you cannot judge typography, hairline borders or
1px separators — which is usually the entire reason for the screenshot.

**4. Wait for fonts, not just the network.**
`load` and even `networkidle` can fire before webfonts swap in, so the shot
silently captures the fallback face and everything looks subtly wrong. Await
`document.fonts.ready`, then a short beat.

**5. Screenshot elements, not the whole page.**
`page.$(sel)` then `el.screenshot()`. When one file holds many sections this is
far more useful than a full-page dump, and it avoids sticky headers overlapping
the region you wanted. Full-page captures also stitch tall pages in a way that
can double-render `position: sticky` chrome.

## Bonus: catch errors in the same pass

The script subscribes to `pageerror` and `response` and reports JS errors and
any 4xx/5xx. A screenshot that looks fine while the console is throwing, or
while an icon sprite 404s, is a screenshot that lies. Getting this for free on
every capture is worth the six lines.

## Related checks worth stealing

Once a page is open in Playwright you may as well assert on it:

- **Overflow** — walk elements where `scrollWidth > clientWidth` and the parent
  is not a scroll container. Skip `SVGElement`: SVG nodes report meaningless
  `clientWidth` and produce false positives.
- **Unresolved `<use>`** — any `<use href="#x">` where `#x` does not exist
  renders as nothing at all, and is invisible in a screenshot.
- **Fonts actually loaded** — `document.fonts.check('600 16px YourFace')`.
- **Computed-style assertions** beat grepping the source. Example: to find
  currency wrongly set in a monospace face, filter leaf nodes whose text matches
  a grouped amount and whose computed `font-family` matches `/mono/i`. A regex
  over the HTML missed cases a computed-style probe caught immediately.
