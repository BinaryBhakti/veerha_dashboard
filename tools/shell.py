#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Emit ONE canonical app shell and rewrite it into every frame.

What the shell is -- sidebar rows, top tabs, section rails and where each frame
sits in them -- is data in tools/ia.py. This file only renders it.

The shell was hand-written into each frame and drifted: 80 rails in 26 markup
variants carrying 3 to 10 items, 7 with no active item at all, and 80 top bars
in 68 variants with the command palette on only 9 of them. A client clicking
through watched the navigation change between screens.

This is the single source. Run it after any batch; run it with --check to
assert that nothing has drifted back.

  python3 tools/shell.py           rewrite every sidebar, top bar, tab strip and section rail
  python3 tools/shell.py --check   fail on drift, or on a shell frame ia.py does not place
"""
import re, sys, glob, os, hashlib, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ia import NAV, BADGES, PERSONAS, TABS, RAILS, FRAME_IA

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


def ico(n, s=18):
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#%s"/></svg>'
            % (s, s, n))

def esc(t):
    return t.replace('&', '&amp;')

def shows(editions, hidden_for, persona):
    p = PERSONAS[persona]
    return (editions is None or p['edition'] in editions) and p['role'] not in hidden_for

# Where a nav item leads, for the walkthrough: the first frame placed there.
GO_ROW, GO_RAIL, GO_TAB = {}, {}, {}
for fid, ia in FRAME_IA.items():
    GO_ROW.setdefault(ia['row'], fid)
    if ia['rail']: GO_RAIL.setdefault(ia['rail'], fid)
    if ia['tabs']: GO_TAB.setdefault(ia['tabs'], fid)
GO_ROW.update({'Dashboard': 'dashboard', 'Conversations': 'inbox', 'Customers': 'customers',
               'Marketing': 'campaign-builder', 'Settings': 'brand'})

def go_attr(fid):
    return ' data-go="%s"' % fid if fid else ''

def rail(active, persona='owner', wt=False):
    """The sidebar. wt=True emits the walkthrough's copy, which navigates."""
    p = PERSONAS[persona]
    ind = '    ' if wt else '          '
    out = ['<nav class="v-rail is-expanded"%s aria-label="Sections">' % (' id="wtRail"' if wt else ''),
           ind + '<div class="v-rail__mark">%s</div>' % p['org'][0]]
    for group, items in NAV:
        rows = [i for i in items if shows(i[3], i[4], persona)]
        if not rows: continue
        out.append(ind + '<div class="v-rail__group">%s</div>' % group)
        for label, icon, badge, _, _ in rows:
            cls = 'v-rail__item is-active' if (label == active and not wt) else 'v-rail__item'
            n = BADGES.get(badge)
            cnt = '<span class="v-rail__count">%s</span>' % n if n else ''
            dot = '<span class="v-navdot"></span>' if n else ''
            hook = ''
            if wt:
                g = GO_ROW.get(label)
                hook = ' data-rail="%s" data-go="%s"' % (g, g) if g else ''
            out.append(ind + '<button class="%s"%s aria-label="%s">%s<span class="v-rail__label">%s</span>%s%s</button>'
                       % (cls, hook, esc(label), ico(icon), esc(label), cnt, dot))
    out.append(ind + '<div class="v-rail__acct"><span class="v-avatar v-avatar--sm">%s</span>'
               '<div class="v-rail__acct__who"><div class="v-rail__acct__name">%s</div>'
               '<div class="v-rail__acct__sub">%s · %s</div></div></div>'
               % (p['initial'], p['name'], p['role'], p['org']))
    out.append(('  ' if wt else '        ') + '</nav>')
    return '\n'.join(out)

def topbar(root, leaf, persona='owner'):
    p = PERSONAS[persona]
    return ('<header class="v-topbar">\n'
            '            <button class="vs-topbar__menu" aria-label="Collapse the sidebar">%s</button>\n'
            '            <nav class="v-crumb"><span>%s</span><span class="v-crumb__sep">›</span>'
            '<span class="v-crumb__current">%s</span></nav>\n'
            '            <div class="v-search vs-topbar__search"><span class="v-search__ic">%s</span>'
            '<input class="v-input" placeholder="Search or run a command">'
            '<span class="v-kbd num">⌘K</span></div>\n'
            '            <div class="vs-topbar__acts">\n'
            '              <button class="v-topbar__icon" aria-label="Notifications">%s'
            '<span class="v-topbar__icon__n">3</span></button>\n'
            '              <button class="v-topbar__icon" aria-label="Help">%s</button>\n'
            '              <div class="v-topbar__who"><div class="v-topbar__name">%s</div>'
            '<div class="v-topbar__role">%s</div></div>\n'
            '              <span class="v-avatar">%s</span></div>\n'
            '          </header>'
            % (ico('i-menu'), esc(root), esc(leaf), ico('i-search', 15), ico('i-bell'), ico('i-help'),
               p['name'], p['role'], p['initial']))

