// Cleanup script: removes RSS feeds from sources/*/config.json
// when they appear more than a threshold in invalidUrls.json.
// Usage: node sources/cleanup-invalid-feeds.js [--threshold 24]

const fs = require('fs').promises;
const path = require('path');

const SOURCES_DIR = __dirname;
const INVALID_PATH = path.join(SOURCES_DIR, 'invalidUrls.json');
const DEFAULT_THRESHOLD = 24;

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { threshold: DEFAULT_THRESHOLD };
  const idx = args.indexOf('--threshold');
  if (idx !== -1 && args[idx + 1]) {
    const n = Number(args[idx + 1]);
    if (!Number.isNaN(n) && n > 0) result.threshold = n;
  }
  return result;
}

function normalizeUrl(u) {
  try {
    if (!u) return '';
    // Trim, remove trailing slashes, lower-case scheme+host only
    const t = String(u).trim();
    // Remove trailing slashes
    const noSlash = t.replace(/\/+$/, '');
    // Try URL parsing to normalize host
    const parsed = new URL(noSlash);
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.protocol = parsed.protocol.toLowerCase();
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    // Fallback: basic trim/remove trailing slash
    return String(u || '').trim().replace(/\/+$/, '');
  }
}

async function readJson(p, fallback) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(p, obj) {
  await fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n');
}

async function listConfigFiles() {
  const entries = await fs.readdir(SOURCES_DIR, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const cfg = path.join(SOURCES_DIR, e.name, 'config.json');
    try {
      await fs.access(cfg);
      files.push(cfg);
    } catch {}
  }
  return files;
}

async function main() {
  const { threshold } = parseArgs();
  const invalid = await readJson(INVALID_PATH, []);
  if (!Array.isArray(invalid) || invalid.length === 0) {
    console.log('No invalidUrls.json entries to process.');
    return;
  }

  // Build a map of target URLs above threshold, with category/name if available
  const targets = new Map();
  for (const entry of invalid) {
    if (!entry || typeof entry !== 'object') continue;
    const { url, count } = entry;
    if (!url || typeof count !== 'number') continue;
    if (count > threshold) {
      const key = normalizeUrl(url);
      if (!key) continue;
      targets.set(key, entry);
    }
  }

  if (targets.size === 0) {
    console.log(`Nothing above threshold (${threshold}).`);
    return;
  }

  const cfgFiles = await listConfigFiles();
  let removedTotal = 0;
  for (const cfgPath of cfgFiles) {
    const cfg = await readJson(cfgPath, null);
    if (!cfg || !Array.isArray(cfg.feeds)) continue;
    const before = cfg.feeds.length;
    const originalFeeds = cfg.feeds;
    const kept = [];
    const removed = [];
    for (const f of originalFeeds) {
      const u = normalizeUrl(f && f.url);
      if (u && targets.has(u)) {
        removed.push(f);
      } else {
        kept.push(f);
      }
    }
    if (removed.length > 0) {
      cfg.feeds = kept;
      await writeJson(cfgPath, cfg);
      removedTotal += removed.length;
      console.log(`Updated ${path.relative(SOURCES_DIR, cfgPath)}: removed ${removed.length} invalid feed(s).`);
      removed.forEach(r => {
        const t = targets.get(normalizeUrl(r.url));
        const info = t ? `count=${t.count}, lastError=${t.lastError || ''}` : '';
        console.log(`  - ${r.name || ''} :: ${r.url} ${info}`);
      });
    }
  }

  if (removedTotal === 0) {
    console.log('No matching invalid URLs found in configs.');
  } else {
    console.log(`Done. Removed ${removedTotal} feed(s) across configs (threshold=${threshold}).`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
}

