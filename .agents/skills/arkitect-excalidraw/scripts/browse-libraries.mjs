#!/usr/bin/env node
// Browse and install from libraries.excalidraw.com - the same public library
// index the app's "Browse libraries" button opens.
//
//   node browse-libraries.mjs --update                 refresh the index
//   node browse-libraries.mjs --search "aws"           search it
//   node browse-libraries.mjs --search "kubernetes" --items
//   node browse-libraries.mjs --install youritem/aws.excalidrawlib
//   node browse-libraries.mjs --list                   what is installed
//   node browse-libraries.mjs --show aws               items in one installed library
//   node browse-libraries.mjs --remove aws
//
// Installed libraries are cached under assets/libraries/ and searched by
// find-icon.mjs alongside the house icons. Nothing about a diagram is ever sent
// anywhere: the only requests are for the public index and the library files.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import {
  readLibrary, normalizeName, sha256, emptyScene, writeScene, reindex,
  cloneElements, scaleElements, translate, bbox, text, measureText, newId,
  FONT, FONT_FAMILY,
} from './lib/excalidraw-core.mjs';
import { cacheDir, mergedRegistry } from '../../arkitect-drawio/scripts/lib/store.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
export const LIB_DIR = cacheDir('excalidraw', 'libraries');
// Where libraries were installed before #257: still read, never written. The
// bundled libraries stay beside it, in bundled/: they ship with the plugin.
export const LEGACY_LIB_DIR = join(SKILL_ROOT, 'assets', 'libraries');
const INDEX_FILE = join(LIB_DIR, 'index.json');

const INDEX_URL = 'https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries.json';
const FILE_BASE = 'https://libraries.excalidraw.com/libraries/';

const UA = { 'user-agent': 'arkitect-excalidraw/1.0 (+library browse)' };

// ---------------------------------------------------------------- index

