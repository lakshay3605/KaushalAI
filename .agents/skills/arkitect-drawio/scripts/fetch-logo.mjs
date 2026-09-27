#!/usr/bin/env node
// Fetch third-party product logos (Snowflake, Streamlit, Pinecone, Grafana, ...)
// and keep them in a local cache so diagrams can embed them the same way AWS
// icons are embedded.
//
//   node fetch-logo.mjs --url <url> --name snowflake [--force]
//   node fetch-logo.mjs --list
//   node fetch-logo.mjs --inspect snowflake
//   node fetch-logo.mjs --cell snowflake --label "Snowflake" --x 0 --y 0 [--size 64]
//
// The AWS icon library comes first - this is only for products it does not
// cover. Only the logo URL is ever requested; nothing about the diagram, the
// customer or the architecture leaves the machine.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { sha256, parseDataUri, imageDimensions, fitCell } from './lib/drawio-core.mjs';
import { cacheDir, mergedRegistry } from './lib/store.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
export const LOGO_DIR = cacheDir('drawio', 'logos');
// Where logos were cached before #257: still read, never written.
export const LEGACY_LOGO_DIR = join(SKILL_ROOT, 'assets', 'logos');
const INDEX_FILE = join(LOGO_DIR, 'index.json');

const MAX_BYTES = 2 * 1024 * 1024;
// Vendor logos sit at 60-64px in the reference corpus, smaller than the 78px
// AWS service icons.
export const DEFAULT_LOGO_SIZE = 64;

const EXT = { 'image/png': '.png', 'image/svg+xml': '.svg', 'image/webp': '.webp', 'image/jpeg': '.jpg' };

function sniff(bytes) {
  if (bytes.length > 8 && bytes.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (bytes.length > 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  const head = bytes.subarray(0, 512).toString('utf8').trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
  return null;
}

// PNG colour type lives in IHDR: 4 and 6 carry an alpha channel outright, 3 is
// palette and only transparent when a tRNS chunk is present.
export function pngTransparency(bytes) {
  if (bytes.length < 26 || bytes.readUInt32BE(0) !== 0x89504e47) return { alpha: null, note: 'not a png' };
  const colorType = bytes[25];
  if (colorType === 6 || colorType === 4) return { alpha: true, note: 'alpha channel' };
  if (colorType === 3) {
    const hasTrns = bytes.includes(Buffer.from('tRNS', 'ascii'));
    return { alpha: hasTrns, note: hasTrns ? 'palette with tRNS' : 'opaque palette' };
  }
  return { alpha: false, note: colorType === 2 ? 'opaque RGB' : 'opaque greyscale' };
}

export function svgTransparency(bytes) {
  const s = bytes.toString('utf8');
  // A full-canvas rect or a painted background defeats transparency.
  const opaqueBg = /<rect[^>]*\bwidth\s*=\s*"100%"[^>]*>/i.test(s)
    || /\bstyle\s*=\s*"[^"]*background(-color)?\s*:\s*(?!none|transparent)/i.test(s);
  return { alpha: !opaqueBg, note: opaqueBg ? 'has a background rect' : 'no background fill' };
}

export function transparency(mime, bytes) {
  if (mime === 'image/png') return pngTransparency(bytes);
  if (mime === 'image/svg+xml') return svgTransparency(bytes);
  return { alpha: false, note: `${mime} has no alpha channel` };
}

function readIndexAt(dir) {
  const file = join(dir, 'index.json');
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function loadIndex() {
  return mergedRegistry(readIndexAt, [LOGO_DIR, LEGACY_LOGO_DIR]);
}

function saveIndex(index) {
  mkdirSync(LOGO_DIR, { recursive: true });
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2) + '\n');
}

export function normalizeName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Cache a logo from bytes already in hand. Separated from the network path so
// it can be tested offline and so a manually downloaded file can be adopted.
export function storeLogo(name, bytes, { source = 'local', force = false } = {}) {
  const key = normalizeName(name);
  if (!key) throw new Error('a logo needs a name');
  if (bytes.length > MAX_BYTES) throw new Error(`too large: ${bytes.length} bytes (limit ${MAX_BYTES})`);

  const mime = sniff(bytes);
  if (!mime) throw new Error('not a recognised image (png, svg, webp or jpeg expected)');

  if (loadIndex()[key] && !force) throw new Error(`"${key}" is already cached; pass --force to replace it`);
  const index = readIndexAt(LOGO_DIR);

  mkdirSync(LOGO_DIR, { recursive: true });
  for (const old of readdirSync(LOGO_DIR)) {
    if (old.startsWith(`${key}.`) && old !== 'index.json') unlinkSync(join(LOGO_DIR, old));
  }

  const file = `${key}${EXT[mime] ?? '.bin'}`;
  writeFileSync(join(LOGO_DIR, file), bytes);

  const dims = imageDimensions(mime, bytes);
  const trans = transparency(mime, bytes);
  index[key] = {
    name: key, file, mime, bytes: bytes.length,
    width: dims.width, height: dims.height,
    transparent: trans.alpha, transparencyNote: trans.note,
    sha256: sha256(bytes), source, fetched: new Date().toISOString(),
  };
  saveIndex(index);
  return index[key];
}

