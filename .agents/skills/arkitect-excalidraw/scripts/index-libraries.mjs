#!/usr/bin/env node
// Index the Excalidraw libraries bundled with this plugin.
//
//   node index-libraries.mjs --build          compact the bundled libraries, then rebuild
//                                             assets/libraries/bundled/index.json
//   node index-libraries.mjs --stats
//   node index-libraries.mjs --list           one line per library
//   node index-libraries.mjs --items <slug>   the item names in one library
//   node index-libraries.mjs --unnamed        libraries whose items cannot be searched by name
//
// The bundled set is the primary source of marks for a diagram. It is 11MB of
// JSON across three dozen files, so nothing searches it directly: this writes a
// flat index of names and sizes - no element payloads - and find-icon.mjs reads
// only that. A query then costs one small file read instead of parsing every
// library.
//
// Rebuild after adding or removing a .excalidrawlib. A test fails if the index
// and the files disagree, or if a library still carries formatting whitespace.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { dirname, join, basename } from 'node:path';
import { readLibrary, bbox, normalizeName, writeScene } from './lib/excalidraw-core.mjs';
import { contactSheet } from './browse-libraries.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
export const BUNDLED_DIR = join(SKILL_ROOT, 'assets', 'libraries', 'bundled');
export const BUNDLED_INDEX = join(BUNDLED_DIR, 'index.json');
// Credits, matched against libraries.excalidraw.com once and committed. The
// .excalidrawlib files carry no author of their own, and the indexer must work
// offline, so this is a checked-in file rather than a lookup.
const AUTHORS_FILE = join(BUNDLED_DIR, 'authors.json');

// An item with no name is reachable only by its position, and choosing one means
// looking at a contact sheet. Worth knowing which libraries are like that.
function captionOf(elements) {
  const texts = (elements ?? []).filter((el) => el.type === 'text' && el.text && !el.isDeleted);
  if (!texts.length) return null;
  const best = texts.reduce((a, b) => ((b.fontSize ?? 0) > (a.fontSize ?? 0) ? b : a));
  return String(best.text).replace(/\s+/g, ' ').trim().slice(0, 60) || null;
}

function libraryFiles() {
  if (!existsSync(BUNDLED_DIR)) return [];
  return readdirSync(BUNDLED_DIR)
    .filter((n) => n.endsWith('.excalidrawlib'))
    .sort();
}