export async function updateIndex() {
  const res = await fetch(INDEX_URL, { headers: UA, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching the library index`);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error('library index is not an array');
  mkdirSync(LIB_DIR, { recursive: true });
  writeFileSync(INDEX_FILE, `${JSON.stringify(list, null, 2)}\n`);
  return { libraries: list.length, cached: INDEX_FILE };
}

export function loadIndex() {
  for (const file of [INDEX_FILE, join(LEGACY_LIB_DIR, 'index.json')]) {
    if (!existsSync(file)) continue;
    try { return JSON.parse(readFileSync(file, 'utf8')); } catch { /* try the next */ }
  }
  return null;
}

export function searchIndex(query, list) {
  const q = String(query).toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const lib of list) {
    const name = String(lib.name ?? '').toLowerCase();
    const desc = String(lib.description ?? '').toLowerCase();
    const items = (lib.itemNames ?? []).map((n) => String(n).toLowerCase());
    const hay = `${name} ${desc} ${items.join(' ')}`;
    let score = 0;
    if (name === q) score = 100;
    else if (name.includes(q)) score = 80;
    else if (items.some((n) => n === q)) score = 75;
    else if (items.some((n) => n.includes(q))) score = 55;
    else if (desc.includes(q)) score = 35;
    else {
      const hits = terms.filter((t) => hay.includes(t)).length;
      if (hits) score = Math.round((hits / terms.length) * 30);
    }
    if (score > 0) scored.push({ score, lib, matchedItems: items.filter((n) => terms.some((t) => n.includes(t))).slice(0, 12) });
  }
  return scored.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------- install

function readInstalledAt(dir) {
  const file = join(dir, 'installed.json');
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; }
}

function loadInstalled() {
  return mergedRegistry(readInstalledAt, [LIB_DIR, LEGACY_LIB_DIR]);
}

// Write through a staging file beside the target, so a failure part-way leaves
// what was there before rather than half of something new (#152).
function writeStaged(path, bytes, check = null) {
  const staged = `${path}.incoming-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(staged, bytes);
    const checked = check ? check(staged) : undefined;
    renameSync(staged, path);
    return checked;
  } catch (error) {
    try { if (existsSync(staged)) unlinkSync(staged); } catch { /* staging is not the caller's problem */ }
    throw error;
  }
}

function saveInstalled(map, dir = LIB_DIR) {
  mkdirSync(dir, { recursive: true });
  writeStaged(join(dir, 'installed.json'), `${JSON.stringify(map, null, 2)}\n`);
}

export function slugFor(source) {
  return normalizeName(basename(String(source)).replace(/\.excalidrawlib$/i, ''));
}

export async function installLibrary(sourceOrId, { force = false } = {}) {
  const list = loadIndex();
  let meta = null;
  let source = sourceOrId;
  if (list) {
    meta = list.find((l) => l.source === sourceOrId || l.id === sourceOrId || l.name === sourceOrId)
      ?? list.find((l) => normalizeName(l.name) === normalizeName(sourceOrId));
    if (meta) source = meta.source;
  }
  if (!/\.excalidrawlib$/i.test(source)) {
    throw new Error(`"${sourceOrId}" is not a library source path; run --search first and pass the exact "source" value`);
  }

  const url = /^https:\/\//i.test(source) ? source : FILE_BASE + source;
  const res = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const body = Buffer.from(await res.arrayBuffer());

  const slug = slugFor(source);
  const path = join(LIB_DIR, `${slug}.excalidrawlib`);
  if (loadInstalled()[slug] && !force) throw new Error(`"${slug}" is already installed; pass --force to replace it`);
  const installed = readInstalledAt(LIB_DIR);

  mkdirSync(LIB_DIR, { recursive: true });
  // The download is parsed in a staging file beside the target, never over it:
  // writing first meant a malformed replacement destroyed a working library
  // while the registry still described the old one, and every icon search that
  // enumerated it then threw (#152).
  const previous = existsSync(path) ? readFileSync(path) : null;
  // Parse it back so a malformed download fails here rather than mid-diagram.
  const items = writeStaged(path, body, readLibrary);

  installed[slug] = {
    slug,
    file: basename(path),
    name: meta?.name ?? slug,
    description: meta?.description ?? '',
    authors: (meta?.authors ?? []).map((a) => a.name),
    source,
    url,
    // v1 libraries carry no per-item names; the index's itemNames is the only
    // source and is positional, so it is recorded here rather than guessed later.
    itemNames: meta?.itemNames ?? [],
    items: items.length,
    bytes: body.length,
    sha256: sha256(body),
    installed: new Date().toISOString(),
  };
  try {
    saveInstalled(installed);
  } catch (error) {
    // Put the library back, so the file and the registry cannot disagree.
    try {
      if (previous) writeFileSync(path, previous);
      else if (existsSync(path)) unlinkSync(path);
    } catch { /* the original failure is the one worth reporting */ }
    throw error;
  }
  return installed[slug];
}

export function listInstalled() {
  return Object.values(loadInstalled());
}

// Most published libraries are still format v1, whose items carry no name at
// all. Three fallbacks, best first: the item's own name (v2), the positional
// `itemNames` from the public index, and the item's own caption - an icon
// almost always ships with its product name drawn underneath it, and without
// that last one a v1 library is unsearchable.
function captionOf(elements) {
  const texts = (elements ?? []).filter((el) => el.type === 'text' && el.text && !el.isDeleted);
  if (!texts.length) return null;
  // The largest type is the title rather than a footnote; ties go to the first.
  const best = texts.reduce((a, b) => ((b.fontSize ?? 0) > (a.fontSize ?? 0) ? b : a));
  return String(best.text).replace(/\s+/g, ' ').trim().slice(0, 60) || null;
}

export function libraryItems(slug) {
  const meta = loadInstalled()[slug];
  if (!meta) return null;
  const path = join(meta.dir, meta.file);
  if (!existsSync(path)) return null;
  const items = readLibrary(path);
  return items.map((it, i) => {
    const name = it.name || meta.itemNames?.[i] || captionOf(it.elements);
    return {
      ...it,
      name: name || `${meta.slug}-${i}`,
      // False when nothing named the item and the slug-and-index fallback was
      // used; the contact sheet leaves that out rather than repeating it.
      named: Boolean(name),
      library: meta.slug,
      libraryName: meta.name,
    };
  });
}

// Most published libraries are format v1 and carry no item names, so an item
// can only be chosen by looking at it. This lays the whole library out as a
// numbered contact sheet - an ordinary scene, so the normal render script turns
// it into a PNG you can read back.
// `items` lets a caller supply the list rather than it being looked up in the
// installed registry - that is how a bundled library gets a sheet.
export function contactSheet(slug, { columns = 6, cell = 180, items: supplied = null } = {}) {
  const items = supplied ?? libraryItems(slug);
  if (!items) return null;
  const scene = emptyScene();
  const out = [];

  items.forEach((item, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const originX = col * cell;
    const originY = row * (cell + 40);

    const clone = cloneElements(item.elements, { groupId: newId() });
    const box = bbox(clone);
    if (box.width > 0 && box.height > 0) {
      scaleElements(clone, Math.min(1, (cell - 40) / Math.max(box.width, box.height)), box.x, box.y);
    }
    const after = bbox(clone);
    translate(clone, originX + (cell - after.width) / 2 - after.x, originY + (cell - 46 - after.height) / 2 - after.y);
    out.push(...clone);

    const caption = item.named ? `${i}  ${item.name}` : String(i);
    const m = measureText(caption, FONT.S, FONT_FAMILY.normal);
    out.push(text({
      text: caption, fontSize: FONT.S, fontFamily: FONT_FAMILY.normal, textAlign: 'center',
      strokeColor: '#495057', width: m.width, height: m.height,
      x: originX + (cell - m.width) / 2, y: originY + cell - 38,
    }));
  });

  const title = `${slug} — ${items.length} items`;
  const tm = measureText(title, FONT.L, FONT_FAMILY.normal);
  scene.elements = [
    text({
      text: title, fontSize: FONT.L, fontFamily: FONT_FAMILY.normal, textAlign: 'left',
      strokeColor: '#1e1e1e', width: tm.width, height: tm.height, x: 0, y: -70,
    }),
    ...out,
  ];
  reindex(scene.elements);
  return { scene, items: items.length };
}

// Removed from whichever folder holds it, as make-icon does.
export function removeLibrary(slug) {
  const meta = loadInstalled()[normalizeName(slug)];
  if (!meta) throw new Error(`no installed library "${slug}"`);
  const path = join(meta.dir, meta.file);
  if (existsSync(path)) unlinkSync(path);
  const installed = readInstalledAt(meta.dir);
  delete installed[meta.slug];
  saveInstalled(installed, meta.dir);
  return meta.slug;
}

// ---------------------------------------------------------------- cli

async function main(argv) {
  const flag = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
  const has = (n) => argv.includes(n);

  try {
    if (has('--update')) {
      console.log(JSON.stringify(await updateIndex(), null, 2));
      if (argv.length === 1) return;
    }

    if (has('--list')) {
      const rows = listInstalled().map((m) => ({
        slug: m.slug, name: m.name, items: m.items, authors: m.authors, source: m.source,
      }));
      console.log(JSON.stringify(rows.length ? rows : {
        installed: 0, hint: 'node browse-libraries.mjs --update then --search "aws"',
      }, null, 2));
      return;
    }

    if (has('--preview')) {
      const slug = normalizeName(flag('--preview'));
      const sheet = contactSheet(slug, { columns: Number(flag('--columns') ?? 6) });
      if (!sheet) { console.error(`no installed library "${flag('--preview')}"`); process.exit(1); }
      const out = flag('--out') ?? `${slug}-contact-sheet.excalidraw`;
      writeScene(out, sheet.scene);
      console.log(JSON.stringify({
        wrote: out, items: sheet.items,
        next: `render it and look: ./render-excalidraw.ps1 -Path "${out}" -Style clean`,
      }, null, 2));
      return;
    }

    if (has('--show')) {
      const items = libraryItems(normalizeName(flag('--show')));
      if (!items) { console.error(`no installed library "${flag('--show')}"`); process.exit(1); }
      console.log(JSON.stringify({
        library: flag('--show'),
        items: items.map((it) => ({ index: it.index, name: it.name, elements: it.elements.length })),
      }, null, 2));
      return;
    }

    if (has('--remove')) {
      console.log(JSON.stringify({ removed: removeLibrary(flag('--remove')) }, null, 2));
      return;
    }

    if (has('--install')) {
      const meta = await installLibrary(flag('--install'), { force: has('--force') });
      console.log(JSON.stringify({
        installed: meta.slug, name: meta.name, items: meta.items, authors: meta.authors,
        licence: 'library authors keep their own licence and trademarks; check the entry before redistributing',
        next: `node find-icon.mjs "<component>"  |  node browse-libraries.mjs --show ${meta.slug}`,
      }, null, 2));
      return;
    }

    const query = flag('--search');
    if (!query) {
      console.error('usage: browse-libraries.mjs --update | --search <query> [--items] | --install <source> [--force]\n'
        + '                                 | --list | --show <slug> | --preview <slug> [--out f.excalidraw] | --remove <slug>');
      process.exit(2);
    }
    let list = loadIndex();
    if (!list) { await updateIndex(); list = loadIndex(); }
    const hits = searchIndex(query, list).slice(0, Number(flag('--limit') ?? 10));
    console.log(JSON.stringify({
      query,
      indexed: list.length,
      matches: hits.map((h) => ({
        name: h.lib.name,
        description: h.lib.description,
        source: h.lib.source,
        authors: (h.lib.authors ?? []).map((a) => a.name),
        updated: h.lib.updated,
        itemCount: h.lib.itemNames?.length ?? null,
        ...(has('--items') ? { items: h.lib.itemNames ?? [] } : { sampleItems: h.matchedItems }),
      })),
      next: 'node browse-libraries.mjs --install <source>',
    }, null, 2));
  } catch (e) {
    console.error(`failed: ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('browse-libraries.mjs')) main(process.argv.slice(2));
