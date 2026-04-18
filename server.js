const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

require('dotenv').config();

let config = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

const app = express();
const PORT = process.env.PORT || config.port || 5000;
const RUNTIME_JWT_SECRET = crypto.randomBytes(48).toString('hex');
const JWT_SECRET = process.env.JWT_SECRET || config.jwtSecret || RUNTIME_JWT_SECRET;
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || config.adminUsername || 'ilirt8').trim();
const ADMIN_PASSWORD_RAW = String(process.env.ADMIN_PASSWORD || config.adminPassword || 'ilirt8');
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || config.adminPasswordHash || '';
const ALLOW_PUBLIC_FONT_DOWNLOADS = String(process.env.ALLOW_PUBLIC_FONT_DOWNLOADS || config.allowPublicFontDownloads || 'true').toLowerCase() !== 'false';
const DATA_QAHWA_DIR = path.join(__dirname, 'data', 'qahwa');
const DATA_QAHWA_FONTS_DIR = path.join(DATA_QAHWA_DIR, 'fonts');
const DATA_QAHWA_PHOTOS_DIR = path.join(DATA_QAHWA_DIR, 'photos');

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map();

function toPublicAssetUrl(absPath) {
  const relative = path.relative(__dirname, absPath).replace(/\\/g, '/');
  return `/${relative}`;
}