// A readable title from the slug: "aws-architecture-icons" -> "Aws architecture
// icons". The libraries carry no name of their own, only a source URL.
function titleFor(slug) {
  const s = slug.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// A library as published is pretty-printed; about half its bytes are
// indentation (#118). The compact form parses to exactly the same values, item
// order included. Null when it would not - a -0 prints as 0 - so that file is
// left as it is rather than changed.
export function compactLibrary(raw) {
  const value = JSON.parse(raw);
  const compact = `${JSON.stringify(value)}\n`;
  return isDeepStrictEqual(JSON.parse(compact), value) ? compact : null;
}

// Rewrites each bundled library that is not already compact; returns their names.
export function compactBundled() {
  const changed = [];
  for (const file of libraryFiles()) {
    const path = join(BUNDLED_DIR, file);
    const raw = readFileSync(path, 'utf8');
    const compact = compactLibrary(raw);
    if (compact && compact !== raw) { writeFileSync(path, compact); changed.push(file); }
  }
  return changed;
}

export function buildIndex() {
  const libraries = [];
  const items = [];
  const credits = existsSync(AUTHORS_FILE)
    ? (JSON.parse(readFileSync(AUTHORS_FILE, 'utf8')).libraries ?? {})
    : {};

  for (const file of libraryFiles()) {
    const slug = basename(file, '.excalidrawlib');
    const path = join(BUNDLED_DIR, file);
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    const parsed = readLibrary(path);

    let named = 0;
    let captioned = 0;
    let images = 0;
    const start = items.length;

    parsed.forEach((it, i) => {
      const elements = it.elements ?? [];
      const own = it.name || null;
      const caption = own ? null : captionOf(elements);
      if (own) named++;
      if (caption) captioned++;
      const hasImage = elements.some((el) => el.type === 'image');
      if (hasImage) images++;
      const box = bbox(elements);
      items.push({
        ref: `${slug}:${i}`,
        library: slug,
        index: i,
        // Null when nothing named it. find-icon.mjs must not invent a name here:
        // a wrong name is how a diagram ends up showing the wrong product.
        name: own ?? caption ?? null,
        nameFrom: own ? 'library' : (caption ? 'caption' : null),
        elements: elements.length,
        size: `${Math.round(box.width)}x${Math.round(box.height)}`,
        hasImage,
      });
    });

    const credit = credits[slug] ?? {};
    libraries.push({
      slug,
      file,
      // The library's published name where the catalogue knows it, otherwise
      // one made from the slug.
      title: credit.name || titleFor(slug),
      authors: (credit.authors ?? []).map((a) => a.name),
      catalogue: credit.catalogue ?? null,
      source: raw.source ?? null,
      format: raw.version ?? (Array.isArray(raw.libraryItems) ? 2 : 1),
      items: parsed.length,
      named,
      captioned,
      unnamed: parsed.length - named - captioned,
      images,
      bytes: statSync(path).size,
      firstItem: start,
    });
  }

  return {
    _comment: 'Flat index of the bundled Excalidraw libraries. Names and sizes only - '
      + 'the element payloads stay in the .excalidrawlib files. Rebuild with index-libraries.mjs --build.',
    generated: new Date().toISOString(),
    totals: {
      libraries: libraries.length,
      items: items.length,
      named: items.filter((i) => i.nameFrom === 'library').length,
      captioned: items.filter((i) => i.nameFrom === 'caption').length,
      unnamed: items.filter((i) => !i.name).length,
      bytes: libraries.reduce((n, l) => n + l.bytes, 0),
    },
    libraries,
    items,
  };
}

let cached = null;

export function loadIndex() {
  if (cached) return cached;
  if (!existsSync(BUNDLED_INDEX)) return { totals: { libraries: 0, items: 0 }, libraries: [], items: [] };
  try { cached = JSON.parse(readFileSync(BUNDLED_INDEX, 'utf8')); } catch { return { totals: { libraries: 0, items: 0 }, libraries: [], items: [] }; }
  return cached;
}

// The element payload for one item, read from its library on demand.
export function bundledItem(ref) {
  const [slug, key] = String(ref).split(':');
  const index = loadIndex();
  const lib = index.libraries.find((l) => l.slug === normalizeName(slug));
  if (!lib) return null;
  const parsed = readLibrary(join(BUNDLED_DIR, lib.file));
  const i = /^\d+$/.test(key)
    ? Number(key)
    : parsed.findIndex((it) => it.name && normalizeName(it.name) === normalizeName(key));
  const item = parsed[i];
  if (!item) return null;
  const meta = index.items.find((it) => it.ref === `${lib.slug}:${i}`);
  return {
    ref: `${lib.slug}:${i}`,
    library: lib.slug,
    libraryTitle: lib.title,
    name: meta?.name ?? item.name ?? null,
    elements: item.elements ?? [],
  };
}

function main(argv) {
  const flag = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };

  if (argv.includes('--build')) {
    const compacted = compactBundled();
    const index = buildIndex();
    writeFileSync(BUNDLED_INDEX, `${JSON.stringify(index, null, 2)}\n`);
    console.log(JSON.stringify({ wrote: BUNDLED_INDEX, compacted, ...index.totals }, null, 2));
    return;
  }

  const index = loadIndex();

  if (argv.includes('--stats')) {
    console.log(JSON.stringify(index.totals, null, 2));
    return;
  }

  if (argv.includes('--unnamed')) {
    const rows = index.libraries.filter((l) => l.unnamed > 0)
      .map((l) => ({ slug: l.slug, items: l.items, unnamed: l.unnamed,
        sheet: `assets/libraries/bundled/sheets/${l.slug}.png` }));
    console.log(JSON.stringify({
      libraries: rows,
      advice: 'Items here carry no name and can only be chosen by looking. Read the '
        + 'committed contact sheet, then reference the item by number: "<slug>:<n>".',
      rebuild: 'node index-libraries.mjs --sheet <slug>   (then render the scene it writes)',
    }, null, 2));
    return;
  }

  if (argv.includes('--sheet')) {
    const slug = normalizeName(flag('--sheet') ?? '');
    const lib = index.libraries.find((l) => l.slug === slug);
    if (!lib) { console.error(`no bundled library "${slug}"`); process.exit(1); }
    const parsed = readLibrary(join(BUNDLED_DIR, lib.file));
    const items = parsed.map((it, i) => {
      const meta = index.items.find((m) => m.ref === `${slug}:${i}`);
      return { ...it, name: meta?.name ?? '', named: Boolean(meta?.name) };
    });
    const sheet = contactSheet(slug, { items });
    const dir = join(BUNDLED_DIR, 'sheets');
    mkdirSync(dir, { recursive: true });
    const out = join(dir, `${slug}.excalidraw`);
    writeScene(out, sheet.scene, { force: true });
    console.log(JSON.stringify({ wrote: out, items: sheet.items,
      next: `render-excalidraw.ps1 -Path ${out} -OutDir assets/libraries/bundled/sheets` }, null, 2));
    return;
  }

  if (argv.includes('--items')) {
    const slug = normalizeName(flag('--items') ?? '');
    const rows = index.items.filter((it) => it.library === slug);
    if (!rows.length) { console.error(`no bundled library "${slug}"`); process.exit(1); }
    console.log(rows.map((it) => `${String(it.index).padStart(3)}  ${it.name ?? '(unnamed)'}`).join('\n'));
    return;
  }

  // Default: one line per library.
  const width = Math.max(...index.libraries.map((l) => l.slug.length), 4);
  console.log(`${'slug'.padEnd(width)}  items  named  caption  unnamed  fmt   size`);
  for (const l of index.libraries) {
    console.log(`${l.slug.padEnd(width)}  ${String(l.items).padStart(5)}  ${String(l.named).padStart(5)}`
      + `  ${String(l.captioned).padStart(7)}  ${String(l.unnamed).padStart(7)}`
      + `  v${l.format}   ${Math.round(l.bytes / 1024)}kb`);
  }
  console.log(`\n${index.totals.libraries} libraries, ${index.totals.items} items, `
    + `${index.totals.unnamed} of them unnamed`);
}

if (process.argv[1] && process.argv[1].endsWith('index-libraries.mjs')) main(process.argv.slice(2));
