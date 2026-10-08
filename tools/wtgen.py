"""Regenerate walkthrough.html's stage from the module files.

The walkthrough is a VIEW of the module files, never a second copy to maintain by
hand -- it went stale once already. Run this after every batch.

Frames without a .vs-body (the auth screens, which have no app shell) are skipped
by design: the walkthrough is the in-product experience and auth sits outside it.
"""
import re, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ia import FRAME_IA, go_targets

# --- balanced-tag extraction (was /tmp/extract.py, which got cleaned away) ----
TAG = re.compile(r'<(/?)(div|section|nav|aside|header|table|tbody|thead|tr|td|th|svg|defs|g|p|span|'
                 r'button|a|label|select|dl|dt|dd|h1|h2|h3|h4|input|textarea|use|circle|rect|path|'
                 r'line|polyline|text|option|i|b|em|hr|br|img)\b([^>]*?)(/?)>', re.I)
VOID = {'input','use','circle','rect','path','line','polyline','br','img','hr'}

def block(s, start):
    """start = index of a container tag's opening '<'.
    Returns (inner_html, index_after_close, open_tag)."""
    m = TAG.match(s, start)
    assert m, s[start:start+60]
    name = m.group(2).lower()
    depth = 0
    i = start
    while True:
        m = TAG.search(s, i)
        if not m:
            raise ValueError('unbalanced <%s> from %d' % (name, start))
        closing, tag, _attrs, selfclose = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
        i = m.end()
        if tag != name:
            continue
        if selfclose or tag in VOID:
            continue
        depth += -1 if closing else 1
        if depth == 0:
            open_end = s.index('>', start) + 1
            return s[open_end:m.start()], m.end(), s[start:open_end]


ROOT = '/Users/ashmit/Desktop/Projects/VEERHA/screens'

MODULES = ['01-home.html','02-leads.html','03-opportunities.html','04-quotes.html',
           '05-bookings.html','06-conversations.html','07-queues.html','08-calendar.html',
           '09-customers.html','11-ai.html','10-campaigns.html','12-catalog.html',
           '13-org.html','14-settings.html','15-billing.html','16-auth.html','18-commerce.html']

# Screens the walkthrough gained this batch. Everything else keeps the META the
# walkthrough already carries.
# Frames that are not stage screens: the lead drawer is rendered as the overlay,
# which lives in the hand-written tail of the stage.
# Layers. Any overlay in any frame marked data-layer="id" (a modal, a drawer, a
# confirm dialog) is lifted out of its frame into the walkthrough's layer stack,
# hidden until a data-open targets it (screens/assets/flows.js). Frames that
# exist only to show a layer (tools/flows.py LAYER_ONLY) are not screens.
# Before this, the lead drawer frame itself was the Leads screen, so the main
# list showed as a faded three-row backdrop whenever the drawer was closed.
from flows import LAYER_ONLY, SHEET_ONLY
EXCLUDE = set(LAYER_ONLY) | set(SHEET_ONLY)
RENAME = {}
LAYER_RX = re.compile(r'<div class="vs-overlay[^"]*"[^>]*data-layer="([^"]+)"')

