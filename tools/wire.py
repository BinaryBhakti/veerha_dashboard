#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Write what every button does onto the frames, from tools/flows.py.

  python3 tools/wire.py            write data-go / data-open / data-do / data-menu / data-inert
  python3 tools/wire.py --check    report buttons that do nothing and say nothing about it
  python3 tools/wire.py --check --strict   ... and fail if there are any (deploy gate)

Only buttons and links in frames that the walkthrough shows (shell frames and
LAYER_ONLY frames) are considered. Controls whose behaviour is built in —
tabs, pills, segments, stat tiles, toggles, checks, pagers, the shell's own
sidebar and rail items, Close — are not counted.

Attributes this tool writes are marked data-w so a re-run can replace them; a
control wired by hand in its frame (no data-w) is never touched.
"""
import re, sys, glob, os, html, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from flows import RULES, LAYER_ONLY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

FRAME_RX = re.compile(r'(?=<section class="vs-frame)')
CTRL_RX = re.compile(r'<(button|a)\b([^>]*)>(.*?)</\1>', re.S)
MANAGED = re.compile(r'\s(?:data-w|data-go|data-view|data-open|data-do|data-menu|data-inert)(?:="[^"]*")?')
WIRED = re.compile(r'\sdata-(?:go|open|do|menu|inert|close|rail|bulk)\b')
BUILTIN = re.compile(r'class="[^"]*\b(?:v-pill|v-tab|v-seg__opt|v-pager__n|v-stat|v-sidenav__item|v-rail__item|'
                     r'v-topbar__icon|vs-topbar__menu|v-toggle|v-check|v-radiocard|v-filterchip__x)\b')

def text_of(inner):
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', inner))).strip()

def aria_of(attrs):
    m = re.search(r'aria-label="([^"]*)"', attrs)
    return html.unescape(m.group(1)) if m else ''

def attrs_for(action):
    kind, _, arg = action.partition(':')
    if kind == 'go':
        screen, _, q = arg.partition('?')
        out = ' data-go="%s"' % screen
        if q.startswith('view='): out += ' data-view="%s"' % q[5:]
        return out
    if kind == 'open':  return ' data-open="%s"' % arg
    if kind == 'do':    return ' data-do="%s"' % arg
    if kind == 'menu':  return ' data-menu aria-haspopup="menu" aria-expanded="false"'
    if kind == 'inert': return ' data-inert="%s"' % html.escape(arg, quote=True)
    raise ValueError('unknown action %r' % action)

def matches(find, label, aria):
    if isinstance(find, dict):
        if 'aria' in find: return aria.lower().startswith(find['aria'].lower())
        if 'exact' in find: return label.lower() == find['exact'].lower()
        return False
    return label.lower().startswith(find.lower()) or (not label and aria.lower().startswith(find.lower()))

def rule_for(fid, label, aria):
    for scope in (fid, '*'):
        for r in RULES:
            if r[0] == scope and matches(r[1], label, aria):
                return r[2]
    return None

def shown(blk, fid):
    return '<nav class="v-rail' in blk or fid in LAYER_ONLY

def run(check):
    unwired = collections.defaultdict(list); written = 0
    for f in sorted(glob.glob('screens/[0-9][0-9]-*.html')):
        s = open(f, encoding='utf-8').read()
        parts = FRAME_RX.split(s)
        for i in range(1, len(parts)):
            blk = parts[i]
            fid = re.search(r'id="([^"]+)"', blk).group(1)
            if not shown(blk, fid): continue
            def sub(m):
                nonlocal written
                tag, attrs, inner = m.group(1), m.group(2), m.group(3)
                label, aria = text_of(inner), aria_of(attrs)
                hand = WIRED.search(attrs) and ' data-w' not in attrs
                if hand: return m.group(0)
                if BUILTIN.search(attrs) or aria in ('Close',): return m.group(0)
                act = rule_for(fid, label, aria)
                clean = MANAGED.sub('', attrs)
                if act:
                    if not check: written += 1
                    return '<%s%s data-w%s>%s</%s>' % (tag, clean, attrs_for(act), inner, tag)
                if tag == 'a' and re.search(r'href="(?!#)[^"]+"', attrs):   # a real link
                    return m.group(0)
                unwired[(f, fid)].append(label or aria or '(unlabelled)')
                return '<%s%s>%s</%s>' % (tag, clean, inner, tag) if ' data-w' in attrs else m.group(0)
            parts[i] = CTRL_RX.sub(sub, blk)
        if not check:
            open(f, 'w', encoding='utf-8').write(''.join(parts))
    total = sum(len(v) for v in unwired.values())
    if not check: print('  wired %d controls' % written)
    by_file = collections.Counter()
    for (f, fid), labels in unwired.items(): by_file[os.path.basename(f)] += len(labels)
    print('  unwired, unexplained: %d' % total)
    for name, n in sorted(by_file.items()): print('    %-24s %d' % (name, n))
    if check and '-v' in sys.argv:
        for (f, fid), labels in sorted(unwired.items()):
            print('    %s#%s: %s' % (os.path.basename(f), fid, ' | '.join(labels[:12])))
    return total

if __name__ == '__main__':
    n = run('--check' in sys.argv)
    if '--strict' in sys.argv and n: sys.exit(1)
