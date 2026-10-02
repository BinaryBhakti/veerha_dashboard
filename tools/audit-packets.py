# -*- coding: utf-8 -*-
"""Assemble one evidence packet per captured route for the audit pass.

Each packet is what an auditor needs in one place: the route, its heading, the
full text dump (that is where fields, columns, filters and status values are
actually readable), which interaction states were captured, and the paths to the
desktop/mobile screenshots. Without this the agents would be guessing at field
names from a full-page PNG.
"""
import json, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

done = json.load(open('audit/.crawl-done.json'))
out, missing = [], []
for name, rec in sorted(done.items()):
    txt = 'audit/text/%s.txt' % name
    body = open(txt, encoding='utf-8').read() if os.path.exists(txt) else ''
    if not body.strip(): missing.append(name)
    states = sorted(f for f in os.listdir('audit/states') if f.startswith(name + '--')) \
             if os.path.isdir('audit/states') else []
    out.append({
        'name': name, 'route': rec.get('route'), 'final': rec.get('finalUrl'),
        'h1': rec.get('h1', ''), 'chars': len(body),
        'desktop': 'audit/screens/%s.png' % name,
        'mobile':  'audit/screens-mobile/%s.png' % name,
        'states':  ['audit/states/' + s for s in states],
        'text':    body[:12000],
    })

json.dump(out, open('audit/packets.json', 'w'), indent=1)

groups = collections.Counter()
for p in out:
    r = (p['route'] or '/').strip('/').split('/')[0] or 'root'
    groups[r] += 1
print('packets: %d  ·  with text: %d  ·  empty text: %d' %
      (len(out), len(out) - len(missing), len(missing)))
print('states captured: %d' % sum(len(p['states']) for p in out))
print('\ntop route groups:')
for r, c in groups.most_common(14):
    print('   %-26s %d' % (r, c))
if missing: print('\nempty text dumps:', ', '.join(missing[:8]))
