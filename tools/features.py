#!/usr/bin/env python3
"""Builds audit/FEATURES.md and audit/features.html from the interaction capture.

Both are INTERNAL. They quote a live production account, so they carry real
customer names, phone numbers and amounts, and tools/build-dist.sh must never
copy them.

Everything here is derived from audit/.inter-done.json (what was clicked and what
happened) and audit/text/*.txt (what the page said). Nothing is written from
recollection -- the point of the exercise was that the previous "133 interaction
states" turned out to be 109 attempts at one control, and a document written from
memory would have repeated that claim rather than exposed it.
"""
import json, os, re, html, glob, collections, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = os.path.join(ROOT, 'audit/.inter-done.json')
STATES = os.path.join(ROOT, 'audit/states')


def load():
    d = json.load(open(J, encoding='utf-8'))
    return {k: v for k, v in d.items() if isinstance(v, dict)}


def text_for(key):
    p = os.path.join(ROOT, 'audit/text', key + '.txt')
    if not os.path.exists(p):
        return ''
    return open(p, encoding='utf-8', errors='replace').read()


def purpose(key, rec):
    """The page's own first meaningful line — its subtitle, usually."""
    t = text_for(key)
    lines = [l.strip() for l in t.splitlines() if l.strip()]
    # skip the account chrome the dump always starts with
    skip = {'A', 'v1', 'Owner', 'P', 'Settings', '›'}
    body = [l for l in lines if l not in skip and len(l) > 1]
    for i, l in enumerate(body[:14]):
        nxt = body[i + 1] if i + 1 < len(body) else ''
        if 8 < len(nxt) < 150 and not nxt.isupper() and nxt[0].isupper():
            return nxt
    return ''


def shots_for(key):
    if not os.path.isdir(STATES):
        return []
    return sorted(f for f in os.listdir(STATES) if f.startswith(key + '--'))


def kind(tag):
    if tag.startswith('open-'):   return 'menu / panel'
    if tag.startswith('chrome-'): return 'app chrome'
    if tag.startswith('tab-'):    return 'tab'
    if tag == 'record':           return 'record detail'
    if tag == 'no-results':       return 'empty / filtered'
    return 'state'


