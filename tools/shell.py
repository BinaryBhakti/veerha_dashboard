#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Emit ONE canonical app shell and rewrite it into every frame.

The shell was hand-written into each frame and drifted: 80 rails in 26 markup
variants carrying 3 to 10 items, 7 with no active item at all, and 80 top bars
in 68 variants with the command palette on only 9 of them. A client clicking
through watched the navigation change between screens.

This is the single source. Run it after any batch; run it with --check to
assert that nothing has drifted back.

  python3 tools/shell.py           rewrite every rail and top bar
  python3 tools/shell.py --check   fail if more than one variant exists
"""
import re, sys, glob, os, hashlib, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ---- the navigation, once -------------------------------------------------
# (group, label, icon, count, attention)
NAV = [
    ('Workspace',    [('Dashboard',     'i-grid',   None, False),
                      ('Analytics',     'i-trend',  None, False)]),
    ('Customer',     [('Leads',         'i-target', '17', False),
                      ('Opportunities', 'i-trend',  None, False),
                      ('Quotations',    'i-file',   None, False),
                      ('Customers',     'i-users',  None, False),
                      ('Conversations', 'i-msg',    '11', True)]),
    ('Operations',   [('Bookings',      'i-bed',    None, False),
                      ('Front desk',    'i-bed',    None, False),
                      ('Calendar',      'i-cal',    None, False),
                      ('Tasks',         'i-check',  '10', False)]),
    ('AI staff',     [('AI workforce',  'i-cpu',    '4',  False),
                      ('Workflows',     'i-bolt',   None, False)]),
    ('Growth',       [('Marketing',     'i-wand',   None, False)]),
    ('Organisation', [('Organisation',  'i-users',  None, False)]),
    ('System',       [('Settings',      'i-gear',   None, False),
                      ('Billing',       'i-file',   None, False)]),
]
DESTS = [d for _, items in NAV for d, _, _, _ in items]

# ---- crumb -> destination -------------------------------------------------
LEAF = {
    'today': 'Dashboard', 'analytics': 'Analytics',
    'leads': 'Leads', 'contacts': 'Leads', 'import': 'Leads', 'capture': 'Leads',
    'opportunities': 'Opportunities', 'proposal': 'Opportunities', 'opportunity': 'Opportunities',
    'quotations': 'Quotations', 'quotes': 'Quotations',
    'customers': 'Customers', 'customer': 'Customers',
    'conversations': 'Conversations', 'mail': 'Conversations', 'templates': 'Conversations',
    'integrations': 'Conversations',
    'bookings': 'Bookings', 'booking': 'Bookings', 'front desk': 'Front desk',
    'calendar': 'Calendar', 'booking links': 'Calendar', 'your hours': 'Calendar',
    'tasks': 'Tasks', 'review': 'Tasks', 'callbacks': 'Tasks', 'touchpoints': 'Tasks',
    'ai employees': 'AI workforce', 'workflow': 'Workflows', 'workflows': 'Workflows',
    'departments': 'Organisation', 'org chart': 'Organisation', 'onboarding': 'Organisation',
    'team & access': 'Organisation',
    'plan & invoices': 'Billing', 'ai credits': 'Billing',
}
ROOTS = {'marketing': 'Marketing', 'products': 'Marketing', 'workforce': 'AI workforce',
         'organisation': 'Organisation', 'your work': 'Tasks', 'operations': 'Bookings',
         'settings': 'Settings', 'intelligence': 'Analytics', 'workspace': 'Dashboard'}
BY_FILE = {'01-home':'Dashboard','02-leads':'Leads','03-opportunities':'Opportunities',
           '04-quotes':'Quotations','05-bookings':'Bookings','06-conversations':'Conversations',
           '07-queues':'Tasks','08-calendar':'Calendar','09-customers':'Customers',
           '10-campaigns':'Marketing','11-ai':'AI workforce','12-catalog':'Marketing',
           '13-org':'Organisation','14-settings':'Settings','15-billing':'Billing'}

def ico(n, s=18):
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#%s"/></svg>'
            % (s, s, n))

def rail(active):
    out = ['<nav class="v-rail is-expanded" aria-label="Sections">',
           '          <div class="v-rail__mark">R</div>']
    for group, items in NAV:
        out.append('          <div class="v-rail__group">%s</div>' % group)
        for label, icon, count, attn in items:
            cls = 'v-rail__item is-active' if label == active else 'v-rail__item'
            badge = ('<span class="v-rail__count%s">%s</span>'
                     % (' v-rail__count--attn' if attn else '', count)) if count else ''
            dot = '<span class="v-navdot"></span>' if count else ''
            out.append('          <button class="%s" aria-label="%s">%s<span class="v-rail__label">%s</span>%s%s</button>'
                       % (cls, label, ico(icon), label, badge, dot))
    out.append('          <div class="v-rail__acct"><span class="v-avatar v-avatar--sm">A</span>'
               '<div class="v-rail__acct__who"><div class="v-rail__acct__name">Anita</div>'
               '<div class="v-rail__acct__sub">Owner · Rivergrove</div></div></div>')
    out.append('        </nav>')
    return '\n'.join(out)

def topbar(root, leaf):
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
            '              <div class="v-topbar__who"><div class="v-topbar__name">Anita</div>'
            '<div class="v-topbar__role">Owner</div></div>\n'
            '              <span class="v-avatar">A</span></div>\n'
            '          </header>'
            % (ico('i-menu'), root, leaf, ico('i-search', 15), ico('i-bell'), ico('i-help')))

# The walkthrough carries ONE shell for all 79 screens, outside .vs-body, so
# wtgen never sees it. Its rail drives navigation, so the same markup is emitted
# with the data-go / data-rail hooks wt.js listens for.
WT_GO = {
 'Dashboard':'dashboard', 'Analytics':'analytics', 'Leads':'leads',
 'Opportunities':'opportunities', 'Quotations':'quotes', 'Customers':'customers',
 'Conversations':'inbox', 'Bookings':'bookings', 'Front desk':'front-desk',
 'Calendar':'calendar', 'Tasks':'tasks', 'AI workforce':'employees',
 'Workflows':'workflows', 'Marketing':'campaign-builder', 'Organisation':'org-chart',
 'Settings':'brand', 'Billing':'billing',
}

def wt_rail():
    out = ['<nav class="v-rail is-expanded" id="wtRail" aria-label="Sections">',
           '    <div class="v-rail__mark">R</div>']
    for group, items in NAV:
        out.append('    <div class="v-rail__group">%s</div>' % group)
        for label, icon, count, attn in items:
            go = WT_GO.get(label)
            badge = ('<span class="v-rail__count%s">%s</span>'
                     % (' v-rail__count--attn' if attn else '', count)) if count else ''
            dot = '<span class="v-navdot"></span>' if count else ''
            out.append('    <button class="v-rail__item" data-rail="%s" data-go="%s" aria-label="%s">'
                       '%s<span class="v-rail__label">%s</span>%s%s</button>'
                       % (go, go, label, ico(icon), label, badge, dot))
    out.append('    <div class="v-rail__acct"><span class="v-avatar v-avatar--sm">A</span>'
               '<div class="v-rail__acct__who"><div class="v-rail__acct__name">Anita</div>'
               '<div class="v-rail__acct__sub">Owner \u00b7 Rivergrove</div></div></div>')
    out.append('  </nav>')
    return '\n'.join(out)

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
FRAME_RX = re.compile(r'(?=<section class="vs-frame)')

def destination(block, fname):
    c = re.search(r'<nav class="v-crumb">\s*<span>([^<]*)</span>.*?v-crumb__current">([^<]*)<', block, re.S)
    if c:
        root, leaf = c.group(1).strip(), c.group(2).strip().replace('&amp;', '&')
        d = LEAF.get(leaf.lower()) or ROOTS.get(root.lower())
        if d: return d, root, leaf
    d = BY_FILE.get(fname, 'Dashboard')
    return d, 'Workspace', d

def run(check_only=False):
    rails, tops, frames = collections.Counter(), collections.Counter(), 0
    for f in sorted(glob.glob('screens/[0-9][0-9]-*.html')):
        fname = os.path.basename(f)[:-5]
        s = open(f, encoding='utf-8').read()
        parts = FRAME_RX.split(s)
        for i in range(1, len(parts)):
            blk = parts[i]
            if '<nav class="v-rail' not in blk: continue
            frames += 1
            dest, root, leaf = destination(blk, fname)
            new_rail, new_top = rail(dest), topbar(root, leaf)
            if not check_only:
                blk = RAIL_RX.sub(lambda m: new_rail, blk, count=1)
                blk = TOP_RX.sub(lambda m: new_top, blk, count=1)
                parts[i] = blk
            # Which item is active and what the crumb says SHOULD differ per
            # screen. Normalise both away so the assertion measures structure:
            # every rail carrying the same destinations, every top bar the same
            # controls.
            def norm(x):
                x = re.sub(r'\s+', ' ', x)
                x = x.replace('v-rail__item is-active', 'v-rail__item')
                x = re.sub(r'(<span>)[^<]*(</span><span class="v-crumb__sep">)', r'\1\2', x)
                x = re.sub(r'(<span class="v-crumb__current">)[^<]*', r'\1', x)
                return x
            r = RAIL_RX.search(blk); t = TOP_RX.search(blk)
            if r: rails[hashlib.md5(norm(r.group(0)).encode()).hexdigest()[:8]] += 1
            if t: tops[hashlib.md5(norm(t.group(0)).encode()).hexdigest()[:8]] += 1
        if not check_only:
            open(f, 'w', encoding='utf-8').write(''.join(parts))

    print('  frames with a shell : %d' % frames)
    print('  rail variants       : %d %s' % (len(rails), '' if len(rails) == 1 else '<- DRIFT'))
    print('  top-bar variants    : %d %s' % (len(tops), '' if len(tops) == 1 else '<- DRIFT'))
    if check_only and (len(rails) > 1 or len(tops) > 1):
        sys.exit(1)

run('--check' in sys.argv)
if '--check' not in sys.argv: patch_walkthrough()
