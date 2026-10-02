/**
 * Read share links off the pages that display them. READ ONLY — it opens
 * records and reads values; it never submits, sends, publishes or changes a
 * setting. Share URLs live in text, in readonly inputs, in href attributes and
 * in data-copy payloads, so all four are swept.
 */
const { chromium } = require('/Users/ashmit/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), BASE = 'https://app.veerha.com';
const AUTH = path.join(ROOT, '.auth.json');
const PAT = /https?:\/\/[a-z0-9.-]*veerha[a-z0-9.-]*\/(q|p|s|f|pref|book|r)\/[A-Za-z0-9_\-]{6,}[^\s"'<>]*/ig;

const SEEDS = [
  '/booking-links', '/forms', '/quotes', '/customers', '/capture',
  '/settings/developers', '/landing-pages', '/opportunities',
];

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('input[type="email"], input[name*="mail" i]').first().fill(process.env.VEERHA_USER);
  await page.locator('input[type="password"]').first().fill(process.env.VEERHA_PASS);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();
  await page.waitForTimeout(4000);
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  await login(page);
  console.log('  login ->', page.url());
  await ctx.storageState({ path: AUTH });

  const found = new Map();
  const sweep = async (where) => {
    const hits = await page.evaluate(() => {
      const out = [];
      out.push(document.body.innerText);
      document.querySelectorAll('input,textarea').forEach(i => out.push(i.value || ''));
      document.querySelectorAll('[href],[data-copy],[data-clipboard-text]').forEach(e => {
        out.push(e.getAttribute('href') || '', e.getAttribute('data-copy') || '',
                 e.getAttribute('data-clipboard-text') || '');
      });
      return out.join('\n');
    }).catch(() => '');
    let m, n = 0;
    while ((m = PAT.exec(hits))) { if (!found.has(m[0])) { found.set(m[0], where); n++; } }
    return n;
  };

  for (const route of SEEDS) {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1600);
    let n = await sweep(route);
    // open the first few records — a share link usually lives on the record, not the list
    const rows = await page.$$('tbody tr, .cursor-pointer, [role="row"]');
    for (let i = 0; i < Math.min(rows.length, 4); i++) {
      try {
        await rows[i].click({ timeout: 2500 });
        await page.waitForTimeout(1800);
        n += await sweep(route + ' [record ' + i + ']');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } catch {}
    }
    console.log(`  ${route.padEnd(24)} +${n}`);
  }

  const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/guest-links.json'), 'utf8'));
  for (const [url] of found) {
    const k = url.match(/veerha[a-z.]*\/([a-z]+)\//i)[1].toLowerCase();
    prev[k] = Array.from(new Set([...(prev[k] || []), url]));
  }
  fs.writeFileSync(path.join(ROOT, 'audit/guest-links.json'), JSON.stringify(prev, null, 1));
  console.log('\n  link inventory now:');
  for (const k of ['q','p','s','f','pref','book','r'])
    console.log('    /%s/ %d'.replace('%s', k).replace('%d', (prev[k] || []).length));
  await b.close();
})();
