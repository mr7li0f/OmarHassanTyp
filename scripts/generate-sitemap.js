#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let baseUrl = 'https://omarhassantype.github.io';
const idx = args.indexOf('--baseUrl');
if (idx >= 0 && args[idx + 1]) baseUrl = args[idx + 1];
if (process.env.BASE_URL) baseUrl = process.env.BASE_URL;

function ensureSlash(s) { return s.endsWith('/') ? s : s + '/'; }
baseUrl = ensureSlash(baseUrl.replace(/\/+$/, '/'));

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  console.error('public directory not found:', publicDir);
  process.exit(1);
}

function walk(dir) {
  const ret = [];
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) ret.push(...walk(full));
    else ret.push(full);
  });
  return ret;
}

const allFiles = walk(publicDir);
const htmlFiles = allFiles.filter(p => p.endsWith('.html'))
  .map(p => path.relative(publicDir, p).replace(/\\\\/g, '/'))
  .filter(p => p !== '404.html');

const now = new Date().toISOString().split('T')[0];
const urls = htmlFiles.map(rel => {
  const loc = new URL(rel, baseUrl).href;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
console.log('sitemap.xml written to', path.join(publicDir, 'sitemap.xml'));