export async function fetchLogo(name, url, { force = false } = {}) {
  if (!/^https:\/\//i.test(url)) throw new Error('only https URLs are accepted');
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'arkitect-drawio/1.0 (+diagram icon fetch)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  return storeLogo(name, bytes, { source: url, force });
}

export function getLogo(name) {
  const key = normalizeName(name);
  const entry = loadIndex()[key];
  if (!entry) return null;
  const path = join(entry.dir, entry.file);
  if (!existsSync(path)) return null;
  return { ...entry, path, bytes: readFileSync(path) };
}

// Comma-only data URI: `;` terminates a draw.io style, so the standard
// `data:<mime>;base64,` form would be cut in half by the style parser.
export function logoDataUri(entry) {
  return `data:${entry.mime},${entry.bytes.toString('base64')}`;
}

// The same rule a pack mark gets (#76): a wordmark keeps its aspect, but its
// short side never drops below a third of `size`. Fitting only the longest
// side drew a 4:1 logo 64x16 (#254).
export function logoBox(entry, size = DEFAULT_LOGO_SIZE) {
  return fitCell(entry.width, entry.height, size);
}

export const LOGO_STYLE = 'shape=image;html=1;verticalLabelPosition=bottom;verticalAlign=top;'
  + 'labelBackgroundColor=none;imageAspect=0;aspect=fixed;fontSize=12;fontColor=#232F3E;';

export function logoStyle(entry) {
  return `${LOGO_STYLE}image=${logoDataUri(entry)};`;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function report(entry) {
  return {
    name: entry.name, mime: entry.mime, size: `${entry.width}x${entry.height}`,
    bytes: entry.bytes.length ?? entry.bytes,
    transparent: entry.transparent, note: entry.transparencyNote,
    sha256: (entry.sha256 ?? '').slice(0, 16),
    warning: entry.transparent ? undefined
      : 'Opaque background - it will show as a white or coloured box on the canvas. Prefer a transparent PNG or an SVG.',
  };
}

async function main(argv) {
  const flag = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };

  if (argv[0] === '--list') {
    const index = loadIndex();
    const rows = Object.values(index).map((e) => ({
      name: e.name, mime: e.mime, size: `${e.width}x${e.height}`,
      transparent: e.transparent, source: e.source,
    }));
    console.log(JSON.stringify(rows.length ? rows : { cached: 0, hint: 'node fetch-logo.mjs --url <https url> --name <product>' }, null, 2));
    return;
  }

  if (argv[0] === '--inspect') {
    const e = getLogo(argv[1]);
    if (!e) { console.error(`no cached logo "${argv[1]}"`); process.exit(1); }
    console.log(JSON.stringify(report(e), null, 2));
    return;
  }

  if (argv[0] === '--cell') {
    const e = getLogo(argv[1]);
    if (!e) { console.error(`no cached logo "${argv[1]}" - fetch it first`); process.exit(1); }
    const box = logoBox(e, flag('--size') ? Number(flag('--size')) : DEFAULT_LOGO_SIZE);
    const label = flag('--label') ?? e.name;
    const id = flag('--id') ?? `logo-${e.name}`;
    process.stdout.write(
      `<mxCell id="${esc(id)}" value="${esc(label)}" style="${esc(logoStyle(e))}" vertex="1" parent="1">\n`
      + `  <mxGeometry x="${flag('--x') ?? 0}" y="${flag('--y') ?? 0}" width="${box.width}" height="${box.height}" as="geometry" />\n`
      + '</mxCell>');
    return;
  }

  const url = flag('--url');
  const name = flag('--name');
  const file = flag('--file');
  if ((!url && !file) || !name) {
    console.error('usage: fetch-logo.mjs --url <https url> --name <product> [--force]\n'
      + '       fetch-logo.mjs --file <path> --name <product> [--force]\n'
      + '       fetch-logo.mjs --list | --inspect <name> | --cell <name> [--label X --x N --y N --size N]');
    process.exit(2);
  }

  try {
    const entry = file
      ? storeLogo(name, readFileSync(file), { source: `file:${file}`, force: argv.includes('--force') })
      : await fetchLogo(name, url, { force: argv.includes('--force') });
    console.log(JSON.stringify({ cached: entry.file, ...report({ ...entry, bytes: { length: entry.bytes } }) }, null, 2));
  } catch (e) {
    console.error(`failed: ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('fetch-logo.mjs')) main(process.argv.slice(2));