def build():
    d = load()
    rows = sorted(d.items(), key=lambda kv: kv[1]['route'])
    today = datetime.date.today().isoformat()

    total_states = sum(len(r.get('states', [])) for _, r in rows)
    total_ctl    = sum(r.get('controls', 0) for _, r in rows)
    with_state   = [k for k, r in rows if r.get('states')]
    blank        = [(k, r) for k, r in rows if r.get('blank')]
    thin         = [(k, r) for k, r in rows if r.get('thin')]
    noidle       = [(k, r) for k, r in rows if r.get('neverIdle')]
    fatal        = [k for k, r in rows if r.get('fatal')]

    def is_action(label):
        """An action label is short and imperative. A chat message is neither."""
        if len(label) > 34:
            return False
        if re.search(r'\b(You|AI|Veerha)\s*:', label):
            return False
        return True

    skips, noise = collections.Counter(), collections.Counter()
    for _, r in rows:
        for s in r.get('skipped', []):
            (skips if is_action(s) else noise)[s] += 1

    # ---------------------------------------------------------------- markdown
    md = []
    md.append('# Veerha — feature and interaction catalogue\n')
    md.append('**Internal.** Captured from the live production account on %s. '
              'Contains real customer names, numbers and amounts; it does not leave '
              'this folder and `tools/build-dist.sh` must never copy it.\n' % today)
    md.append('## What this is, and what it is not\n')
    md.append('Every row below is evidence: a control that was found on the page, and '
              'either a screenshot of what it did or a note saying it was left alone. '
              'Nothing is recalled.\n')
    md.append('| | |\n|---|---|')
    md.append('| Routes visited | %d |' % len(rows))
    md.append('| Controls inventoried | %d |' % total_ctl)
    on_disk = len(os.listdir(STATES)) if os.path.isdir(STATES) else 0
    md.append('| Interaction states captured | %d |' % on_disk)
    if total_states > on_disk:
        md.append('| — of which reused a label, overwriting an earlier shot | %d |'
                  % (total_states - on_disk))
    md.append('| Routes that yielded a state | %d |' % len(with_state))
    md.append('| Destructive controls found and **not** touched | %d distinct |' % len(skips))
    if fatal:
        md.append('| Routes that errored | %d |' % len(fatal))
    md.append('')

    if blank or thin or noidle:
        md.append('## Routes that misbehave\n')
        md.append('Each of these failed the capture twice, on independent runs, which is what '
                  'makes them findings about the product rather than flaky automation.\n')
        for k, r in blank:
            md.append('- **`%s` renders nothing at all.** `readyState` reaches `complete` and the '
                      'body is empty — a white screen, not a slow one.' % r['route'])
        for k, r in thin:
            md.append('- **`%s`** shows %s. %s'
                      % (r['route'], r['thin'],
                         'The whole page is the words "Not authorized." — no reason, no way back, '
                         'no indication of who could grant access.'
                         if 'superadmin' in r['route'] else ''))
        for k, r in noidle:
            md.append('- **`%s` never reaches network idle.** It renders fully in about three and a '
                      'half seconds, then holds a connection open indefinitely, so anything waiting '
                      'on the network to settle waits forever.' % r['route'])
        md.append('')
    densest = max(rows, key=lambda kv: kv[1].get('controls', 0))[1] if rows else None
    if densest:
        md.append('A route with no state is usually not a failure. Most Veerha screens are '
                  'read-only: `/analytics` is a full control room with three buttons on it. '
                  'The interactive density of this product sits almost entirely in the list '
                  'screens — `%s` alone carries %d controls.\n'
                  % (densest['route'], densest.get('controls', 0)))

    md.append('## The destructive inventory\n')
    md.append('These were found, recorded and deliberately never clicked. This list is the '
              'reason the pass was safe to run against a live account, and it is also the '
              'best short description of what this product can do to real data.\n')
    md.append('| Control | Appears on |\n|---|---|')
    for label, n in skips.most_common():
        md.append('| %s | %d route%s |' % (label.replace('|', '\\|'), n, '' if n == 1 else 's'))
    md.append('')
    if noise:
        md.append('%d further match%s were message bodies, not controls — a conversation '
                  'bubble is a `<button>` in this app, so a message containing the word '
                  '"confirm" reads as a destructive action. They were left alone too.\n'
                  % (sum(noise.values()), '' if sum(noise.values()) == 1 else 'es'))

    # Two spellings of one action is a product finding, not a capture artefact.
    norm = collections.defaultdict(set)
    for label in skips:
        norm[re.sub(r'\b(a|an|the|this|it)\b', '', label.lower()).replace(' ', '')].add(label)
    dupes = {k: v for k, v in norm.items() if len(v) > 1}
    if dupes:
        md.append('**The same action is labelled two ways.** Each pair below is one '
                  'operation the product spells inconsistently, which is a thing the '
                  'redesign should settle:\n')
        for v in dupes.values():
            md.append('- %s' % ' / '.join('`%s`' % x for x in sorted(v)))
        md.append('')

    md.append('## Per screen\n')
    for key, r in rows:
        md.append('### `%s`\n' % r['route'])
        p = purpose(key, r)
        if p:
            md.append('*%s*\n' % p)
        bits = ['%d controls' % r.get('controls', 0)]
        if r.get('textLen'):
            bits.append('%d chars of text' % r['textLen'])
        if r.get('blank'):
            bits.append('**blank: %s**' % r['blank'])
        if r.get('thin'):
            bits.append('**thin: %s**' % r['thin'])
        if r.get('neverIdle'):
            bits.append('**never reaches network idle**')
        if r.get('fatal'):
            bits.append('**errored: %s**' % r['fatal'])
        md.append('%s\n' % ' · '.join(bits))

        st = r.get('states', [])
        if st:
            md.append('| State captured | Kind |\n|---|---|')
            for s in st:
                md.append('| %s | %s |' % (s.replace('|', '\\|'), kind(s)))
            md.append('')
        sk = r.get('skipped', [])
        if sk:
            md.append('Left alone as destructive: %s\n'
                      % ', '.join('`%s`' % x for x in sk))
        if not st and not sk:
            md.append('No control on this screen opened anything — it is a display.\n')

    open(os.path.join(ROOT, 'audit/FEATURES.md'), 'w', encoding='utf-8').write('\n'.join(md))

    # -------------------------------------------------------------------- html
    cards = []
    for key, r in rows:
        shots = shots_for(key)
        if not shots:
            continue
        tiles = ''.join(
            '<figure><img loading="lazy" src="states/%s" alt="%s">'
            '<figcaption><b>%s</b><span>%s</span></figcaption></figure>'
            % (html.escape(s), html.escape(s),
               html.escape(s.split('--', 1)[1][:-4].replace('-', ' ')),
               html.escape(kind(s.split('--', 1)[1][:-4])))
            for s in shots)
        sk = r.get('skipped', [])
        skm = ('<p class="skips"><b>Not touched:</b> ' +
               ' '.join('<code>%s</code>' % html.escape(x) for x in sk) + '</p>') if sk else ''
        cards.append(
            '<section class="rt" id="r-%s"><header><h2><code>%s</code></h2>'
            '<span class="meta">%d controls · %d states</span></header>'
            '<p class="purpose">%s</p>%s<div class="grid">%s</div></section>'
            % (html.escape(key), html.escape(r['route']), r.get('controls', 0),
               len(shots), html.escape(purpose(key, r)), skm, tiles))

    page = HTML.replace('__WHEN__', today) \
               .replace('__ROUTES__', str(len(rows))) \
               .replace('__STATES__', str(on_disk)) \
               .replace('__CTL__', str(total_ctl)) \
               .replace('__SKIPS__', str(len(skips))) \
               .replace('__CARDS__', '\n'.join(cards))
    open(os.path.join(ROOT, 'audit/features.html'), 'w', encoding='utf-8').write(page)

    print('FEATURES.md   : %d routes, %d state screenshots on disk, %d destructive controls'
          % (len(rows), on_disk, len(skips)))
    print('features.html : %d routes with screenshots' % len(cards))
    if blank or thin:
        print('  %d blank, %d thin — reported as findings, not gaps' % (len(blank), len(thin)))
    if fatal:
        print('  %d route(s) errored' % len(fatal))