NEW_META = {
  'opportunity-drawer':  {'crumb': ['Customer','Opportunity'], 'rail': 'trend', 'tabs': ''},
  'quotes':              {'crumb': ['Workspace','Quotations'], 'rail': 'file', 'tabs': ''},
  'quotes-empty':        {'crumb': ['Workspace','Quotations'], 'rail': 'file', 'tabs': ''},
  'front-desk':          {'crumb': ['Operations','Front desk'], 'rail': 'bed', 'tabs': ''},
  'touchpoints':         {'crumb': ['Your work','Touchpoints'], 'rail': 'check', 'tabs': ''},
  'touchpoint-drawer':   {'crumb': ['Your work','Touchpoints'], 'rail': 'check', 'tabs': ''},
  'booking-links':       {'crumb': ['Settings','Booking links'], 'rail': 'cal', 'tabs': ''},
  'booking-links-empty': {'crumb': ['Settings','Booking links'], 'rail': 'cal', 'tabs': ''},
  'customers':           {'crumb': ['Customer','Customers'], 'rail': 'target', 'tabs': ''},
  'customer-record':     {'crumb': ['Customer','Customer'], 'rail': 'target', 'tabs': ''},
  'workflows':           {'crumb': ['Workforce','Workflows'], 'rail': 'cpu', 'tabs': ''},
  'employee-new':        {'crumb': ['Workforce','New employee'], 'rail': 'cpu', 'tabs': ''},
  'hire':                {'crumb': ['Workforce','Hire'], 'rail': 'cpu', 'tabs': ''},
  'knowledge':           {'crumb': ['Workforce','Knowledge'], 'rail': 'cpu', 'tabs': ''},
  'memory':              {'crumb': ['Workforce','Memory'], 'rail': 'cpu', 'tabs': ''},
  'calling':             {'crumb': ['Workforce','Voice calling'], 'rail': 'cpu', 'tabs': ''},
  'deliveries':          {'crumb': ['Workforce','Deliveries'], 'rail': 'cpu', 'tabs': ''},
  'deliveries-failed':   {'crumb': ['Workforce','Deliveries'], 'rail': 'cpu', 'tabs': ''},
  'properties':          {'crumb': ['Products','Properties'], 'rail': 'cpu', 'tabs': ''},
  'shared-resources':    {'crumb': ['Products','Shared resources'], 'rail': 'cpu', 'tabs': ''},
  'resource-drawer':     {'crumb': ['Products','Resource'], 'rail': 'cpu', 'tabs': ''},
  'pricing':             {'crumb': ['Products','Pricing'], 'rail': 'cpu', 'tabs': ''},
  'pricing-empty':       {'crumb': ['Products','Pricing'], 'rail': 'cpu', 'tabs': ''},
  'departments':         {'crumb': ['Organisation','Departments'], 'rail': 'users', 'tabs': ''},
  'fields':              {'crumb': ['Settings','Fields'], 'rail': 'gear', 'tabs': ''},
  'fields-profiles':     {'crumb': ['Settings','Qualification'], 'rail': 'gear', 'tabs': ''},
  'fields-changelog':    {'crumb': ['Settings','Change log'], 'rail': 'gear', 'tabs': ''},
  'forms':               {'crumb': ['Settings','Forms'], 'rail': 'gear', 'tabs': ''},
  'automation':          {'crumb': ['Settings','Pipeline & automation'], 'rail': 'gear', 'tabs': ''},
  'developers':          {'crumb': ['Settings','Developers'], 'rail': 'gear', 'tabs': ''},
  'developers-empty':    {'crumb': ['Settings','Developers'], 'rail': 'gear', 'tabs': ''},
  'billing':             {'crumb': ['Accounts','Billing'], 'rail': 'gear', 'tabs': ''},
  'billing-empty':       {'crumb': ['Accounts','Billing'], 'rail': 'gear', 'tabs': ''},
  'wallet':              {'crumb': ['Accounts','Wallet'], 'rail': 'gear', 'tabs': ''},
  'recommendations':  {'crumb': ['Marketing','Recommendations'], 'rail': 'wand', 'tabs': ''},
  'campaign-builder': {'crumb': ['Marketing','Campaigns'],       'rail': 'wand', 'tabs': ''},
  'sequences':        {'crumb': ['Marketing','Sequences'],       'rail': 'wand', 'tabs': ''},
  'landing-pages':    {'crumb': ['Marketing','Landing pages'],   'rail': 'wand', 'tabs': ''},
  'creative-studio':  {'crumb': ['Marketing','Creative'],        'rail': 'wand', 'tabs': ''},
  'attribution':      {'crumb': ['Marketing','Attribution'],     'rail': 'wand', 'tabs': ''},
  'org-chart': {'crumb': ['Organisation','Org chart'], 'rail': 'users', 'tabs': ''},
  'org-empty': {'crumb': ['Organisation','Org chart'], 'rail': 'users', 'tabs': ''},
  'team':      {'crumb': ['Organisation','Team & access'], 'rail': 'users', 'tabs': ''},
  'onboarding':{'crumb': ['Organisation','Onboarding'], 'rail': 'users', 'tabs': ''},
}
NEW_PANEL3 = ('Records', [
  ('quotes','Quotations', None), ('quotes-empty','Quotations — empty', None),
  ('customers','Customers', None), ('customer-record','Customer record', None),
  ('opportunity-drawer','Opportunity drawer', None),
])
NEW_PANEL4 = ('Operations', [
  ('front-desk','Front desk', None), ('touchpoints','Touchpoints', None),
  ('touchpoint-drawer','Touchpoint drawer', None),
  ('booking-links','Booking links', None), ('booking-links-empty','Booking links — empty', None),
])
NEW_PANEL5 = ('AI workforce', [
  ('workflows','Workflows', None), ('employee-new','Create an employee', None),
  ('hire','Hire', None), ('knowledge','Knowledge', None), ('memory','Memory', None),
  ('calling','Voice calling', None), ('deliveries','Deliveries', None),
  ('deliveries-failed','Deliveries — failures', None),
])
NEW_PANEL6 = ('Catalogue', [
  ('properties','Properties', None), ('shared-resources','Shared resources', None),
  ('resource-drawer','Resource drawer', None),
  ('pricing','Pricing', None), ('pricing-empty','Pricing — empty', None),
])
NEW_PANEL7 = ('Configuration', [
  ('fields','Fields', None), ('fields-profiles','Qualification profiles', None),
  ('fields-changelog','Change log', None), ('forms','Forms', None),
  ('automation','Pipeline & automation', None),
  ('developers','Developers', None), ('developers-empty','Developers — no key', None),
  ('departments','Departments', None),
])
NEW_PANEL8 = ('Billing', [
  ('billing','Billing & plan', None), ('billing-empty','Billing — no invoices', None),
  ('wallet','Wallet', None),
])
NEW_PANEL2 = ('Marketing', [
  ('campaign-builder','Campaign builder', None),
  ('sequences',       'Sequences', None),
  ('landing-pages',   'Landing pages', None),
  ('creative-studio', 'Creative studio', None),
  ('attribution',     'Attribution', None),
  ('recommendations', 'Recommendations', None),
])
NEW_PANEL = ('Organisation', [
  ('org-chart',  'Org chart', None),
  ('org-empty',  'Nobody placed', None),
  ('team',       'Team &amp; access', None),
  ('onboarding', 'Onboarding', None),
])
NEW_CMD = [
  {"g":"Go to","t":"Campaigns","s":"2 drafts, 1 scheduled","go":"campaign-builder"},
  {"g":"Go to","t":"Attribution","s":"100 leads, 20 booked","go":"attribution"},
  {"g":"Actions","t":"Fix the nurture sequence","s":"3 of 4 steps cannot send","go":"sequences"},
  {"g":"Actions","t":"Make a creative","s":"Post, story or banner","go":"creative-studio"},
  {"g":"Go to","t":"Org chart","s":"6 people, 3 AI employees","go":"org-chart"},
  {"g":"Actions","t":"Place the two unassigned people","s":"Org chart","go":"org-empty"},
]