def page_tabs(key, active):
    btns = ''.join('<button class="v-tab%s" role="tab"%s>%s</button>'
                   % (' is-active' if t == active else '', go_attr(GO_TAB.get((key, t))), esc(t))
                   for t in TABS[key])
    return ('<div class="vs-tabstrip"><div class="v-tabs" role="tablist" aria-label="%s">%s</div></div>'
            % (key.capitalize(), btns))

def section_rail(key, active, persona='owner'):
    title, groups = RAILS[key]
    ed = PERSONAS[persona]['edition']
    out = ['<nav class="v-sidenav v-sidenav--dense" aria-label="%s sections">' % title,
           '              <div class="vs-sidenav__head">',
           '                <div class="label">%s</div>' % title,
           '                <div class="v-search vs-sidenav__search"><span class="v-search__ic">%s</span>'
           '<input class="v-input" placeholder="Search %s"></div>' % (ico('i-search', 14), title.lower()),
           '              </div>']
    for g, items in groups:
        rows = [(l, e) for l, e in items if e is None or ed in e]
        out.append('              <div class="v-sidenav__group"><div class="label v-sidenav__label">%s</div>' % esc(g))
        for label, _ in rows:
            out.append('                <a class="v-sidenav__item%s"%s>%s</a>'
                       % (' is-active' if label == active else '', go_attr(GO_RAIL.get((key, label))), esc(label)))
        out.append('              </div>')
    if key == 'settings':
        out.append('              <div class="v-sidenav__help"><div class="t-small" style="font-weight:600">Need help?</div>'
                   '<p>Docs, quick starts and templates — everything you need to get the AI live.</p>'
                   '<div class="v-sidenav__help__links"><a>Documentation</a><a>Support</a></div></div>')
    out.append('            </nav>')
    return '\n'.join(out)

def wt_rail():
    return rail(None, 'owner', wt=True)

def patch_walkthrough():
    p = 'screens/walkthrough.html'
    s = open(p, encoding='utf-8').read()
    r = re.search(r'<nav class="v-rail[^"]*"[^>]*>.*?</nav>', s, re.S)
    if not r: print('  walkthrough: no rail found'); return
    s = s[:r.start()] + wt_rail() + s[r.end():]
    # the top bar keeps its live crumb spans, so only the controls are replaced
    t = re.search(r'(<div class="vs-topbar__acts">).*?(</div>\s*</header>)', s, re.S)
    if t:
        acts = ('<div class="vs-topbar__acts">\n'
                '      <button class="v-topbar__icon" aria-label="Notifications">%s'
                '<span class="v-topbar__icon__n">3</span></button>\n'
                '      <button class="v-topbar__icon" aria-label="Help">%s</button>\n'
                '      <div class="v-topbar__who"><div class="v-topbar__name">Anita</div>'
                '<div class="v-topbar__role">Owner</div></div>\n'
                '      <span class="v-avatar">A</span></div>\n    </header>'
                % (ico('i-bell'), ico('i-help')))
        s = s[:t.start()] + acts + s[t.end():]
    for g in ('i-bell', 'i-help', 'i-users', 'i-bolt', 'i-wand'):
        if ('id="%s"' % g) not in s:
            src = open('screens/02-leads.html', encoding='utf-8').read()
            m = re.search(r'<g id="%s">.*?</g>' % g, src, re.S)
            if m: s = s.replace('</defs>', m.group(0) + '</defs>', 1)
    # The rail now ships expanded, so the grid container must start expanded
    # too -- .wt sizes the columns, .v-rail only draws itself. And the restore
    # has to invert: collapsed is now the stored exception, not the default.
    s = re.sub(r'<div class="wt"(?! is-expanded)', '<div class="wt is-expanded"', s, count=1)
    s = s.replace("if (localStorage.getItem('veerha-rail') === '1') {",
                  "if (localStorage.getItem('veerha-rail') === '0') {")
    s = s.replace("      document.querySelector('.wt').classList.add('is-expanded');\n"
                  "      document.querySelector('.v-rail').classList.add('is-expanded');",
                  "      document.querySelector('.wt').classList.remove('is-expanded');\n"
                  "      document.querySelector('.v-rail').classList.remove('is-expanded');")
    open(p, 'w', encoding='utf-8').write(s)
    print('  walkthrough shell rewritten (expanded by default)')

RAIL_RX = re.compile(r'<nav class="v-rail[^"]*"[^>]*>.*?</nav>', re.S)
TOP_RX  = re.compile(r'<header class="v-topbar"[^>]*>.*?</header>', re.S)
# Every tab strip is generated; a hand-written one (multi-line) is a leftover.
TABS_RX = re.compile(r'\s*<div class="vs-tabstrip">\s*<div class="v-tabs[^"]*"[^>]*>.*?</div>\s*</div>', re.S)
FRAME_RX = re.compile(r'(?=<section class="vs-frame)')
# A section rail is a sidenav labelled "<area> sections". Step and form navs
# inside a wizard are not, and are left alone.
SEC_OPEN = re.compile(r'<nav class="v-sidenav[^"]*" aria-label="(Settings|Marketing|Organisation|Product|AI workforce) sections">')
BODY_RX = re.compile(r'<div class="vs-body([^"]*)"([^>]*)>')

