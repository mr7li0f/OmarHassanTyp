#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let baseUrl = 'https://omarhassantype.github.io';
const idx = args.indexOf('--baseUrl');
if (idx >= 0 && args[idx + 1]) baseUrl = args[idx + 1];
if (process.env.BASE_URL) baseUrl = process.env.BASE_URL;

function ensureSlash(s) { return s.endsWith('/') ? s : s + '/'; }
baseUrl = ensureSlash(baseUrl.replace(/\/+$/, ''));

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  console.error('public directory not found:', publicDir);
  process.exit(1);
}

const now = new Date().toISOString().split('T')[0];

const LANGUAGES = ['ar', 'en', 'ku'];

const STATIC_PAGES = [
  { path: 'home.html', priority: '1.0', changefreq: 'weekly' },
  { path: 'fonts.html', priority: '0.9', changefreq: 'weekly' },
  { path: 'font.html', priority: '0.8', changefreq: 'daily' },
  { path: 'index.html', priority: '0.5', changefreq: 'monthly' }
];

const urls = [];

function buildPageUrl(relPath, queryString) {
  return new URL(relPath + (queryString || ''), baseUrl).href;
}

function addUrl(loc, { priority = '0.5', changefreq = 'monthly', lastmod = now, alternates = {} } = {}) {
  let entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;

  Object.entries(alternates).forEach(([hreflang, href]) => {
    if (href) {
      entry += `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />\n`;
    }
  });

  entry += '  </url>';
  urls.push(entry);
}

STATIC_PAGES.forEach(page => {
  const langs = page.path === 'index.html' ? ['ar'] : LANGUAGES;

  langs.forEach(lang => {
    const query = `?lang=${lang}`;
    const loc = buildPageUrl(page.path, query);

    const alternates = {};
    langs.forEach(altLang => {
      alternates[altLang] = buildPageUrl(page.path, `?lang=${altLang}`);
    });
    if (page.path !== 'index.html') {
      alternates['x-default'] = buildPageUrl(page.path, '?lang=ar');
    }

    addUrl(loc, {
      priority: page.priority,
      changefreq: page.changefreq,
      lastmod: now,
      alternates
    });
  });
});

const dataDir = path.resolve(process.cwd(), 'data');
const contentJsonPath = path.join(dataDir, 'content.json');

if (fs.existsSync(contentJsonPath)) {
  try {
    const contentData = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));
    const fonts = contentData.fonts || [];

    fonts.forEach(font => {
      const fontId = font.id;
      if (!Number.isFinite(fontId)) return;

      const fontNameAr = String(font.title || '').trim();
      const fontNameEn = String(font.title_en || '').trim();
      const fontNameKu = String(font.description_ku || font.title || '').trim().slice(0, 40);

      LANGUAGES.forEach(lang => {
        const query = `?id=${fontId}&lang=${lang}`;
        const loc = buildPageUrl('font.html', query);

        const alternates = {};
        LANGUAGES.forEach(altLang => {
          alternates[altLang] = buildPageUrl('font.html', `?id=${fontId}&lang=${altLang}`);
        });
        alternates['x-default'] = buildPageUrl('font.html', `?id=${fontId}&lang=ar`);

        addUrl(loc, {
          priority: '0.9',
          changefreq: 'daily',
          lastmod: now,
          alternates
        });
      });
    });
  } catch (err) {
    console.error('Error reading content.json for sitemap:', err.message);
  }
} else {
  console.warn('data/content.json not found, skipping font detail pages');
}

const namespaces = [
  'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  'xmlns:xhtml="http://www.w3.org/1999/xhtml"'
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${namespaces.join('\n  ')}>\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml written with ${urls.length} URLs to`, path.join(publicDir, 'sitemap.xml'));
