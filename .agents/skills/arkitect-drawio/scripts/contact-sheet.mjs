#!/usr/bin/env node
// Render an icon pack as a labelled grid, so a human can see what actually got
// built. Structural checks prove a library parses and hashes; they cannot
// notice that "Cloud Run" is wearing Cloud Scheduler's artwork. That needs eyes.
//
//   node contact-sheet.mjs --pack devops                   write the HTML sheet
//   node contact-sheet.mjs --pack devops --png             rasterise it instead
//   node contact-sheet.mjs --pack devops --png --keep-html ...and keep the HTML
//   node contact-sheet.mjs --all --png                     every pack worth reviewing
//   node contact-sheet.mjs --pack azure --review           review pages + the record's status
//   node contact-sheet.mjs --pack azure --review --page 3  just one page
//
// The HTML is local and self-contained: every icon is already a data URI in the
// library, so nothing is fetched while the sheet renders.
//
// Chrome needs a profile directory, and a profile holds cookies, history and
// login data. It lives in a temporary directory that is removed after every
// shot, pass or fail, so the only thing a PNG run adds to the skill is the PNG.

import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { readLibrary } from './lib/drawio-core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
const LIB_DIR = join(SKILL_ROOT, 'assets', 'libraries');
const SHEET_DIR = join(LIB_DIR, 'contact-sheets');
const CATALOG_FILE = join(SKILL_ROOT, 'references', 'icon-catalog.json');
export const RECORD_DIR = join(LIB_DIR, 'reviews');
// Six across and nine down keeps every mark big enough to judge, and a caption
// long enough to hold the upstream file it came from.
const REVIEW_PER_PAGE = 54;
const REVIEW_COLUMNS = 6;

// The catch-all is 3,000+ marks from one CC0 source at a pinned version; a sheet
// of it would be megabytes of PNG telling you what the pin already tells you.
const SKIP = new Set(['brands']);

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHROME_TIMEOUT = 120000;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sheetHtml(pack, entries) {
  const cells = entries.map((e, i) => `<figure><img src="${e.dataUri}" alt="${esc(e.title)}">`
    + `<figcaption><b>${esc(e.title)}</b><span>${i}</span></figcaption></figure>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>${esc(pack.title)} contact sheet</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 28px 32px 40px; background: #fff;
         font: 13px/1.45 "Segoe UI", system-ui, sans-serif; color: #1b2733; }
  header { margin-bottom: 22px; border-bottom: 2px solid #e3e9ef; padding-bottom: 14px; }
  h1 { margin: 0 0 4px; font-size: 20px; letter-spacing: -0.01em; }
  .meta { color: #5b6b7c; font-size: 12.5px; }
  .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px 10px; }
  figure { margin: 0; display: flex; flex-direction: column; align-items: center;
           gap: 6px; padding: 10px 4px 8px; border: 1px solid #edf1f5; border-radius: 8px; }
  img { width: 56px; height: 56px; object-fit: contain; }
  figcaption { text-align: center; font-size: 10.5px; line-height: 1.3; color: #35485c;
               word-break: break-word; display: flex; flex-direction: column; gap: 1px; }
  figcaption span { color: #9aa8b6; font-size: 9px; }
</style>
<header><h1>${esc(pack.title)}</h1>
<div class="meta">${entries.length} icons &middot; <code>${esc(pack.file)}</code> &middot; ${esc(pack.description ?? '')}</div></header>
<div class="grid">${cells}</div>`;
}

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (existsSync(p)) return p;
  return null;
}

const runChrome = (exe, args) => execFileSync(exe, args, { stdio: 'pipe', timeout: CHROME_TIMEOUT });

// Older versions kept Chrome's profile here. Nothing uses it now; say so, but
// never delete a directory this run did not create.
export function staleProfile(sheetDir = SHEET_DIR) {
  const legacy = join(sheetDir, '.shot');
  return existsSync(legacy) ? legacy : null;
}

