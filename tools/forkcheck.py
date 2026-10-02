#!/usr/bin/env python3
"""Every .v-* / .g-* class a screen uses must be defined in the design system.
One that is not is either a missing specimen or a fork; both are bugs at the
source. Lived in the scratchpad and was lost twice — it belongs in tools/."""
import re, glob, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = set()
for f in ('components.css', 'base.css'):
    d |= set(re.findall(r'\.((?:v|g)-[a-zA-Z0-9_-]+)',
             open(os.path.join(ROOT, 'design-system/system', f), encoding='utf-8').read()))
u = set()
for f in glob.glob(os.path.join(ROOT, 'screens/*.html')):
    if f.endswith('_partials.html'): continue
    for m in re.finditer(r'class="([^"]+)"', open(f, encoding='utf-8').read()):
        u |= {c for c in m.group(1).split() if c.startswith(('v-', 'g-'))}
forks = sorted(u - d)
print('  %d classes used | forks: %s' % (len(u), ', '.join(forks) if forks else 'none'))
sys.exit(1 if forks else 0)
