# -*- coding: utf-8 -*-
"""Generate audit/gallery.html — one card per screen, live app beside its redesign.

Reads the frames parsed out of screens/*.html, the MANIFEST mapping that says
which live capture each screen came from, and the hand-written key fixes.
Regenerate after any batch: the gallery is a view of the build, never a second
copy to maintain by hand.
"""
import re, os, glob, html, json, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gallery_tags import TAGS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

MODULES = {
 '01-home.html':'Home & intelligence', '02-leads.html':'Leads', '03-opportunities.html':'Opportunities',
 '05-bookings.html':'Bookings', '06-conversations.html':'Conversations', '07-queues.html':'Work queues',
 '08-calendar.html':'Calendar', '10-campaigns.html':'Campaigns', '11-ai.html':'AI workforce',
 '12-catalog.html':'Catalogue', '13-org.html':'Organisation', '14-settings.html':'Settings',
 '16-auth.html':'Authentication',
 '17-public.html':'Guest pages',
 '18-commerce.html':'Commerce',
 '04-quotes.html':'Quotations', '09-customers.html':'Customers',
 '15-billing.html':'Billing & wallet',
}

def frames():
    out = []
    for f in sorted(glob.glob('screens/*.html')):
        b = os.path.basename(f)
        if b not in MODULES: continue
        s = open(f, encoding='utf-8').read()
        for blk in re.split(r'(?=<section class="vs-frame[^"]*" id=")', s)[1:]:
            hd = blk[:1400]
            g = lambda rx, d='': (re.search(rx, hd).group(1).strip() if re.search(rx, hd) else d)
            out.append({'id': re.search(r'id="([^"]+)"', blk).group(1), 'file': b,
                        'n': g(r'vs-frame__n">([^<]*)<'),
                        'name': html.unescape(g(r'vs-frame__name">([^<]*)<')),
                        'route': g(r'vs-frame__route">([^<]*)<')})
    return out

def manifest():
    m = {}
    for line in open('screens/MANIFEST.md', encoding='utf-8'):
        r = re.match(r'\|\s*(\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|', line)
        if r: m[r.group(1).strip()] = re.findall(r'`([^`]+\.png)`', r.group(6))
    return m

avail = set(os.listdir('audit/screens'))

# Captures whose page renders a token are withheld from the bundle (see the
# secret scan in tools/build-dist.sh). Mark them so the card says why.
SECRET_RX = re.compile(r'hooks/[0-9a-f]{24,}|[?&][A-Za-z_]+=[0-9a-f]{32}|\b[0-9a-f]{32}\b'
                       r'|sk_[a-zA-Z0-9]{16,}|Bearer [A-Za-z0-9._-]{20,}')
WITHHELD = set()
for _t in glob.glob('audit/text/*.txt'):
    try:
        if SECRET_RX.search(open(_t, encoding='utf-8').read()):
            WITHHELD.add(os.path.basename(_t)[:-4] + '.png')
    except OSError:
        pass
def resolve(refs):
    out = []
    for r in refs:
        if '*' in r:
            rx = re.compile('^' + re.escape(r).replace(r'\*', '.*') + '$')
            out += sorted(p for p in avail if rx.match(p))
        elif r in avail: out.append(r)
    return out

FR, MAN = frames(), manifest()

NO_BEFORE = {'17-public.html'}

# Why a given guest frame has no "before", stated per frame rather than assumed.
WITHHELD_REASON = {
    'stay-hub':        'captured from the live app, but the capture is a real guest’s booking',
    'online-check-in': 'captured from the live app, but the capture is a real guest’s booking',
    'public-enquiry-form': 'captured from the live app, but the capture carries a real enquirer’s details',
    'terminal-states-thank-you-expired-actioned':
                       'the expired state was captured live; the other two show the marketing site today',
}
for _f in FR:
    if _f['file'] in NO_BEFORE:
        MAN[_f['n']] = []


# Cards are paired to their "before" capture BY FRAME NUMBER, so a number used
# twice silently puts the wrong live screenshot on a client-facing card. That
# shipped once (Org reused Calendar's 57 and Analytics' 60); it now hard-fails.
dupes = collections.Counter(f['n'] for f in FR)
clash = {n: [f['name'] for f in FR if f['n'] == n] for n, c in dupes.items() if c > 1}
if clash:
    raise SystemExit('duplicate frame numbers — cards would pair with the wrong capture:\n' +
                     '\n'.join('  #%s  %s' % (n, ' | '.join(v)) for n, v in sorted(clash.items())))

# A number with no manifest row means the frame invented its own numbering.
orphans = [(f['n'], f['name']) for f in FR if f['n'].rstrip('abcd') not in MAN]
if orphans:
    print('  WARNING: frame numbers with no MANIFEST row:',
          ', '.join('#%s %s' % o for o in orphans))

for f in FR: f['before'] = resolve(MAN.get(f['n'], []))

groups = collections.OrderedDict()
for f in FR: groups.setdefault(f['file'], []).append(f)