def frames(path):
    s = open(path, encoding='utf-8').read()
    out = []
    for m in re.finditer(r'<section class="vs-frame[^"]*" id="([^"]+)">', s):
        fid = m.group(1)
        nxt = s.find('<section class="vs-frame', m.end())
        seg_end = nxt if nxt != -1 else len(s)
        bi = s.find('<div class="vs-body', m.end())
        if fid in EXCLUDE:
            print('  skip (overlay): %s' % fid); continue
        if bi == -1 or bi > seg_end:
            print('  skip (no shell): %s' % fid); continue
        inner, _, opentag = block(s, bi)
        cls = re.search(r'class="([^"]*)"', opentag).group(1)
        # A row with top tabs carries a generated strip between the top bar and
        # the body (tools/shell.py). The stage takes bodies only, so carry the
        # strip in with it or the walkthrough loses the tabs.
        # Only the generated strip (one line, role=tablist) -- an in-page strip such
        # as Email studio's Templates | Build is multi-line and stays out, as before.
        ts = s.find('<div class="vs-tabstrip"><div class="v-tabs" role="tablist"', m.end(), bi)
        tabs = s[ts:s.index('</div></div>', ts) + len('</div></div>')] if ts != -1 else ''
        out.append((fid, cls, inner, tabs))
    return out

