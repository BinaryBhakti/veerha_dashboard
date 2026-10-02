// Usage: node tools/shoot.cjs dashboard/overview.html [more.html ...]  -> scratch screenshots + checks
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const OUT = process.env.OUT || '/private/tmp/claude-501/-Users-ashmit-Desktop-Projects-VEERHA/e9143def-b723-4cca-bb9a-12191a9bc062/scratchpad/out';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const files = process.argv.slice(2); const mobile = !process.env.NO_MOBILE;
  const b = await chromium.launch({ channel: 'chrome' });
  for (const f of files) {
    for (const vp of mobile ? [[1440, 900, 'd'], [390, 844, 'm']] : [[1440, 900, 'd']]) {
      const p = await (await b.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: vp[2] === 'm' ? 2 : 1 })).newPage();
      const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await p.goto('file://' + path.resolve(f), { waitUntil: 'networkidle' }).catch(e => errs.push('nav ' + e.message));
      await p.waitForTimeout(1300);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 0) { const bad = await p.evaluate(() => { const W = window.innerWidth; return [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); if (r.right <= W + 1 || r.width === 0) return false; let a = e.parentElement; while (a) { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX)) return false; a = a.parentElement; } return true; }).slice(0, 6).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].join('.') + ' r=' + Math.round(e.getBoundingClientRect().right)); }); errs.push('OVERFLOW: ' + bad.join(', ')); }
      // SEL="#a,#b" captures those elements instead of the page. One module file
      // holds many labelled frames, so a page-level shot would compare a whole
      // stack against a single "before" capture. NAME_BY_SEL names each file
      // after its selector rather than the page it came from.
      let name;
      if (process.env.SEL) {
        const sels = process.env.SEL.split(',').map(x => x.trim()).filter(Boolean);
        // A sticky or fixed page header overlaps whatever element sits under it
        // at capture time, so it lands inside the element screenshot. Hide any
        // sticky/fixed element that is not itself part of the target.
        await p.evaluate((sels) => {
          const targets = sels.map(s => document.querySelector(s)).filter(Boolean);
          window.__restore = [];
          document.querySelectorAll('body *').forEach(el => {
            const pos = getComputedStyle(el).position;
            if (pos !== 'sticky' && pos !== 'fixed') return;
            // Sticky headers INSIDE a frame (inbox pane headers, table heads) are
            // part of the design and must stay; only page chrome outside every
            // target is hidden.
            if (targets.some(t => t.contains(el) || t === el)) return;
            window.__restore.push([el, el.style.visibility]);
            el.style.visibility = 'hidden';
          });
        }, sels);
        for (const sel of sels) {
          const el = await p.$(sel);
          if (!el) { errs.push('selector missing: ' + sel); continue; }
          // Name from the leading #id when there is one, so "#leads .vs-frame__box"
          // lands as leads_d.png rather than leadsvs-frame__box_d.png.
          const idm = sel.match(/#([A-Za-z0-9_-]+)/);
          const nm = (idm ? idm[1] : sel.replace(/[^a-zA-Z0-9_-]/g, '')) + '_' + vp[2] + '.png';
          await el.screenshot({ path: path.join(OUT, nm) });
        }
        await p.evaluate(() => {
          (window.__restore || []).forEach(([el, v]) => { el.style.visibility = v; });
          window.__restore = [];
        });
        name = sels.length + ' element(s)';
      } else {
        name = f.replace(/[\/.]/g, '_') + '_' + vp[2] + '.png';
        await p.screenshot({ path: path.join(OUT, name), fullPage: !!process.env.FULL || vp[2] === 'd' });
      }
      console.log(`${f} [${vp[2]}] overflowX=${over}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''} -> ${name}`);
      await p.context().close();
    }
  }
  await b.close();
})();