n_new = sum(1 for f in FR if not f['before'])
cards, toc = [], []
for fl, items in groups.items():
    mod = MODULES[fl]
    slug = re.sub(r'[^a-z0-9]+', '-', mod.lower()).strip('-')
    toc.append('<a href="#%s">%s <span class="num">%d</span></a>' % (slug, html.escape(mod), len(items)))
    cards.append('<h2 class="mod" id="%s">%s<span class="t-meta muted">%d screens · %s</span></h2>'
                 % (slug, html.escape(mod), len(items), html.escape(fl)))
    for f in items:
        tags = ''.join('<span class="tag">%s</span>' % html.escape(t) for t in TAGS.get(f['id'], []))
        after = 'after/%s_d.png' % f['id']
        href = '../screens/%s#%s' % (f['file'], f['id'])
        if f['before'] and f['before'][0] in WITHHELD:
            left = ('<div class="missing"><b>Capture withheld.</b><br>This screen of the live app '
                    'displays a workspace credential, so its screenshot is not published.</div>')
            sub  = 'Withheld &rarr; <code>%s#%s</code>' % (html.escape(f['file']), f['id'])
            badge = '<span class="v-badge v-badge--danger shot__label">Withheld</span>'
        elif f['before']:
            b = f['before'][0]
            left = ('<img loading="lazy" src="screens/%s" alt="%s on the live app">' % (b, html.escape(f['name'])))
            sub  = '<code>%s</code> &rarr; <code>%s#%s</code>' % (html.escape(b), html.escape(f['file']), f['id'])
            badge = '<span class="v-badge v-badge--neutral shot__label">Before · live app</span>'
        else:
            why = WITHHELD_REASON.get(f['id'])
            if why:
                left = ('<div class="missing">This page exists, and we opened it \u2014 %s,'
                        '<br>so it stays in the internal audit.</div>' % html.escape(why))
                sub  = 'Withheld capture &rarr; <code>%s#%s</code>' % (html.escape(f['file']), f['id'])
                badge = '<span class="v-badge v-badge--neutral shot__label">Capture withheld</span>'
            else:
                left = '<div class="missing">This screen does not exist in the live app.<br>Nothing was captured to compare against.</div>'
                sub  = 'New screen &rarr; <code>%s#%s</code>' % (html.escape(f['file']), f['id'])
                badge = '<span class="v-badge v-badge--warn shot__label">New screen</span>'
        cards.append("""
<article class="pair" id="p-%s">
  <div class="pair__head">
    <div><h3>%s <span class="num pair__n">%s</span></h3>
      <div class="t-meta muted">%s</div></div>
    <a class="v-btn v-btn--secondary v-btn--sm" href="%s">Open prototype &nearr;</a>
  </div>
  <div class="pair__body">
    <div class="shot">%s<div class="shot__frame">%s</div></div>
    <div class="shot"><span class="v-badge v-badge--brand shot__label">After · redesign</span>
      <div class="shot__frame"><img loading="lazy" src="%s" alt="%s redesigned"
        onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'missing',textContent:'Screenshot not generated'}))"></div></div>
  </div>
  <div class="fixes">%s</div>
</article>""" % (f['id'], html.escape(f['name']), html.escape(f['n']), sub, href, badge, left, after,
                 html.escape(f['name']), tags))