def nav_span(s, start):
    """[start, end) of the <nav> opening at start, counting nested navs."""
    depth, i = 0, start
    for m in re.finditer(r'<(/?)nav\b', s[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return start, start + m.start() + len('</nav>')
    raise ValueError('unbalanced nav')

def place_rail(blk, want):
    """Replace, insert or remove the frame's section rail. Returns (blk, note)."""
    m = SEC_OPEN.search(blk)
    if m:
        a, b = nav_span(blk, m.start())
        if want:
            return blk[:a] + want + blk[b:], None
        blk = blk[:a].rstrip() + blk[b:]                      # rail no longer belongs here
        if not re.search(r'<nav class="v-sidenav', blk):
            blk = blk.replace('vs-body vs-body--sectioned', 'vs-body', 1)
        return blk, None
    if not want:
        return blk, None
    bm = BODY_RX.search(blk)
    if not bm or '--panes' in bm.group(1):
        return blk, 'no body to hold a rail'
    cls = bm.group(1) if '--sectioned' in bm.group(1) else bm.group(1) + ' vs-body--sectioned'
    after = blk[bm.end():]
    note = None if after.lstrip().startswith('<div class="vs-canvas') else 'rail beside a body with no vs-canvas'
    return blk[:bm.start()] + '<div class="vs-body%s"%s>\n            %s' % (cls, bm.group(2), want) + after, note

def norm(x):
    """Normalise away what SHOULD differ per frame, so a hash measures structure."""
    x = re.sub(r'\s+', ' ', x)
    x = re.sub(r' is-active', '', x)
    x = re.sub(r'(<span>)[^<]*(</span><span class="v-crumb__sep">)', r'\1\2', x)
    x = re.sub(r'(<span class="v-crumb__current">)[^<]*', r'\1', x)
    return x

def h(x):
    return hashlib.md5(norm(x).encode()).hexdigest()[:8]

def run(check_only=False):
    variants = collections.defaultdict(collections.Counter)
    frames, unplaced, notes = 0, [], []
    for f in sorted(glob.glob('screens/[0-9][0-9]-*.html')):
        s = open(f, encoding='utf-8').read()
        parts = FRAME_RX.split(s)
        for i in range(1, len(parts)):
            blk = parts[i]
            if '<nav class="v-rail' not in blk: continue
            frames += 1
            fid = re.search(r'id="([^"]+)"', blk).group(1)
            ia = FRAME_IA.get(fid)
            if not ia:
                unplaced.append(fid); continue
            persona = ia['persona']
            if not check_only:
                blk = RAIL_RX.sub(lambda m: rail(ia['row'], persona), blk, count=1)
                blk = TOP_RX.sub(lambda m: topbar(ia['crumb'][0], ia['crumb'][1], persona), blk, count=1)
                # Only a tabbed row's strip is ours to rewrite; other frames may
                # carry an in-page strip of their own (Email studio's Templates | Build).
                if ia['tabs']:
                    blk = TABS_RX.sub('', blk)
                    blk = blk.replace('</header>', '</header>\n          ' + page_tabs(*ia['tabs']), 1)
                want = section_rail(ia['rail'][0], ia['rail'][1], persona) if ia['rail'] else None
                blk, note = place_rail(blk, want)
                if note: notes.append('%s: %s' % (fid, note))
                parts[i] = blk
            # one structure per persona, per tab strip, per rail
            r = RAIL_RX.search(blk); t = TOP_RX.search(blk)
            if r: variants['sidebar/' + persona][h(r.group(0))] += 1
            if t: variants['topbar/' + persona][h(t.group(0))] += 1
            tb = re.search(r'<div class="vs-tabstrip">.*?</div></div>', blk, re.S)
            if tb and ia['tabs']: variants['tabs/' + ia['tabs'][0]][h(tb.group(0))] += 1
            m = SEC_OPEN.search(blk)
            if m:
                a, b = nav_span(blk, m.start())
                variants['rail/' + m.group(1)][h(blk[a:b])] += 1
            if bool(ia['rail']) != bool(m):
                notes.append('%s: section rail %s' % (fid, 'missing' if ia['rail'] else 'unexpected'))
        if not check_only:
            open(f, 'w', encoding='utf-8').write(''.join(parts))

    print('  frames with a shell : %d' % frames)
    drift = False
    for k in sorted(variants):
        n = len(variants[k]); drift |= n > 1
        print('  %-28s %d variant%s %s' % (k, n, '' if n == 1 else 's', '' if n == 1 else '<- DRIFT'))
    for n in notes: print('  note  ' + n)
    if unplaced:
        print('  NOT PLACED in tools/ia.py: ' + ', '.join(unplaced))
    if check_only and (drift or unplaced or any('missing' in n or 'unexpected' in n for n in notes)):
        sys.exit(1)

run('--check' in sys.argv)
if '--check' not in sys.argv: patch_walkthrough()
