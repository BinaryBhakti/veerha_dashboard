#!/usr/bin/env python3
"""Every var(--name) must resolve to a --name that is actually defined.

Why this exists: the deploy gate checked for raw hex and bare px radii, which
catches a screen that *ignores* the token system. It could not catch a screen
that *misremembers* it. `var(--success-50)` is not a hex code and not a radius,
so it sailed through every check -- and rendered as nothing at all, because the
token is called `--ok-bg`. A silent transparent background is a worse failure
than a loud wrong colour, since nothing in the page looks broken enough to
notice; it only shows up if somebody screenshots the frame and looks at it.

A var() with a fallback -- var(--x, #fff) -- is still reported, because the
fallback is exactly what hides the mistake.
"""
import re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEF = re.compile(r'(--[A-Za-z0-9_-]+)\s*:')
USE = re.compile(r'var\(\s*(--[A-Za-z0-9_-]+)')

def read(p):
    with open(p, encoding='utf-8') as fh:
        return fh.read()

def main():
    css = sorted(glob.glob(os.path.join(ROOT, 'design-system/system/*.css')) +
                 glob.glob(os.path.join(ROOT, 'screens/assets/*.css')) +
                 glob.glob(os.path.join(ROOT, 'assets/*.css')))
    html = sorted(glob.glob(os.path.join(ROOT, 'screens/*.html')) +
                  glob.glob(os.path.join(ROOT, 'design-system/*.html')) +
                  glob.glob(os.path.join(ROOT, '*.html')))

    defined = set()
    for p in css + html:
        defined |= set(DEF.findall(read(p)))

    bad = {}
    for p in css + html:
        for line_no, line in enumerate(read(p).splitlines(), 1):
            for name in USE.findall(line):
                if name not in defined:
                    bad.setdefault(name, []).append(
                        '%s:%d' % (os.path.relpath(p, ROOT), line_no))

    if not bad:
        print('  %d tokens defined · every var() resolves' % len(defined))
        return 0

    print('  UNDEFINED TOKENS — these render as nothing:')
    for name in sorted(bad):
        where = bad[name]
        print('    %-22s %d use(s)  %s%s'
              % (name, len(where), ', '.join(where[:3]),
                 ' …' if len(where) > 3 else ''))
    return 1

if __name__ == '__main__':
    sys.exit(main())