DOC = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Veerha — before &amp; after</title>
<meta name="description" content="Every screen of the live Veerha app beside its redesign, with the key fixes named.">
<link rel="stylesheet" href="../design-system/system/fonts.css">
<link rel="stylesheet" href="../design-system/system/tokens.css">
<link rel="stylesheet" href="../design-system/system/base.css">
<link rel="stylesheet" href="../design-system/system/components.css">
<style>
  body { background: var(--canvas); color: var(--text-primary); }
  .wrap { width: min(1240px, calc(100% - 32px)); margin: 0 auto; padding: var(--s-8) 0 var(--s-12); }
  .top { display: flex; align-items: flex-start; gap: var(--s-4); flex-wrap: wrap; }
  .top h1 { font-size: clamp(26px, 3.4vw, 36px); line-height: 1.1; font-weight: 600; letter-spacing: -.024em; }
  .top p { color: var(--text-secondary); font-size: 14px; line-height: 21px; max-width: 68ch; margin-top: var(--s-3); }
  .toc { position: sticky; top: 0; z-index: 20; background: var(--canvas);
         border-bottom: 1px solid var(--border); margin-top: var(--s-6); }
  .toc__in { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0; scrollbar-width: none; }
  .toc__in::-webkit-scrollbar { display: none; }
  .toc a { flex: none; padding: 5px 11px; border-radius: var(--r-full); font-size: 12.5px;
           color: var(--text-muted); text-decoration: none; border: 1px solid transparent; }
  .toc a:hover { background: var(--surface); border-color: var(--border); color: var(--text-primary); }
  .toc .num { color: var(--text-faint); margin-left: 4px; }
  .mod { display: flex; align-items: baseline; gap: var(--s-3); flex-wrap: wrap;
         font-size: 19px; font-weight: 600; letter-spacing: -.014em; margin: var(--s-10) 0 var(--s-4); }
  .pair { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card);
          overflow: hidden; margin-bottom: var(--s-5); }
  .pair__head { display: flex; align-items: center; gap: var(--s-4); justify-content: space-between;
                padding: var(--s-4) var(--s-5); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .pair__head h3 { font-size: 15px; font-weight: 600; }
  .pair__n { font-size: 11px; color: var(--text-muted); border: 1px solid var(--border);
             border-radius: var(--r-chip); padding: 1px 6px; margin-left: 6px; }
  .pair__head code { font-family: var(--num); font-size: 11.5px; color: var(--text-muted); }
  .pair__body { display: grid; grid-template-columns: 1fr 1fr; }
  .shot { position: relative; border-right: 1px solid var(--border); background: var(--surface-subtle); }
  .shot:last-child { border-right: 0; }
  .shot__label { position: absolute; top: 10px; left: 10px; z-index: 2; }
  /* The shot window is short so many cards fit on screen; hovering scrolls the
     full-length capture through it, and a click opens it at full size. */
  .shot__frame { height: 340px; overflow: hidden; position: relative; cursor: zoom-in; }
  .shot__frame img { width: 100%; height: auto; display: block; transition: transform 5s ease; }
  .shot__frame:hover img { transform: translateY(calc(-100% + 340px)); }
  .missing { position: absolute; inset: 0; display: grid; place-items: center; text-align: center;
             padding: var(--s-6); color: var(--text-muted); font-size: 12.5px; line-height: 19px; }
  .fixes { display: flex; flex-wrap: wrap; gap: 6px; padding: var(--s-4) var(--s-5); }
  .tag { font-size: 11.5px; line-height: 17px; padding: 3px 9px; border-radius: var(--r-full);
         background: var(--ok-bg); color: var(--ok-tx); border: 1px solid var(--ok-bd); }
  .lb { position: fixed; inset: 0; background: rgba(15,23,42,.88); z-index: 200;
        display: none; overflow: auto; padding: 24px; }
  .lb.on { display: block; }
  .lb img { max-width: min(1440px, 100%); margin: 0 auto; display: block;
            border-radius: var(--r-tile); box-shadow: var(--e3); }
  .lb__x { position: fixed; top: 16px; right: 16px; }
  @media (max-width: 860px) {
    .pair__body { grid-template-columns: 1fr; }
    .shot { border-right: 0; border-bottom: 1px solid var(--border); }
    .shot__frame { height: 260px; }
    .shot__frame:hover img { transform: translateY(calc(-100% + 260px)); }
  }
</style>
</head>
<body>
<main class="wrap">
  <div class="top">
    <div style="flex:1;min-width:280px">
      <span class="v-badge v-badge--brand">Indigo Slate &middot; v1.0</span>
      <h1 style="margin-top:var(--s-3)">Before &amp; after</h1>
      <p>Every screen of the live Veerha app beside the screen that replaces it, with the key fixes
         named on each card. <b>Hover a shot to scroll it; click to open it full size.</b>
         __NEW__ screens had nothing to compare against &mdash; the live app has never rendered them.</p>
    </div>
    <div class="v-actions">
      <a class="v-btn v-btn--secondary v-btn--sm" href="../hub.html">&larr; Index</a>
      <a class="v-btn v-btn--secondary v-btn--sm" href="../screens/index.html">All screens</a>
      <a class="v-btn v-btn--primary v-btn--sm" href="../veerha-dashboard.html">Dashboard</a>
    </div>
  </div>
  <nav class="toc"><div class="toc__in">__TOC__</div></nav>
  __CARDS__
  <footer class="t-meta muted" style="margin-top:var(--s-10);padding-top:var(--s-5);border-top:1px solid var(--border)">
    __COUNT__ screens &middot; live app captured 21 September 2026 &middot; Kora Kaagaz
  </footer>
</main>
<div class="lb" id="lb"><button class="v-btn v-btn--secondary v-btn--sm lb__x" id="lbx">Close &times;</button><img id="lbi" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></div>
<script>
(function () {
  var lb = document.getElementById('lb'), img = document.getElementById('lbi');
  document.addEventListener('click', function (e) {
    if (e.target.closest('#lbx') || e.target === lb) { lb.classList.remove('on'); img.src = ''; return; }
    var f = e.target.closest('.shot__frame img');
    if (!f) return;
    img.src = f.src; img.alt = f.alt; lb.classList.add('on');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.classList.contains('on')) { lb.classList.remove('on'); img.src = ''; }
  });
})();
</script>
</body>
</html>"""

doc = (DOC.replace('__TOC__', '\n    '.join(toc))
          .replace('__CARDS__', '\n'.join(cards))
          .replace('__COUNT__', str(len(FR)))
          .replace('__NEW__', str(n_new)))
open('audit/gallery.html', 'w', encoding='utf-8').write(doc)
print('gallery.html: %d cards, %d modules, %d new screens' % (len(FR), len(groups), n_new))
missing = [f['id'] for f in FR if not os.path.exists('audit/after/%s_d.png' % f['id'])]
print('after-shots missing:', missing or 'none')