def main():
    wt = open(os.path.join(ROOT,'walkthrough.html'), encoding='utf-8').read()

    # ---- stage ----------------------------------------------------------
    si = wt.index('<div class="wt__stage" id="wtStage">')
    _, _, opentag = block(wt, si)

    # The one hand-written stage child is the "not built yet" placeholder. Rather
    # than preserving a tail, the stage is rewritten from its opening tag up to
    # the END of that placeholder -- so anything stale in between is dropped and
    # the document's own closing tags are left untouched.
    sk = wt.index('data-screen="soon"'); sk = wt.rindex('<div', 0, sk + 1)
    frag, _, _ = block(wt, sk)
    soon_end = wt.index(frag, sk) + len(frag) + len('</div>')
    soon_html = wt[sk:soon_end]

    # collect every data-layer overlay from every frame, and strip it from screens
    layers, seen_layers = [], set()
    def lift(inner):
        out = inner
        for m in list(LAYER_RX.finditer(inner))[::-1]:
            lid = m.group(1)
            ov_inner, end, ov_open = block(inner, m.start())
            if lid not in seen_layers:
                seen_layers.add(lid)
                layers.append('<div class="wt-layer" data-layer="%s" hidden>%s%s</div></div>' % (lid, ov_open, ov_inner))
            out = out[:m.start()] + out[end:]
        return out
    for f in MODULES:
        src_f = open(os.path.join(ROOT, f), encoding='utf-8').read()
        for fm in re.finditer(r'<section class="vs-frame[^"]*" id="([^"]+)">', src_f):
            nxt = src_f.find('<section class="vs-frame', fm.end()); seg = src_f[fm.end(): nxt if nxt != -1 else len(src_f)]
            if fm.group(1) in LAYER_ONLY: lift(seg)

    ids, parts = [], []
    for f in MODULES:
        for fid, cls, inner, tabs in frames(os.path.join(ROOT, f)):
            fid = RENAME.get(fid, fid)
            inner = lift(inner)
            ids.append(fid)
            if tabs:
                parts.append('<div data-screen="%s" class="wt-screen wt-screen--tabbed">%s<div class="%s">%s</div></div>'
                             % (fid, tabs, cls, inner))
            else:
                parts.append('<div data-screen="%s" class="wt-screen %s">%s</div>' % (fid, cls, inner))
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes: raise SystemExit('duplicate screen ids: %s' % dupes)

    wt = wt[:si] + opentag + '\n' + '\n'.join(parts) + '\n' + soon_html + '\n' + '\n'.join(layers) + wt[soon_end:]
    print('  layers: %s' % (', '.join(sorted(seen_layers)) or 'none'))

    # ---- META -----------------------------------------------------------
    mm = re.search(r'var META = (\{.*?\});\n', wt, re.S)
    meta = json.loads(mm.group(1)); meta.update(NEW_META)
    # Crumb and active sidebar row come from tools/ia.py, the same table the
    # module shells are generated from. `rail` must equal the sidebar button's
    # data-rail (a screen id); the old hand-typed icon names never matched it.
    # `tabs` stays empty: each tabbed screen carries its own generated strip.
    go_row, _, _ = go_targets()
    for fid, ia in FRAME_IA.items():
        meta[fid] = {'crumb': list(ia['crumb']), 'rail': go_row.get(ia['row'], ''), 'tabs': ''}
    missing = [i for i in ids if i not in meta]
    if missing: raise SystemExit('no META for: %s' % missing)
    wt = wt[:mm.start(1)] + json.dumps(meta) + wt[mm.end(1):]

    # ---- panel ----------------------------------------------------------
    for label, links in (NEW_PANEL3, NEW_PANEL4, NEW_PANEL2, NEW_PANEL5, NEW_PANEL6, NEW_PANEL7, NEW_PANEL8, NEW_PANEL):
        if ('data-go="%s"' % links[0][0]) in wt:
            continue
        g = ['  <div class="wt-panel__g">',
             '    <div class="label" style="margin-bottom:6px">%s</div>' % label]
        for gid, txt, key in links:
            k = '<span class="wt-link__k">%s</span>' % key if key else ''
            g.append('    <button class="wt-link" data-go="%s">%s%s</button>' % (gid, txt, k))
        g.append('  </div>')
        anchor = '  <div class="wt-panel__g">\n    <div class="label" style="margin-bottom:6px">Settings</div>'
        if anchor not in wt:
            raise SystemExit('panel anchor not found')
        wt = wt.replace(anchor, '\n'.join(g) + '\n' + anchor, 1)

    # ---- sprite union ----------------------------------------------------
    # Each module file carries its own sprite, and builders add glyphs to the
    # module they are working in. The walkthrough embeds frames from every
    # module, so any icon it lacks renders as nothing at all -- invisible in a
    # screenshot, and 47 of them appeared the first time this ran. Union every
    # module's <g id="i-..."> into the walkthrough sprite.
    defs = {}
    for m in MODULES:
        src = open(os.path.join(ROOT, m), encoding='utf-8').read()
        for g in re.finditer(r'<g id="(i-[a-z0-9-]+)">.*?</g>', src, re.S):
            defs.setdefault(g.group(1), g.group(0))
    have = set(re.findall(r'<g id="(i-[a-z0-9-]+)">', wt))
    missing = [v for k, v in defs.items() if k not in have]
    if missing:
        wt = wt.replace('</defs>', ''.join(missing) + '</defs>', 1)
        print('  sprite: +%d glyph(s) unioned from the modules' % len(missing))

    # ---- the counters ---------------------------------------------------
    # Both of these went stale twice by being typed by hand. They are derived
    # from what was actually generated, so they cannot disagree with the list.
    n_screens, n_modules = len(ids), len([m for m in MODULES if frames(os.path.join(ROOT, m))])
    wt = re.sub(r'(<b>Walkthrough</b> \u00b7 )\d+( modules)',
                lambda m: '%s%d%s' % (m.group(1), n_modules, m.group(2)), wt)
    wt = re.sub(r'(<span id="wtCount">)\d+(</span>)',
                lambda m: '%s%d%s' % (m.group(1), n_screens, m.group(2)), wt)
    wt = re.sub(r'The walkthrough now covers [^.]+\.',
                'The walkthrough now covers %d modules and %d screens.' % (n_modules, n_screens), wt)

    # ---- command palette ------------------------------------------------
    cm = re.search(r'var CMD_ITEMS = (\[.*?\]);\n', wt, re.S)
    items = json.loads(cm.group(1))
    have = {i['go'] for i in items}
    items += [i for i in NEW_CMD if i['go'] not in have]
    wt = wt[:cm.start(1)] + json.dumps(items) + wt[cm.end(1):]

    # behaviour.js carries the ported table behaviours; it must survive a
    # regeneration or the walkthrough silently loses sorting and filtering.
    if 'behaviour.js' not in wt:
        wt = wt.replace('</body>', '<script src="assets/behaviour.js"></script>\n</body>', 1)
        print('  re-attached behaviour.js')
    if '<script src="assets/journeys.js"' not in wt:
        wt = wt.replace('</body>', '<script src="assets/journeys.js"></script>\n</body>', 1)
        print('  attached journeys.js')
    if '<script src="assets/flows.js"' not in wt:
        wt = wt.replace('<script src="assets/behaviour.js"></script>', '<script src="assets/behaviour.js"></script>\n<script src="assets/flows.js"></script>', 1)
        print('  attached flows.js')

    open(os.path.join(ROOT,'walkthrough.html'),'w',encoding='utf-8').write(wt)
    print('walkthrough: %d screens, %d palette items' % (len(ids), len(items)))
    print('screens:', ' '.join(ids))

main()
