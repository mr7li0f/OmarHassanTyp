#!/usr/bin/env python3
import os
import sys
from datetime import date

base_url = 'https://omarhassantype.github.io/'
if '--baseUrl' in sys.argv:
    idx = sys.argv.index('--baseUrl')
    if idx + 1 < len(sys.argv):
        base_url = sys.argv[idx + 1]

public_dir = os.path.join(os.getcwd(), 'public')
if not os.path.isdir(public_dir):
    print('public directory not found:', public_dir)
    sys.exit(1)

urls = []
for root, dirs, files in os.walk(public_dir):
    for fname in files:
        if not fname.endswith('.html'):
            continue
        rel = os.path.relpath(os.path.join(root, fname), public_dir).replace('\\', '/')
        if rel == '404.html':
            continue
        urls.append(rel)

now = date.today().isoformat()
entries = []
for rel in sorted(set(urls)):
    loc = base_url.rstrip('/') + '/' + rel.lstrip('/')
    entries.append('  <url>\n    <loc>{}</loc>\n    <lastmod>{}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>'.format(loc, now))

xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(entries) + '\n</urlset>\n'

out_path = os.path.join(public_dir, 'sitemap.xml')
with open(out_path, 'w', encoding='utf8') as f:
    f.write(xml)

print('Wrote', out_path)
