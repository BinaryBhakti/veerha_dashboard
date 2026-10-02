// Overflow + JS-error check at 390/1024/1280 for given pages (parallel).
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const jobs = []; for (const f of process.argv.slice(2)) for (const w of [390, 1024, 1280]) jobs.push([f, w]);
  const bad = []; let i = 0;
  const worker = async () => { while (i < jobs.length) { const [f, w] = jobs[i++];
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.resolve(f), { waitUntil: 'load' }).catch(e => errs.push(e.message)); await p.waitForTimeout(700);
    const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (o > 0 || errs.length) bad.push(`${f} @${w}: overflow=${o} ${errs.join(' | ')}`);
    await ctx.close(); } };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(bad.length ? bad.join('\n') + `\n${bad.length} issues` : `all clean @390/1024/1280 (${jobs.length} checks)`);
  await b.close();
})();