function resolveLocalAssetPath(assetUrl) {
  const clean = String(assetUrl || '').trim();
  if (!clean) return '';
  if (/^(?:https?:|data:|blob:|mailto:|tel:)/i.test(clean)) return '';

  let local = clean;
  if (local.startsWith('./')) local = local.slice(2);
  if (local.startsWith('/')) local = local.slice(1);
  if (!local) return '';
  return path.join(__dirname, local.replace(/\//g, path.sep));
}

function isExistingAssetUrl(assetUrl) {
  const local = resolveLocalAssetPath(assetUrl);
  if (!local) return true;
  return fs.existsSync(local);
}

/* ── STORAGE (PostgreSQL or Local JSON) ── */
const DATABASE_URL = String(process.env.DATABASE_URL || config.databaseUrl || '').trim();
const USE_POSTGRES = Boolean(DATABASE_URL);
const STORAGE_MODE = USE_POSTGRES ? 'postgres' : 'local-json';
const LOCAL_STORE_PATH = path.join(__dirname, 'data', 'cms-store.json');
const DEFAULT_MAIN_STATS = {
  totalVisits: 0,
  todayDate: '',
  todayVisits: 0,
  fontViews: {},
  fontDownloads: {},
  downloadersByFont: {},
  recentDownloads: [],
  updatedAt: ''
};

const pool = USE_POSTGRES
  ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;
let postgresFallbackToLocal = false;

let localStoreCache = null;

function readJsonFileSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonFileSafe(filePath, payload) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}

function toDbFontRowFromPublic(font) {
  const now = new Date().toISOString();
  return {
    id: Number(font?.id || Date.now()),
    title: String(font?.title || '').trim(),
    title_en: String(font?.titleEn || font?.title_en || '').trim(),
    description_ar: String(font?.descriptionAr || font?.description_ar || '').trim(),
    description_en: String(font?.descriptionEn || font?.description_en || '').trim(),
    download_url: String(font?.downloadUrl || font?.download_url || '').trim(),
    font_file: String(font?.fontFile || font?.font_file || '').trim(),
    images: Array.isArray(font?.images) ? font.images : [],
    weights: Array.isArray(font?.weights) ? font.weights : [],
    is_paid: Boolean(font?.isPaid ?? font?.is_paid),
    license: String(font?.license || '').trim(),
    free_weights: Array.isArray(font?.freeWeights || font?.free_weights) ? (font.freeWeights || font.free_weights) : [],
    paid_weights: Array.isArray(font?.paidWeights || font?.paid_weights) ? (font.paidWeights || font.paid_weights) : [],
    weight_files: (font?.weightFiles && typeof font.weightFiles === 'object' && !Array.isArray(font.weightFiles))
      ? font.weightFiles
      : {},
    created_at: String(font?.createdAt || font?.created_at || now),
    updated_at: String(font?.updatedAt || font?.updated_at || font?.createdAt || font?.created_at || now)
  };
}

function createDefaultLocalStore() {
  const baseContent = readJsonFileSafe(path.join(__dirname, 'data', 'content.json'), {
    socialLinks: [],
    workLinks: [],
    fonts: []
  });

  const socialLinks = Array.isArray(baseContent.socialLinks) ? baseContent.socialLinks : [];
  const workLinks = Array.isArray(baseContent.workLinks) ? baseContent.workLinks : [];
  const fonts = Array.isArray(baseContent.fonts) ? baseContent.fonts : [];

  return {
    social_links: socialLinks.map((item, index) => ({
      id: Number(item?.id || Date.now() + index),
      platform: String(item?.platform || '').trim(),
      url: String(item?.url || '').trim(),
      icon: String(item?.icon || 'default').trim() || 'default',
      icon_svg: String(item?.iconSvg || item?.icon_svg || '').trim(),
      sort_order: index
    })),
    work_links: workLinks.map((item, index) => ({
      id: Number(item?.id || Date.now() + index),
      platform: String(item?.platform || '').trim(),
      url: String(item?.url || '').trim(),
      icon: String(item?.icon || 'default').trim() || 'default',
      icon_svg: String(item?.iconSvg || item?.icon_svg || '').trim(),
      sort_order: index
    })),
    fonts: fonts.map(toDbFontRowFromPublic),
    stats: { main: { ...DEFAULT_MAIN_STATS } }
  };
}

function ensureLocalStoreLoaded() {
  if (localStoreCache) return localStoreCache;

  const fallback = createDefaultLocalStore();
  const loaded = readJsonFileSafe(LOCAL_STORE_PATH, fallback);

  localStoreCache = {
    social_links: Array.isArray(loaded.social_links) ? loaded.social_links : fallback.social_links,
    work_links: Array.isArray(loaded.work_links) ? loaded.work_links : fallback.work_links,
    fonts: Array.isArray(loaded.fonts) ? loaded.fonts : fallback.fonts,
    stats: (loaded.stats && typeof loaded.stats === 'object' && !Array.isArray(loaded.stats))
      ? loaded.stats
      : { main: { ...DEFAULT_MAIN_STATS } }
  };

  if (!localStoreCache.stats.main || typeof localStoreCache.stats.main !== 'object') {
    localStoreCache.stats.main = { ...DEFAULT_MAIN_STATS };
  }

  writeJsonFileSafe(LOCAL_STORE_PATH, localStoreCache);
  return localStoreCache;
}

function saveLocalStore() {
  if (!localStoreCache) return;
  writeJsonFileSafe(LOCAL_STORE_PATH, localStoreCache);
}

function parseJsonLike(value, fallback) {
  if (Array.isArray(fallback)) {
    if (Array.isArray(value)) return value;
  } else if (fallback && typeof fallback === 'object') {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  }

  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
    if (fallback && typeof fallback === 'object') {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function normalizeSql(sql) {
  return String(sql || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

async function runLocalQuery(sql, params = []) {
  const store = ensureLocalStoreLoaded();
  const normalized = normalizeSql(sql);

  if (normalized.startsWith('create table if not exists ') || normalized.startsWith('alter table ')) {
    return { rows: [], rowCount: 0 };
  }

  if (normalized.startsWith("insert into stats(key,value) values('main'")) {
    if (!store.stats.main) store.stats.main = { ...DEFAULT_MAIN_STATS };
    saveLocalStore();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith("select value from stats where key='main'")) {
    return { rows: [{ value: store.stats.main || { ...DEFAULT_MAIN_STATS } }], rowCount: 1 };
  }

  if (normalized.startsWith("update stats set value=$1 where key='main'")) {
    store.stats.main = parseJsonLike(params[0], { ...DEFAULT_MAIN_STATS });
    saveLocalStore();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('select * from social_links order by sort_order')) {
    const rows = [...store.social_links].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    return { rows, rowCount: rows.length };
  }

  if (normalized === 'delete from social_links') {
    store.social_links = [];
    saveLocalStore();
    return { rows: [], rowCount: 0 };
  }

  if (normalized.startsWith('insert into social_links(')) {
    const [id, platform, url, icon, icon_svg, sort_order] = params;
    store.social_links = store.social_links.filter(item => String(item.id) !== String(id));
    store.social_links.push({ id, platform, url, icon, icon_svg, sort_order });
    saveLocalStore();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('select * from work_links order by sort_order')) {
    const rows = [...store.work_links].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    return { rows, rowCount: rows.length };
  }

  if (normalized === 'delete from work_links') {
    store.work_links = [];
    saveLocalStore();
    return { rows: [], rowCount: 0 };
  }

  if (normalized.startsWith('insert into work_links(')) {
    const [id, platform, url, icon, icon_svg, sort_order] = params;
    store.work_links = store.work_links.filter(item => String(item.id) !== String(id));
    store.work_links.push({ id, platform, url, icon, icon_svg, sort_order });
    saveLocalStore();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('select * from fonts order by created_at asc')) {
    const rows = [...store.fonts].sort((a, b) => Date.parse(a.created_at || '') - Date.parse(b.created_at || ''));
    return { rows, rowCount: rows.length };
  }

  if (normalized.startsWith('select * from fonts where id=$1')) {
    const row = store.fonts.find(item => String(item.id) === String(params[0]));
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }

  if (normalized.startsWith('insert into fonts(')) {
    const [id, title, title_en, description_ar, description_en, download_url, font_file, images, weights, is_paid, license, free_weights, paid_weights, weight_files, updated_at] = params;
    const created = String(updated_at || new Date().toISOString());
    const row = {
      id,
      title,
      title_en,
      description_ar,
      description_en,
      download_url,
      font_file,
      images: parseJsonLike(images, []),
      weights: parseJsonLike(weights, []),
      is_paid: Boolean(is_paid),
      license: String(license || ''),
      free_weights: parseJsonLike(free_weights, []),
      paid_weights: parseJsonLike(paid_weights, []),
      weight_files: parseJsonLike(weight_files, {}),
      created_at: created,
      updated_at: created
    };

    store.fonts = store.fonts.filter(item => String(item.id) !== String(id));
    store.fonts.push(row);
    saveLocalStore();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('update fonts set title=$1')) {
    const [title, title_en, description_ar, description_en, download_url, font_file, images, weights, is_paid, license, free_weights, paid_weights, weight_files, id] = params;
    const index = store.fonts.findIndex(item => String(item.id) === String(id));
    if (index === -1) return { rows: [], rowCount: 0 };

    const current = store.fonts[index];
    store.fonts[index] = {
      ...current,
      title,
      title_en,
      description_ar,
      description_en,
      download_url,
      font_file,
      images: parseJsonLike(images, []),
      weights: parseJsonLike(weights, []),
      is_paid: Boolean(is_paid),
      license: String(license || ''),
      free_weights: parseJsonLike(free_weights, []),
      paid_weights: parseJsonLike(paid_weights, []),
      weight_files: parseJsonLike(weight_files, {}),
      updated_at: new Date().toISOString()
    };

    saveLocalStore();
    return { rows: [], rowCount: 1 };
  }

  if (normalized.startsWith('delete from fonts where id=$1')) {
    const before = store.fonts.length;
    store.fonts = store.fonts.filter(item => String(item.id) !== String(params[0]));
    saveLocalStore();
    return { rows: [], rowCount: Math.max(0, before - store.fonts.length) };
  }

  if (normalized === 'select id from fonts') {
    return { rows: store.fonts.map(item => ({ id: item.id })), rowCount: store.fonts.length };
  }

  if (normalized === 'select id,title,title_en from fonts') {
    return {
      rows: store.fonts.map(item => ({ id: item.id, title: item.title, title_en: item.title_en })),
      rowCount: store.fonts.length
    };
  }

  throw new Error(`Unsupported local query: ${sql}`);
}

async function query(sql, params) {
  if (USE_POSTGRES && !postgresFallbackToLocal) {
    let client = null;
    try {
      client = await pool.connect();
      return await client.query(sql, params);
    } catch (error) {
      postgresFallbackToLocal = true;
      console.error('[storage] PostgreSQL unavailable, falling back to local JSON store.', error?.message || error);
    } finally {
      if (client) client.release();
    }
  }
  return runLocalQuery(sql, params);
}

/* ── DB init ── */
async function initDB() {
  await query(`CREATE TABLE IF NOT EXISTS fonts (
    id BIGINT PRIMARY KEY, title TEXT NOT NULL, title_en TEXT DEFAULT '',
    description_ar TEXT DEFAULT '', description_en TEXT DEFAULT '',
    download_url TEXT DEFAULT '', font_file TEXT,
    images JSONB DEFAULT '[]', weights JSONB DEFAULT '[]',
    is_paid BOOLEAN DEFAULT FALSE, license TEXT DEFAULT '',
    free_weights JSONB DEFAULT '[]', paid_weights JSONB DEFAULT '[]',
    weight_files JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(`CREATE TABLE IF NOT EXISTS social_links (
    id BIGINT PRIMARY KEY, platform TEXT DEFAULT '',
    url TEXT DEFAULT '', icon TEXT DEFAULT 'default',
    icon_svg TEXT DEFAULT '', sort_order INT DEFAULT 0
  )`);
  await query(`CREATE TABLE IF NOT EXISTS work_links (
    id BIGINT PRIMARY KEY, platform TEXT DEFAULT '',
    url TEXT DEFAULT '', icon TEXT DEFAULT 'default',
    icon_svg TEXT DEFAULT '', sort_order INT DEFAULT 0
  )`);
  await query(`CREATE TABLE IF NOT EXISTS stats (key TEXT PRIMARY KEY, value JSONB)`);
  await query(`ALTER TABLE social_links ADD COLUMN IF NOT EXISTS icon_svg TEXT DEFAULT ''`);
  await query(`ALTER TABLE work_links ADD COLUMN IF NOT EXISTS icon_svg TEXT DEFAULT ''`);
  await query(`ALTER TABLE fonts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
  await query(`ALTER TABLE fonts ADD COLUMN IF NOT EXISTS weight_files JSONB DEFAULT '{}'`);
  await query(`INSERT INTO stats(key,value) VALUES('main','{"totalVisits":0,"todayDate":"","todayVisits":0,"fontViews":{},"fontDownloads":{}}') ON CONFLICT(key) DO NOTHING`);
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function getLoginAttemptKey(req, username) {
  return `${getClientIp(req)}::${String(username || '').toLowerCase()}`;
}

function getLoginRateState(req, username) {
  const key = getLoginAttemptKey(req, username);
  const now = Date.now();
  let entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    entry = { firstAttemptAt: now, count: 0, blockedUntil: 0 };
    loginAttempts.set(key, entry);
  }

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { key, entry, blocked: true, retryAfterMs: entry.blockedUntil - now };
  }

  if (entry.blockedUntil && entry.blockedUntil <= now) {
    entry.firstAttemptAt = now;
    entry.count = 0;
    entry.blockedUntil = 0;
  }

  return { key, entry, blocked: false, retryAfterMs: 0 };
}

function registerLoginFailure(rateState) {
  if (!rateState?.entry) return;
  const now = Date.now();
  if (now - rateState.entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    rateState.entry.firstAttemptAt = now;
    rateState.entry.count = 0;
  }

  rateState.entry.count += 1;
  if (rateState.entry.count >= LOGIN_MAX_ATTEMPTS) {
    rateState.entry.blockedUntil = now + LOGIN_WINDOW_MS;
  }

  loginAttempts.set(rateState.key, rateState.entry);
}

function clearLoginFailures(rateState) {
  if (!rateState?.key) return;
  loginAttempts.delete(rateState.key);
}

/* ── Multer ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const FONT_EXTENSIONS = new Set(['.otf', '.ttf', '.woff', '.woff2']);
const WEIGHT_FILE_FIELD_PREFIX = 'weightFile__';

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024, files: 80 },
  fileFilter: (req, file, cb) => {
    const ext = String(path.extname(file.originalname || '')).toLowerCase();
    if (file.fieldname === 'images') {
      return cb(null, IMAGE_EXTENSIONS.has(ext));
    }
    if (file.fieldname === 'fontFile' || String(file.fieldname || '').startsWith(WEIGHT_FILE_FIELD_PREFIX)) {
      return cb(null, FONT_EXTENSIONS.has(ext));
    }
    return cb(null, false);
  }
});
const fontUpload = upload.any();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache'); res.setHeader('Expires', '0'); next();
});

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  if (req.secure || forwardedProto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use('/uploads', (req, res, next) => {
  if (ALLOW_PUBLIC_FONT_DOWNLOADS) return next();

  const referer = req.headers['referer'] || req.headers['referrer'] || '';
  const host = req.headers['host'] || '', origin = req.headers['origin'] || '';
  const fontExt = /\.(otf|ttf|woff|woff2)$/i.test(req.path);
  if (fontExt) {
    const fromSameHost = [host,'localhost','127.0.0.1'].some(h => h && (referer.includes(h)||origin.includes(h)));
    const fromReplit = referer.includes('.replit.dev')||referer.includes('.repl.co')||origin.includes('.replit.dev')||origin.includes('.repl.co');
    if (!fromSameHost && !fromReplit && referer !== '') return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (/\.(otf|ttf|woff|woff2)$/i.test(filePath)) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

app.use('/data', express.static(path.join(__dirname, 'data'), {
  setHeaders: (res, filePath) => {
    if (/\.(otf|ttf|woff|woff2)$/i.test(filePath)) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'File not found' });
});

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

/* ── AUTH ── */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const submittedUser = String(username || '').trim();
  const normalizedSubmittedUser = submittedUser.toLowerCase();
  const normalizedAdminUser = ADMIN_USERNAME.toLowerCase();
  const rateState = getLoginRateState(req, normalizedSubmittedUser);
  if (rateState.blocked) {
    const retryAfterSec = Math.ceil(rateState.retryAfterMs / 1000);
    return res.status(429).json({ error: `محاولات كثيرة، حاول بعد ${retryAfterSec} ثانية.` });
  }

  if (normalizedSubmittedUser !== normalizedAdminUser) {
    registerLoginFailure(rateState);
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }

  let ok = false;
  if (ADMIN_PASSWORD_HASH) {
    try {
      ok = await bcrypt.compare(String(password || ''), ADMIN_PASSWORD_HASH);
    } catch {
      ok = false;
    }
  }

  if (!ok && String(password || '') === ADMIN_PASSWORD_RAW) {
    ok = true;
  }

  if (!ok) {
    registerLoginFailure(rateState);
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }

  clearLoginFailures(rateState);
  res.json({ token: jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: '24h' }) });
});

/* ── CONTENT ── */
const toLink = r => ({ id: Number(r.id), platform: r.platform, url: r.url, icon: r.icon, iconSvg: r.icon_svg || '' });
const toFont = r => ({
  id: Number(r.id), title: r.title, titleEn: r.title_en,
  descriptionAr: r.description_ar, descriptionEn: r.description_en,
  downloadUrl: r.download_url, fontFile: r.font_file,
  images: r.images || [], weights: r.weights || [],
  isPaid: r.is_paid, license: r.license,
  freeWeights: r.free_weights || [], paidWeights: r.paid_weights || [],
  weightFiles: r.weight_files || {},
  createdAt: r.created_at,
  updatedAt: r.updated_at || r.created_at
});

function safeJsonObject(value, fallback = {}) {
  if (!value) return { ...fallback };
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // Invalid JSON payload.
  }
  return { ...fallback };
}