// Screenshot the sheet into a scratch directory and copy it over `pngPath` only
// once it is a real PNG. A crash, a timeout or an empty screenshot leaves the
// previous sheet exactly as it was, and can never pass for a fresh one.
export function rasterise(html, pngPath, height, { chrome, runner = runChrome } = {}) {
  const work = mkdtempSync(join(tmpdir(), 'arkitect-sheet-'));
  try {
    const htmlPath = join(work, 'sheet.html');
    const shot = join(work, 'sheet.png');
    writeFileSync(htmlPath, html);
    try {
      runner(chrome, [
        '--headless', '--disable-gpu', '--hide-scrollbars',
        `--screenshot=${shot}`,
        `--window-size=1600,${Math.min(height, 30000)}`,
        `--user-data-dir=${join(work, 'profile')}`,
        pathToFileURL(htmlPath).href,
      ]);
    } catch (error) {
      const timedOut = error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM';
      return { ok: false, error: timedOut ? `Chrome timed out after ${CHROME_TIMEOUT / 1000}s` : `Chrome failed: ${String(error.message).split('\n')[0]}` };
    }
    if (!existsSync(shot)) return { ok: false, error: 'Chrome exited without writing a screenshot' };
    const bytes = readFileSync(shot);
    if (bytes.length <= PNG_SIGNATURE.length || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      return { ok: false, error: 'the screenshot is empty or not a PNG' };
    }
    copyFileSync(shot, pngPath);
    return { ok: true };
  } finally {
    // Chrome's helpers can hold the profile open for a moment after it exits.
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
}

export function build(packId, { png = false, keepHtml = false, sheetDir = SHEET_DIR, chrome = findChrome(), runner } = {}) {
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  const pack = catalog.packs.find((p) => p.id === packId);
  if (!pack) throw new Error(`no pack "${packId}" in the catalog`);

  const entries = readLibrary(join(LIB_DIR, pack.file));
  const html = sheetHtml(pack, entries);
  mkdirSync(sheetDir, { recursive: true });
  const result = { pack, count: entries.length, htmlPath: null, pngPath: null, error: null, note: null };
  const writeHtml = () => { result.htmlPath = join(sheetDir, `${packId}.html`); writeFileSync(result.htmlPath, html); };

  // Without --png the HTML is what was asked for.
  if (!png) { writeHtml(); return result; }
  if (!chrome) {
    writeHtml();
    result.note = 'no Chrome found - open the HTML yourself to review it';
    return result;
  }

  // 12 across, ~104px per row, plus the header.
  const height = 140 + Math.ceil(entries.length / 12) * 104;
  const pngPath = join(sheetDir, `${packId}.png`);
  const shot = rasterise(html, pngPath, height, { chrome, runner });
  if (shot.ok) result.pngPath = pngPath;
  else result.error = shot.error;
  if (keepHtml) writeHtml();
  return result;
}

// ------------------------------------------------------------- review record
//
// A sheet shows what shipped; it cannot say who looked, at which artwork, or
// what they concluded. The record in libraries/reviews/<pack>.json does: one
// row per shipped id, pinned to the sha256 of the payload that was reviewed.
// A rebuild that changes a mark re-opens exactly that entry, and an entry
// nobody looked at stays visibly unchecked rather than hiding inside a sheet
// someone once glanced at (#18).

export function readRecord(packId, recordDir = RECORD_DIR) {
  const file = join(recordDir, `${packId}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

// Every shipped entry in library order, with the state the record gives it:
// ok or mismatch as recorded, stale when the artwork changed since, unchecked
// when there is no row. Record rows for ids that no longer ship are orphaned.
export function reviewStatus(packId, { recordDir = RECORD_DIR } = {}) {
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  const pack = catalog.packs.find((p) => p.id === packId);
  if (!pack) throw new Error(`no pack "${packId}" in the catalog`);
  const library = readLibrary(join(LIB_DIR, pack.file));
  const record = readRecord(packId, recordDir)?.entries ?? {};
  const rows = catalog.icons
    .filter((i) => i.pack === packId && i.bytes === 'committed')
    .sort((a, b) => a.libraryIndex - b.libraryIndex)
    .map((i) => {
      const e = library[i.libraryIndex];
      const r = record[i.id];
      const state = !r ? 'unchecked' : r.sha256 !== e.hash ? 'stale' : r.verdict;
      return {
        id: i.id, title: e.title, upstreamId: i.upstreamId ?? null, index: i.libraryIndex,
        sha256: e.hash, dataUri: e.dataUri, state, note: r?.note ?? null,
      };
    });
  const shipped = new Set(rows.map((r) => r.id));
  const inState = (s) => rows.filter((r) => r.state === s).map((r) => r.id);
  return {
    pack, rows,
    ok: inState('ok'), mismatch: inState('mismatch'), stale: inState('stale'), unchecked: inState('unchecked'),
    unknown: rows.filter((r) => !['ok', 'mismatch', 'stale', 'unchecked'].includes(r.state)).map((r) => r.id),
    orphaned: Object.keys(record).filter((id) => !shipped.has(id)),
  };
}

function reviewHtml(status, pageNo, pageCount, rows) {
  const cells = rows.map((r) => `<figure class="${esc(r.state)}"><img src="${r.dataUri}" alt="${esc(r.title)}">`
    + `<figcaption><b>${esc(r.title)}</b><code>${esc(r.id)}</code>`
    + `<span>${esc(basename(String(r.upstreamId ?? '')))}</span>`
    + `<span>#${r.index} &middot; ${r.sha256.slice(0, 12)} &middot; <em>${esc(r.state)}</em></span>`
    + `${r.note ? `<i>${esc(r.note)}</i>` : ''}</figcaption></figure>`).join('');
  const s = status;
  return `<!doctype html><meta charset="utf-8"><title>${esc(s.pack.title)} review ${pageNo}/${pageCount}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 24px 28px 32px; background: #fff;
         font: 13px/1.4 "Segoe UI", system-ui, sans-serif; color: #1b2733; }
  header { margin-bottom: 18px; border-bottom: 2px solid #e3e9ef; padding-bottom: 12px; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .meta { color: #5b6b7c; font-size: 12.5px; }
  .grid { display: grid; grid-template-columns: repeat(${REVIEW_COLUMNS}, 1fr); gap: 12px; }
  figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px;
           padding: 14px 8px 10px; border: 2px solid #edf1f5; border-radius: 8px; }
  figure.unchecked { border-color: #f0c98a; background: #fffaf2; }
  figure.stale, figure.mismatch { border-color: #e8a19b; background: #fff5f4; }
  img { width: 120px; height: 120px; object-fit: contain; }
  figcaption { text-align: center; display: flex; flex-direction: column; gap: 2px;
               font-size: 11.5px; word-break: break-word; }
  figcaption b { font-size: 13px; }
  figcaption code { color: #35485c; font-size: 11px; }
  figcaption span { color: #7a8998; font-size: 10.5px; }
  figcaption i { color: #8a4b00; font-size: 10.5px; }
</style>
<header><h1>${esc(s.pack.title)} review &middot; page ${pageNo} of ${pageCount}</h1>
<div class="meta">${s.rows.length} shipped &middot; ${s.ok.length} ok &middot; ${s.mismatch.length} mismatch &middot; `
    + `${s.stale.length} stale &middot; ${s.unchecked.length} unchecked &middot; <code>reviews/${esc(s.pack.id)}.json</code></div></header>
<div class="grid">${cells}</div>`;
}

// Every page of a pack, or one, into contact-sheets/review/ (gitignored): the
// pages are what a reviewer looks at, the record is what they concluded.
export function buildReview(packId, { page = null, sheetDir = SHEET_DIR, recordDir = RECORD_DIR, chrome = findChrome(), runner } = {}) {
  const status = reviewStatus(packId, { recordDir });
  const pageCount = Math.ceil(status.rows.length / REVIEW_PER_PAGE);
  if (page !== null && !(Number.isInteger(page) && page >= 1 && page <= pageCount)) {
    throw new Error(`${packId} has ${pageCount} review page${pageCount === 1 ? '' : 's'}; there is no page ${page}`);
  }
  const dir = join(sheetDir, 'review');
  mkdirSync(dir, { recursive: true });
  const pages = [];
  for (let n = 1; n <= pageCount; n++) {
    if (page !== null && n !== page) continue;
    const rows = status.rows.slice((n - 1) * REVIEW_PER_PAGE, n * REVIEW_PER_PAGE);
    const html = reviewHtml(status, n, pageCount, rows);
    const name = `${packId}-${String(n).padStart(2, '0')}`;
    const result = { page: n, first: rows[0].index, last: rows.at(-1).index, pngPath: null, htmlPath: null, error: null };
    if (!chrome) {
      result.htmlPath = join(dir, `${name}.html`);
      writeFileSync(result.htmlPath, html);
    } else {
      const pngPath = join(dir, `${name}.png`);
      const shot = rasterise(html, pngPath, 170 + Math.ceil(rows.length / REVIEW_COLUMNS) * 250, { chrome, runner });
      if (shot.ok) result.pngPath = pngPath;
      else result.error = shot.error;
    }
    pages.push(result);
  }
  return { status, pageCount, pages };
}

function reviewMain(argv) {
  const packId = argv[argv.indexOf('--pack') + 1];
  const pageAt = argv.indexOf('--page');
  const page = pageAt === -1 ? null : Number(argv[pageAt + 1]);
  if (!argv.includes('--pack') || !packId || packId.startsWith('--')) {
    console.error('usage: contact-sheet.mjs --pack <id> --review [--page N]');
    process.exit(2);
  }
  let out;
  try {
    out = buildReview(packId, { page });
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(2);
  }
  const s = out.status;
  console.log(`${packId}: ${s.rows.length} shipped - ${s.ok.length} ok, ${s.mismatch.length} mismatch, `
    + `${s.stale.length} stale, ${s.unchecked.length} unchecked${s.orphaned.length ? `, ${s.orphaned.length} orphaned record rows` : ''}`);
  for (const [label, ids] of [['mismatch', s.mismatch], ['stale', s.stale], ['orphaned', s.orphaned]]) {
    if (ids.length) console.log(`  ${label}: ${ids.join(', ')}`);
  }
  let failed = 0;
  for (const p of out.pages) {
    const range = `#${p.first}-#${p.last}`.padEnd(12);
    if (p.error) failed++;
    const wrote = p.pngPath ?? p.htmlPath;
    console.log(`  page ${String(p.page).padStart(2, '0')}  ${range} ${p.error ? `FAILED: ${p.error}` : `-> contact-sheets/review/${basename(wrote)}`}`);
  }
  if (!out.pages.some((p) => p.pngPath) && out.pages.some((p) => p.htmlPath)) console.log('  (no Chrome found - open the HTML pages yourself)');
  if (failed) process.exit(1);
}

function main(argv) {
  if (argv.includes('--review')) return reviewMain(argv);
  const png = argv.includes('--png');
  const keepHtml = argv.includes('--keep-html');
  const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  const ids = argv.includes('--all')
    ? catalog.packs.map((p) => p.id).filter((id) => !SKIP.has(id))
    : [argv[argv.indexOf('--pack') + 1]].filter(Boolean);

  if (!ids.length) {
    console.error('usage: contact-sheet.mjs (--pack <id> | --all) [--png [--keep-html]]');
    process.exit(2);
  }

  const stale = staleProfile();
  if (stale) {
    console.warn(`warning: ${stale} is a Chrome profile (cookies, history, login data) left by an older\n`
      + '         contact-sheet.mjs. Nothing uses it any more - delete it.\n');
  }

  let failed = 0;
  for (const id of ids) {
    const r = build(id, { png, keepHtml });
    const head = `  ${id.padEnd(26)} ${String(r.count).padStart(5)} icons  -> `;
    if (r.error) {
      failed++;
      console.log(`${head}FAILED: ${r.error}`);
      continue;
    }
    const wrote = [r.pngPath, r.htmlPath].filter(Boolean).map((p) => `contact-sheets/${basename(p)}`);
    console.log(`${head}${wrote.join(' + ')}${r.note ? `  (${r.note})` : ''}`);
  }
  if (SKIP.size && argv.includes('--all')) {
    console.log(`\nskipped: ${[...SKIP].join(', ')} (catch-all packs, see sources.json for the pin)`);
  }
  if (failed) {
    console.error(`\n${failed} sheet${failed === 1 ? '' : 's'} failed; the existing PNG for each is unchanged.`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('contact-sheet.mjs')) main(process.argv.slice(2));