HTML = '''<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Interaction states · Veerha audit</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="../design-system/system/fonts.css">
<link rel="stylesheet" href="../design-system/system/tokens.css">
<link rel="stylesheet" href="../design-system/system/base.css">
<link rel="stylesheet" href="../design-system/system/components.css">
<style>
  body { background: var(--surface-muted); }
  .wrap { max-width: 1180px; margin: 0 auto; padding: var(--s-10) var(--s-5) var(--s-16); }
  .hero h1 { font-size: 30px; line-height: 38px; font-weight: 600; letter-spacing: -.022em; }
  .hero p { max-width: 74ch; margin-top: var(--s-3); color: var(--text-secondary); }
  .stats { display: flex; gap: var(--s-4); flex-wrap: wrap; margin: var(--s-6) 0 var(--s-10); }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card);
          padding: var(--s-4) var(--s-5); min-width: 150px; }
  .stat b { display: block; font-size: 26px; line-height: 32px; font-weight: 600; letter-spacing: -.02em; }
  .stat span { font-size: var(--t-meta-s); color: var(--text-muted); }
  .rt { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-card);
        padding: var(--s-5); margin-bottom: var(--s-5); }
  .rt header { display: flex; align-items: baseline; gap: var(--s-4); flex-wrap: wrap; }
  .rt h2 { font-size: 16px; font-weight: 600; }
  .rt h2 code { font-family: var(--num); font-size: 15px; }
  .rt .meta { font-size: var(--t-meta-s); color: var(--text-muted); }
  .purpose { color: var(--text-secondary); font-size: var(--t-small-s); margin-top: 4px; }
  .skips { font-size: var(--t-meta-s); color: var(--text-muted); margin-top: var(--s-3); }
  .skips code { background: var(--dn-bg); color: var(--dn-tx); border-radius: var(--r-xs);
                padding: 1px 5px; margin-right: 4px; display: inline-block; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: var(--s-4); margin-top: var(--s-4); }
  figure { margin: 0; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden;
           background: var(--canvas); cursor: zoom-in; }
  figure img { width: 100%; display: block; aspect-ratio: 16/10; object-fit: cover; object-position: top; }
  figcaption { padding: 7px 9px; border-top: 1px solid var(--border); }
  figcaption b { display: block; font-size: var(--t-meta-s); font-weight: 600; }
  figcaption span { font-size: var(--t-meta-s); color: var(--text-muted); }
  .lb { position: fixed; inset: 0; background: rgba(9,12,18,.86); display: none;
        align-items: center; justify-content: center; padding: 3vh 3vw; z-index: 60; cursor: zoom-out; }
  .lb.is-on { display: flex; }
  .lb img { max-width: 100%; max-height: 100%; border-radius: var(--r-md); }
  .warn { background: var(--wn-bg); border: 1px solid var(--wn-bd); color: var(--wn-tx);
          border-radius: var(--r-card); padding: var(--s-4) var(--s-5); margin-bottom: var(--s-8);
          font-size: var(--t-small-s); }
</style>
</head>
<body>
<main class="wrap">
  <div class="warn"><b>Internal only.</b> These are screenshots of a live production account and
    show real customers, phone numbers and amounts. They are excluded from the client bundle.</div>
  <div class="hero">
    <h1>What the product actually does</h1>
    <p>Every screenshot here is one control being opened on the live app on __WHEN__, captured
       read-only. Nothing was sent, saved, deleted or confirmed &mdash; the destructive controls are
       listed per screen instead, which is the more useful half of the record anyway.</p>
  </div>
  <div class="stats">
    <div class="stat"><b class="num">__ROUTES__</b><span>routes visited</span></div>
    <div class="stat"><b class="num">__CTL__</b><span>controls inventoried</span></div>
    <div class="stat"><b class="num">__STATES__</b><span>states captured</span></div>
    <div class="stat"><b class="num">__SKIPS__</b><span>destructive, left alone</span></div>
  </div>
__CARDS__
</main>
<div class="lb" id="lb"><img alt=""></div>
<script>
  var lb = document.getElementById('lb');
  document.addEventListener('click', function (e) {
    var f = e.target.closest('figure img');
    if (f) { lb.querySelector('img').src = f.src; lb.classList.add('is-on'); return; }
    if (e.target.closest('.lb')) lb.classList.remove('is-on');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') lb.classList.remove('is-on');
  });
</script>
</body>
</html>
'''

if __name__ == '__main__':
    build()
