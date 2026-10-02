# -*- coding: utf-8 -*-
"""Draft audit/AUDIT.md sections from the captured text dumps.

Mechanical extraction only: route, heading, purpose line, the visible content
in order, and which interaction states were captured. The judgement -- fields
that must survive, the UX problems -- is added on top of this by the audit pass;
this exists so that pass starts from evidence rather than a screenshot.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
done = json.load(open('audit/.crawl-done.json'))

# the settings sidebar repeats on every settings page; drop it so the diff
# between screens is the screen, not the chrome
CHROME_END = ('Documentation', 'Support', 'DEVELOPERS', 'Need help?')

def content(name):
    p = 'audit/text/%s.txt' % name
    if not os.path.exists(p): return []
    lines = [l.strip() for l in open(p, encoding='utf-8') if l.strip()]
    idx = [i for i, l in enumerate(lines) if l in CHROME_END]
    return lines[max(idx) + 1:] if idx else lines

want = set(sys.argv[1:]) if len(sys.argv) > 1 else None
out = ['# Veerha — live app audit',
       '',
       'Mechanically extracted from the %s capture. Every field, column, filter, tab, KPI'
       % ('26 Sep 2026'),
       'and status value listed here must survive the redesign.', '']

n = 0
for name, rec in sorted(done.items(), key=lambda kv: kv[1].get('route') or ''):
    if want and name not in want: continue
    body = content(name)
    if len(body) < 4: continue
    n += 1
    states = sorted(f.split('--')[1].replace('.png', '')
                    for f in os.listdir('audit/states') if f.startswith(name + '--')) \
             if os.path.isdir('audit/states') else []
    out += ['---', '',
            '## %s' % (rec.get('h1') or name),
            '',
            '- **Route:** `%s`' % rec.get('route'),
            '- **Capture:** `audit/screens/%s.png` · mobile `audit/screens-mobile/%s.png`' % (name, name),
            '- **States captured:** %s' % (', '.join(states) if states else 'none'),
            '',
            '### Purpose (from the page)', '',
            '> %s' % (body[1] if len(body) > 1 else '—'),
            '',
            '### Content in order', '', '```']
    out += body[:90]
    out += ['```', '', '### Fields that must survive', '', '_to fill in the audit pass_', '',
            '### UX problems', '', '_to fill in the audit pass_', '']

open('audit/AUDIT.md', 'w', encoding='utf-8').write('\n'.join(out))
print('AUDIT.md drafted: %d screens · %d lines' % (n, len(out)))