function normalizeWeightLabel(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseWeightCsv(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map(normalizeWeightLabel).filter(Boolean);
  }

  if (value === undefined || value === null) {
    return parseWeightCsv(fallback, []);
  }

  return String(value)
    .split(',')
    .map(normalizeWeightLabel)
    .filter(Boolean);
}

function normalizeWeightFilesMap(rawMap) {
  const parsed = safeJsonObject(rawMap, {});
  const out = {};

  Object.entries(parsed).forEach(([rawWeight, rawSource]) => {
    const weight = normalizeWeightLabel(rawWeight);
    const source = String(rawSource || '').trim();
    if (!weight || !source) return;
    out[weight] = source;
  });

  return out;
}

function safeJsonArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [...fallback];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function normalizeTextList(values) {
  const source = Array.isArray(values)
    ? values
    : (typeof values === 'string' ? values.split(',') : []);

  const out = [];
  const seen = new Set();
  source.forEach(value => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
  });

  return out;
}

function mergeUniqueText(listOfLists) {
  const out = [];
  const seen = new Set();

  (listOfLists || []).forEach(list => {
    (list || []).forEach(value => {
      const text = String(value || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const key = text.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(text);
    });
  });

  return out;
}

function pickFirstNonEmptyString(values) {
  for (const value of values || []) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function pickLongestNonEmptyString(values) {
  let longest = '';
  (values || []).forEach(value => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (text.length > longest.length) longest = text;
  });
  return longest;
}

function resolveWeightName(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const key = raw.toLowerCase();

  const map = {
    '100': 'Thin',
    '200': 'ExtraLight',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'SemiBold',
    '700': 'Bold',
    '800': 'ExtraBold',
    '900': 'Black',
    regular: 'Regular',
    normal: 'Regular',
    medium: 'Medium',
    med: 'Medium',
    bold: 'Bold',
    black: 'Black',
    heavy: 'Black',
    salt: 'Salt',
    'qahwa salt': 'Salt',
    'سالت': 'Salt',
    'خفيف': 'Light',
    'عادي': 'Regular',
    'متوسط': 'Medium',
    'عريض': 'Bold',
    'اسود': 'Black',
    'بلاك': 'Black'
  };

  return map[raw] || map[key] || raw;
}

function sortWeightList(values) {
  const weightOrder = {
    Thin: 100,
    ExtraLight: 200,
    Light: 300,
    Regular: 400,
    Medium: 500,
    SemiBold: 600,
    Bold: 700,
    ExtraBold: 800,
    Black: 900,
    Salt: 950
  };

  return [...(values || [])].sort((a, b) => {
    const aa = String(a || '');
    const bb = String(b || '');
    const orderA = weightOrder[aa] ?? 1000;
    const orderB = weightOrder[bb] ?? 1000;
    if (orderA !== orderB) return orderA - orderB;
    return aa.localeCompare(bb, 'en', { sensitivity: 'base' });
  });
}

function inferWeightFromFontFileName(fileName) {
  const lower = String(fileName || '').toLowerCase();
  if (/salt|سالت/.test(lower)) return 'Salt';
  if (/black|heavy|boldblack/.test(lower)) return 'Black';
  if (/extrabold|xtrabold|ultrabold/.test(lower)) return 'ExtraBold';
  if (/bold/.test(lower)) return 'Bold';
  if (/medium|med\b/.test(lower)) return 'Medium';
  if (/regular|normal/.test(lower)) return 'Regular';
  if (/light/.test(lower)) return 'Light';
  return 'Regular';
}

function normalizeFontIdentityToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\-_]+/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, ' ')
    .replace(/\b(font|arabic|typeface|type)\b/gi, ' ')
    .replace(/\b(خط|فونت)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isQahwaFontRecord(font) {
  const token = normalizeFontIdentityToken(`${font?.title || ''} ${font?.titleEn || ''}`);
  return token.includes('qahwa') || token.includes('قهوة');
}

function buildQahwaAssetLibrary() {
  if (!fs.existsSync(DATA_QAHWA_DIR)) return null;

  const allowedWeights = new Set(['Medium', 'Bold', 'Black']);
  const weightFiles = {};
  if (fs.existsSync(DATA_QAHWA_FONTS_DIR)) {
    const files = fs.readdirSync(DATA_QAHWA_FONTS_DIR)
      .filter(name => /\.(otf|ttf|woff2?|woff)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

    files.forEach(name => {
      const absPath = path.join(DATA_QAHWA_FONTS_DIR, name);
      const weight = resolveWeightName(inferWeightFromFontFileName(name));
      if (!weight) return;
      if (!allowedWeights.has(weight)) return;
      if (weightFiles[weight]) return;
      weightFiles[weight] = toPublicAssetUrl(absPath);
    });
  }

  const photos = [];
  if (fs.existsSync(DATA_QAHWA_PHOTOS_DIR)) {
    fs.readdirSync(DATA_QAHWA_PHOTOS_DIR)
      .filter(name => /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
      .forEach(name => {
        photos.push(toPublicAssetUrl(path.join(DATA_QAHWA_PHOTOS_DIR, name)));
      });
  }

  const weights = ['Medium', 'Bold', 'Black'].filter(weight => !!weightFiles[weight]);
  const defaultFontFile = pickFirstNonEmptyString([
    weightFiles.Medium,
    weightFiles.Bold,
    weightFiles.Black,
    ...Object.values(weightFiles)
  ]);

  return {
    weightFiles,
    weights,
    images: photos,
    defaultFontFile
  };
}

function mergeWeightFilesMaps(list) {
  const out = {};
  (list || []).forEach(item => {
    Object.entries(normalizeWeightFilesMap(item)).forEach(([weight, url]) => {
      if (!weight || !url) return;
      out[resolveWeightName(weight)] = String(url).trim();
    });
  });
  return out;
}

function applyQahwaLibraryToFont(font, library) {
  if (!font || !isQahwaFontRecord(font) || !library) return font;

  const mergedWeightFiles = mergeWeightFilesMaps([library.weightFiles]);

  Object.keys(mergedWeightFiles).forEach(weight => {
    if (!isExistingAssetUrl(mergedWeightFiles[weight])) {
      delete mergedWeightFiles[weight];
    }
  });

  const mergedWeights = sortWeightList(normalizeTextList(Object.keys(mergedWeightFiles)).map(resolveWeightName));

  const mergedImages = mergeUniqueText([
    library.images,
    safeJsonArray(font.images, [])
  ]).filter(isExistingAssetUrl);

  const fontFile = pickFirstNonEmptyString([
    isExistingAssetUrl(font.fontFile) ? font.fontFile : '',
    mergedWeightFiles.Regular,
    mergedWeightFiles.Medium,
    mergedWeightFiles.Bold,
    mergedWeightFiles.Black,
    library.defaultFontFile
  ]);

  return {
    ...font,
    fontFile,
    images: mergedImages,
    weights: mergedWeights,
    weightFiles: mergedWeightFiles
  };
}

function buildFontMergeKey(font) {
  if (isQahwaFontRecord(font)) return 'qahwa::library';

  const downloadToken = String(font?.downloadUrl || '').trim().toLowerCase();
  if (downloadToken) return `url::${downloadToken}`;

  const nameToken = normalizeFontIdentityToken(font?.titleEn || font?.title || '');
  if (nameToken) return `name::${nameToken}`;

  return `id::${String(font?.id || '')}`;
}

function getFontSortRank(font) {
  const byUpdated = Date.parse(String(font?.updatedAt || font?.createdAt || ''));
  if (Number.isFinite(byUpdated)) return byUpdated;
  const byCreated = Date.parse(String(font?.createdAt || ''));
  if (Number.isFinite(byCreated)) return byCreated;
  const byId = Number(font?.id || 0);
  return Number.isFinite(byId) ? byId : 0;
}

function mergeFontsForPayload(fonts) {
  const grouped = new Map();

  (fonts || []).forEach(font => {
    const key = buildFontMergeKey(font);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(font);
  });

  const merged = [];

  grouped.forEach(group => {
    const ordered = [...group].sort((a, b) => getFontSortRank(b) - getFontSortRank(a));
    const primary = { ...ordered[0] };

    primary.title = pickLongestNonEmptyString(ordered.map(item => item.title)) || primary.title;
    primary.titleEn = pickLongestNonEmptyString(ordered.map(item => item.titleEn)) || primary.titleEn;
    primary.descriptionAr = pickLongestNonEmptyString(ordered.map(item => item.descriptionAr)) || '';
    primary.descriptionEn = pickLongestNonEmptyString(ordered.map(item => item.descriptionEn)) || '';
    primary.license = pickLongestNonEmptyString(ordered.map(item => item.license)) || '';
    primary.downloadUrl = pickFirstNonEmptyString(ordered.map(item => item.downloadUrl));
    primary.fontFile = pickFirstNonEmptyString(ordered.map(item => item.fontFile));

    primary.images = mergeUniqueText(ordered.map(item => safeJsonArray(item.images, []))).filter(isExistingAssetUrl);
    primary.weights = sortWeightList(
      mergeUniqueText(ordered.map(item => normalizeTextList(item.weights).map(resolveWeightName)))
    );
    primary.freeWeights = sortWeightList(
      mergeUniqueText(ordered.map(item => normalizeTextList(item.freeWeights).map(resolveWeightName)))
    );
    primary.paidWeights = sortWeightList(
      mergeUniqueText(ordered.map(item => normalizeTextList(item.paidWeights).map(resolveWeightName)))
    );

    primary.weightFiles = mergeWeightFilesMaps([...ordered].reverse().map(item => item.weightFiles));
    Object.keys(primary.weightFiles).forEach(weight => {
      if (!isExistingAssetUrl(primary.weightFiles[weight])) {
        delete primary.weightFiles[weight];
      }
    });

    if (!primary.weights.length) {
      primary.weights = sortWeightList(
        mergeUniqueText([
          Object.keys(primary.weightFiles),
          primary.freeWeights,
          primary.paidWeights
        ]).map(resolveWeightName)
      );
    }

    if (!isExistingAssetUrl(primary.fontFile)) {
      primary.fontFile = pickFirstNonEmptyString([
        primary.weightFiles.Regular,
        primary.weightFiles.Medium,
        primary.weightFiles.Bold,
        primary.weightFiles.Black,
        ...Object.values(primary.weightFiles)
      ]);
    }

    merged.push(primary);
  });

  return merged.sort((a, b) => getFontSortRank(b) - getFontSortRank(a));
}

function collectFontUploadFields(req) {
  const files = Array.isArray(req.files) ? req.files : [];
  const weightFieldMap = safeJsonObject(req.body?.weightFileFieldMap, {});

  const images = [];
  let fontFile = null;
  const uploadedWeightFiles = {};

  files.forEach(file => {
    if (!file || !file.fieldname) return;

    if (file.fieldname === 'images') {
      images.push('/uploads/' + file.filename);
      return;
    }

    if (file.fieldname === 'fontFile') {
      if (!fontFile) fontFile = file;
      return;
    }

    if (!String(file.fieldname).startsWith(WEIGHT_FILE_FIELD_PREFIX)) return;

    const mappedWeight = normalizeWeightLabel(weightFieldMap[file.fieldname]);
    const fallbackWeight = normalizeWeightLabel(
      String(file.fieldname).slice(WEIGHT_FILE_FIELD_PREFIX.length).replace(/[-_]+/g, ' ')
    );
    const weight = mappedWeight || fallbackWeight;
    if (!weight) return;

    uploadedWeightFiles[weight] = '/uploads/' + file.filename;
  });

  return { images, fontFile, uploadedWeightFiles };
}

async function buildContentPayloadFromDb() {
  const [soc, work, fnt] = await Promise.all([
    query('SELECT * FROM social_links ORDER BY sort_order'),
    query('SELECT * FROM work_links ORDER BY sort_order'),
    query('SELECT * FROM fonts ORDER BY created_at ASC')
  ]);

  const qahwaLibrary = buildQahwaAssetLibrary();
  const preparedFonts = fnt.rows
    .map(toFont)
    .map(font => applyQahwaLibraryToFont(font, qahwaLibrary));

  return {
    socialLinks: soc.rows.map(toLink),
    workLinks: work.rows.map(toLink),
    fonts: mergeFontsForPayload(preparedFonts)
  };
}

async function syncContentSnapshots() {
  try {
    const payload = await buildContentPayloadFromDb();
    const jsonText = JSON.stringify(payload, null, 2);
    const jsText = `window.__EMBEDDED_CONTENT__ = ${jsonText};\n`;

    fs.writeFileSync(path.join(__dirname, 'public', 'content.json'), jsonText, 'utf-8');
    fs.writeFileSync(path.join(__dirname, 'public', 'content.data.js'), jsText, 'utf-8');
  } catch (error) {
    console.error('Failed to sync content snapshots:', error);
  }
}

app.get('/api/content', async (req, res) => {
  try {
    res.json(await buildContentPayloadFromDb());
  } catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

app.put('/api/social-links', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM social_links');
    for (let i = 0; i < req.body.length; i++) {
      const l = req.body[i];
      await query('INSERT INTO social_links(id,platform,url,icon,icon_svg,sort_order) VALUES($1,$2,$3,$4,$5,$6)',
        [l.id, l.platform, l.url||'', l.icon||'default', l.iconSvg||'', i]);
    }
    await syncContentSnapshots();
    res.json({ success: true });
  } catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

app.put('/api/work-links', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM work_links');
    for (let i = 0; i < req.body.length; i++) {
      const l = req.body[i];
      await query('INSERT INTO work_links(id,platform,url,icon,icon_svg,sort_order) VALUES($1,$2,$3,$4,$5,$6)',
        [l.id, l.platform, l.url||'', l.icon||'default', l.iconSvg||'', i]);
    }
    await syncContentSnapshots();
    res.json({ success: true });
  } catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

/* ── FONTS ── */
app.post('/api/fonts', authMiddleware, fontUpload, async (req, res) => {
  try {
    const { title, titleEn, descriptionAr, descriptionEn, downloadUrl, weights, isPaid, license, freeWeights, paidWeights, weightFiles } = req.body;
    const { images, fontFile, uploadedWeightFiles } = collectFontUploadFields(req);
    const parsedWeightFiles = normalizeWeightFilesMap(weightFiles);
    const mergedWeightFiles = { ...parsedWeightFiles, ...uploadedWeightFiles };

    const pw = w => parseWeightCsv(w, []);

    const allowedWeights = new Set([
      ...pw(weights),
      ...pw(freeWeights),
      ...pw(paidWeights)
    ]);
    if (allowedWeights.size) {
      Object.keys(mergedWeightFiles).forEach(weight => {
        if (!allowedWeights.has(normalizeWeightLabel(weight))) {
          delete mergedWeightFiles[weight];
        }
      });
    }

    const id = Date.now();
    await query(`INSERT INTO fonts(id,title,title_en,description_ar,description_en,download_url,font_file,images,weights,is_paid,license,free_weights,paid_weights,weight_files,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id,title,titleEn||'',descriptionAr||'',descriptionEn||'',downloadUrl||'',
       fontFile?'/uploads/'+fontFile.filename:null,
       JSON.stringify(images),JSON.stringify(pw(weights)),isPaid==='true',
       license||'',JSON.stringify(pw(freeWeights)),JSON.stringify(pw(paidWeights)),
       JSON.stringify(mergedWeightFiles),new Date().toISOString()]);
     await syncContentSnapshots();
    res.json({ id, title, titleEn:titleEn||'', descriptionAr:descriptionAr||'', descriptionEn:descriptionEn||'',
      downloadUrl:downloadUrl||'', fontFile:fontFile?'/uploads/'+fontFile.filename:null,
      images, weights:pw(weights), isPaid:isPaid==='true', license:license||'',
      freeWeights:pw(freeWeights), paidWeights:pw(paidWeights),
      weightFiles: mergedWeightFiles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString() });
  } catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

app.put('/api/fonts/:id', authMiddleware, fontUpload, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, titleEn, descriptionAr, descriptionEn, downloadUrl, weights, isPaid, license, freeWeights, paidWeights, weightFiles, keepImages } = req.body;
    const { fontFile, images: newImages, uploadedWeightFiles } = collectFontUploadFields(req);
    const ex = await query('SELECT * FROM fonts WHERE id=$1', [id]);
    if (!ex.rows.length) return res.status(404).json({ error: 'Not found' });
    const f = ex.rows[0];

    const existingImages = safeJsonArray(f.images, []);
    const requestedKeepImages = safeJsonArray(keepImages, []);
    const baseImages = requestedKeepImages.length
      ? requestedKeepImages.filter(isExistingAssetUrl)
      : existingImages;
    const finalImages = mergeUniqueText([baseImages, newImages]).filter(isExistingAssetUrl);

    const pw = (w, fallback) => parseWeightCsv(w, fallback);
    const existingWeightFiles = normalizeWeightFilesMap(f.weight_files);
    const incomingWeightFiles = normalizeWeightFilesMap(weightFiles);
    const mergedWeightFiles = { ...existingWeightFiles, ...incomingWeightFiles, ...uploadedWeightFiles };

    const mergedWeights = pw(weights, f.weights);
    const mergedFreeWeights = pw(freeWeights, f.free_weights);
    const mergedPaidWeights = pw(paidWeights, f.paid_weights);
    const allowedWeights = new Set([
      ...mergedWeights,
      ...mergedFreeWeights,
      ...mergedPaidWeights
    ].map(normalizeWeightLabel));

    if (allowedWeights.size) {
      Object.keys(mergedWeightFiles).forEach(weight => {
        if (!allowedWeights.has(normalizeWeightLabel(weight))) {
          delete mergedWeightFiles[weight];
        }
      });
    }

    await query(`UPDATE fonts SET title=$1,title_en=$2,description_ar=$3,description_en=$4,download_url=$5,font_file=$6,images=$7,weights=$8,is_paid=$9,license=$10,free_weights=$11,paid_weights=$12,weight_files=$13,updated_at=NOW() WHERE id=$14`,
      [title, titleEn||'', descriptionAr||'', descriptionEn||'', downloadUrl||'',
       fontFile?'/uploads/'+fontFile.filename:f.font_file,
       JSON.stringify(finalImages),
       JSON.stringify(mergedWeights),
       isPaid!==undefined?isPaid==='true':f.is_paid, license||'',
       JSON.stringify(mergedFreeWeights),
       JSON.stringify(mergedPaidWeights),
       JSON.stringify(mergedWeightFiles),
       id]);
    await syncContentSnapshots();
    const updated = (await query('SELECT * FROM fonts WHERE id=$1', [id])).rows[0];
    res.json(toFont(updated));
  } catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

app.delete('/api/fonts/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM fonts WHERE id=$1', [req.params.id]);
    await syncContentSnapshots();
    res.json({ success: true });
  }
  catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Upload error: invalid file payload.' });
  }
  if (err && /invalid file payload|unsupported|file type/i.test(String(err.message || ''))) {
    return res.status(400).json({ error: 'Upload error: unsupported file type.' });
  }
  return next(err);
});

/* ── STATS ── */
async function getStats() {
  const r = await query("SELECT value FROM stats WHERE key='main'");
  const raw = r.rows[0]?.value || {};
  return {
    totalVisits: raw.totalVisits || 0,
    todayDate: raw.todayDate || '',
    todayVisits: raw.todayVisits || 0,
    fontViews: raw.fontViews || {},
    fontDownloads: raw.fontDownloads || {},
    downloadersByFont: raw.downloadersByFont || {},
    recentDownloads: Array.isArray(raw.recentDownloads) ? raw.recentDownloads : [],
    updatedAt: raw.updatedAt || ''
  };
}
async function saveStats(s) {
  if (!s.fontDownloads) s.fontDownloads = {};
  if (!s.fontViews) s.fontViews = {};
  if (!s.downloadersByFont) s.downloadersByFont = {};
  if (!Array.isArray(s.recentDownloads)) s.recentDownloads = [];
  s.updatedAt = new Date().toISOString();
  await query("UPDATE stats SET value=$1 WHERE key='main'", [JSON.stringify(s)]);
}

  app.get('/api/visitor-count', async (req, res) => {
    try {
      const s = await getStats();
      res.json({ totalVisits: s.totalVisits || 0 });
    } catch {
      res.json({ totalVisits: 0 });
    }
  });
  
  app.post('/api/track-visit', async (req, res) => {
  try {
    const s = await getStats(); const today = new Date().toISOString().slice(0,10);
    if (s.todayDate !== today) { s.todayDate = today; s.todayVisits = 0; }
    s.totalVisits = (s.totalVisits||0)+1; s.todayVisits = (s.todayVisits||0)+1;
    await saveStats(s); res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

app.post('/api/track-font/:id', async (req, res) => {
  try {
    const s = await getStats();
    if (!s.fontViews) s.fontViews = {};
    s.fontViews[req.params.id] = (s.fontViews[req.params.id]||0)+1;
    await saveStats(s); res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

app.post('/api/track-download/:id', async (req, res) => {
  try {
    const rawName = String(req.body?.name || '').trim();
    const safeName = rawName.replace(/\s+/g, ' ').slice(0, 60);
    const s = await getStats();
    if (!s.fontDownloads) s.fontDownloads = {};
    s.fontDownloads[req.params.id] = (s.fontDownloads[req.params.id]||0)+1;

    if (safeName) {
      const list = Array.isArray(s.downloadersByFont?.[req.params.id]) ? s.downloadersByFont[req.params.id] : [];
      if (!list.includes(safeName)) {
        list.push(safeName);
        s.downloadersByFont[req.params.id] = list.slice(-120);
      }

      s.recentDownloads.push({
        fontId: String(req.params.id),
        name: safeName,
        at: new Date().toISOString()
      });
      s.recentDownloads = s.recentDownloads.slice(-300);
    }

    await saveStats(s); res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

app.get('/api/font-stats-public', async (req, res) => {
  try {
    const [sr, fr] = await Promise.all([
      query("SELECT value FROM stats WHERE key='main'"),
      query('SELECT id FROM fonts')
    ]);

    const s = sr.rows[0]?.value || { fontViews:{}, fontDownloads:{}, downloadersByFont:{} };
    const byId = {};

    fr.rows.forEach(row => {
      const id = String(row.id);
      byId[id] = {
        views: Number(s.fontViews?.[id] || 0),
        downloads: Number(s.fontDownloads?.[id] || 0),
        uniqueDownloaders: Array.isArray(s.downloadersByFont?.[id]) ? s.downloadersByFont[id].length : 0
      };
    });

    res.json({ byId, updatedAt: s.updatedAt || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const [sr, fr] = await Promise.all([
      query("SELECT value FROM stats WHERE key='main'"),
      query('SELECT id,title,title_en FROM fonts')
    ]);
    const s = sr.rows[0]?.value || {
      totalVisits:0,
      todayDate:'',
      todayVisits:0,
      fontViews:{},
      fontDownloads:{},
      downloadersByFont:{},
      recentDownloads:[]
    };
    const today = new Date().toISOString().slice(0,10);
    if (s.todayDate !== today) s.todayVisits = 0;

    const titleById = Object.fromEntries(fr.rows.map(row => [String(row.id), row.title]));

    const fontViews = fr.rows.map(f => ({
      id: Number(f.id), title: f.title, en: f.title_en||'',
      views: s.fontViews?.[String(f.id)]||0,
      downloads: s.fontDownloads?.[String(f.id)]||0,
      uniqueDownloaders: Array.isArray(s.downloadersByFont?.[String(f.id)]) ? s.downloadersByFont[String(f.id)].length : 0
    })).sort((a,b) => b.views - a.views);

    const totalFontViews = fontViews.reduce((sum, item) => sum + Number(item.views || 0), 0);
    const totalDownloads = fontViews.reduce((sum, item) => sum + Number(item.downloads || 0), 0);
    const conversionRate = totalFontViews ? Number(((totalDownloads / totalFontViews) * 100).toFixed(1)) : 0;

    const recentDownloads = (Array.isArray(s.recentDownloads) ? s.recentDownloads : [])
      .slice(-30)
      .reverse()
      .map(item => ({
        fontId: Number(item.fontId || 0),
        fontTitle: titleById[String(item.fontId)] || '—',
        name: String(item.name || '—'),
        at: item.at || ''
      }));

    res.json({
      totalVisits: s.totalVisits || 0,
      todayVisits: s.todayVisits || 0,
      totalFontViews,
      totalDownloads,
      conversionRate,
      fontViews,
      recentDownloads
    });
  } catch(e) { console.error(e); res.status(500).json({ error: 'DB error' }); }
});

app.use((req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

/* ── START ── */
initDB().then(() => {
  console.log(`[storage] mode=${STORAGE_MODE}${USE_POSTGRES ? '' : ` file=${LOCAL_STORE_PATH}`}`);
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  if (PORT !== 80) {
    app.listen(80, '0.0.0.0', () => console.log('Server also running on port 80'))
       .on('error', () => console.log('Port 80 not available'));
  }
}).catch(e => { console.error('DB init failed:', e); process.exit(1); });
