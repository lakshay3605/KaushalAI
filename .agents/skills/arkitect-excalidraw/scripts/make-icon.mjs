#!/usr/bin/env node
// Turn a product logo into an Excalidraw icon and keep it in the house library.
//
//   node make-icon.mjs --url https://.../dbt.svg --name dbt
//   node make-icon.mjs --url https://.../dbt.svg --name dbt --trace
//   node make-icon.mjs --file ~/Downloads/dbt.png --name dbt --label "dbt Core"
//   node make-icon.mjs --list
//   node make-icon.mjs --inspect dbt
//   node make-icon.mjs --restyle dbt --trace --monochrome --size 96
//   node make-icon.mjs --remove dbt
//
// Two ways to make an icon:
//
//   embedded (default)  the logo goes in as an `image` element. Always faithful,
//                       works for PNG/SVG/WebP/JPEG, but it is a picture: it
//                       will not take the hand-drawn stroke and cannot be
//                       recoloured after the fact.
//   traced  (--trace)   a flat SVG is converted into native Excalidraw `line`
//                       elements. Editable, restylable, matches the canvas -
//                       but only honest for flat vector marks. Gradients, clip
//                       paths, masks and text are reported, not silently lost.
//
// Only the logo URL is ever requested. Nothing about the diagram, the customer
// or the architecture leaves the machine.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  sha256, newId, newSeed, line as lineEl, image as imageEl, text as textEl,
  writeLibrary, readLibrary, dataUrl, fileIdFor, bbox, translate,
  PALETTE, FONT, FONT_FAMILY, ROUGHNESS, STROKE_WIDTH, normalizeName, measureText,
} from './lib/excalidraw-core.mjs';
import { parseSvg, simplify, signedArea } from './lib/svg-path.mjs';
// Both engines read the same bytes the same way: the root <svg> element's own
// attributes, viewBox first. Reading a width from anywhere in the document
// picks up a child's, or `stroke-width`, and sizes the mark wrong (#96).
import { svgDimensions } from '../../arkitect-drawio/scripts/lib/drawio-core.mjs';
import { cacheDir, mergedRegistry } from '../../arkitect-drawio/scripts/lib/store.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
export const ICON_DIR = cacheDir('excalidraw', 'icons');
export const ITEM_DIR = join(ICON_DIR, 'items');
// Where icons were made before #257: still read, never written.
export const LEGACY_ICON_DIR = join(SKILL_ROOT, 'assets', 'icons');
const INDEX_FILE = join(ICON_DIR, 'index.json');
export const HOUSE_LIB = join(ICON_DIR, 'house.excalidrawlib');

const MAX_BYTES = 3 * 1024 * 1024;
export const DEFAULT_ICON_SIZE = 80;
const CAPTION_GAP = 8;

const EXT = { 'image/png': '.png', 'image/svg+xml': '.svg', 'image/webp': '.webp', 'image/jpeg': '.jpg' };

// ---------------------------------------------------------------- sniffing

export function sniff(bytes) {
  if (bytes.length > 8 && bytes.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (bytes.length > 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  const head = bytes.subarray(0, 512).toString('utf8').trimStart();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
  return null;
}

export function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47) return { width: null, height: null };
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

export { svgDimensions };

export function dimensions(mime, bytes) {
  if (mime === 'image/png') return pngDimensions(bytes);
  if (mime === 'image/svg+xml') return svgDimensions(bytes);
  return { width: null, height: null };
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
  const opaqueBg = /<rect[^>]*\bwidth\s*=\s*["']100%["'][^>]*>/i.test(s)
    || /\bstyle\s*=\s*["'][^"']*background(-color)?\s*:\s*(?!none|transparent)/i.test(s);
  return { alpha: !opaqueBg, note: opaqueBg ? 'has a background rect' : 'no background fill' };
}

export function transparency(mime, bytes) {
  if (mime === 'image/png') return pngTransparency(bytes);
  if (mime === 'image/svg+xml') return svgTransparency(bytes);
  return { alpha: false, note: `${mime} has no alpha channel` };
}

// ---------------------------------------------------------------- index

function readIndexAt(dir) {
  const file = join(dir, 'index.json');
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; }
}

export function loadIndex() {
  return mergedRegistry(readIndexAt, [ICON_DIR, LEGACY_ICON_DIR]);
}

function saveIndex(index) {
  mkdirSync(ICON_DIR, { recursive: true });
  writeFileSync(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`);
}

export function getIcon(name) {
  const key = normalizeName(name);
  const entry = loadIndex()[key];
  if (!entry) return null;
  const sourcePath = join(entry.dir, entry.file);
  const itemPath = join(entry.dir, 'items', `${key}.excalidrawlib`);
  return {
    ...entry,
    sourcePath,
    itemPath,
    bytes: existsSync(sourcePath) ? readFileSync(sourcePath) : null,
    elements: existsSync(itemPath) ? readLibrary(itemPath)[0]?.elements ?? null : null,
  };
}

// ---------------------------------------------------------------- icon elements

// Fit the longest side to `size`, preserving aspect: a wide wordmark stays wide
// instead of being squashed into a square.
export function fitBox(width, height, size) {
  if (!width || !height) return { width: size, height: size };
  const scale = size / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function caption(label, x, cy, width, opts) {
  const { fontSize = FONT.S, fontFamily = FONT_FAMILY.hand, color = PALETTE.black.stroke, groupIds = [] } = opts;
  const m = measureText(label, fontSize, fontFamily);
  return textEl({
    text: label,
    fontSize,
    fontFamily,
    textAlign: 'center',
    strokeColor: color,
    width: m.width,
    height: m.height,
    x: x + (width - m.width) / 2,
    y: cy,
    groupIds,
  });
}

// Embedded flavour: the logo as an `image` element, optionally captioned.
export function embeddedIconElements(entry, { size = DEFAULT_ICON_SIZE, label = null, x = 0, y = 0, captionOpts = {} } = {}) {
  const box = fitBox(entry.width, entry.height, size);
  const groupId = newId();
  const img = imageEl({
    fileId: entry.fileId,
    x, y,
    width: box.width,
    height: box.height,
    groupIds: label ? [groupId] : [],
  });
  const elements = [img];
  if (label) {
    elements.push(caption(label, x, y + box.height + CAPTION_GAP, box.width, { ...captionOpts, groupIds: [groupId] }));
  }
  return elements;
}

// Traced flavour: flat SVG geometry as native `line` elements.
export function traceSvgToElements(svgText, {
  size = DEFAULT_ICON_SIZE, monochrome = false, outline = false, stroke = PALETTE.black.stroke,
  holeColor = '#ffffff', roughness = ROUGHNESS.architect, strokeWidth = STROKE_WIDTH.thin,
  x = 0, y = 0, label = null, captionOpts = {},
} = {}) {
  const { viewBox, shapes, skipped } = parseSvg(svgText);
  const usable = shapes.filter((s) => s.points.length > 1 && (s.fill || s.stroke));
  if (!usable.length) throw new Error('nothing traceable in this SVG (no paths, rects, circles or polygons with paint)');

  // Scale from the drawing's own extent, not the viewBox: many logos declare a
  // padded viewBox and the icon would otherwise render small and off-centre.
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const s of usable) {
    for (const [px, py] of s.points) {
      minX = Math.min(minX, px); minY = Math.min(minY, py);
      maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
    }
  }
  const srcW = Math.max(1e-6, maxX - minX);
  const srcH = Math.max(1e-6, maxY - minY);
  const scale = size / Math.max(srcW, srcH);
  const groupId = newId();

  // Within one source path the rings can arrive in any order, and a hole only
  // reads as a hole when it is painted over its container. Biggest ring first,
  // groups otherwise left in document order.
  const ordered = [...usable].sort((a, b) => (a.source - b.source)
    || (Math.abs(signedArea(b.points)) - Math.abs(signedArea(a.points))));

  const elements = [];
  for (const s of ordered) {
    const pts = simplify(s.points.map(([px, py]) => [(px - minX) * scale, (py - minY) * scale]));
    if (pts.length < 2) continue;
    const closed = s.closed || Boolean(s.fill);
    const ring = closed && (pts[0][0] !== pts[pts.length - 1][0] || pts[0][1] !== pts[pts.length - 1][1])
      ? [...pts, pts[0]]
      : pts;
    const ox = Math.min(...ring.map((p) => p[0]));
    const oy = Math.min(...ring.map((p) => p[1]));

    // Outline mode drops every fill, which suits a monochrome mark and sidesteps
    // fill rules entirely. Otherwise a ring the parser flagged as a hole is
    // painted in the canvas colour, because Excalidraw has no even-odd fill.
    let fill;
    if (outline) fill = 'transparent';
    else if (s.hole) fill = holeColor;
    else if (monochrome) fill = s.fill ? stroke : 'transparent';
    else fill = s.fill ?? 'transparent';

    const lineColor = outline || monochrome ? stroke : (s.stroke ?? s.fill ?? stroke);
    elements.push(lineEl({
      points: ring.map(([px, py]) => [px - ox, py - oy]),
      x: x + ox,
      y: y + oy,
      strokeColor: s.hole && !outline ? fill : lineColor,
      backgroundColor: fill,
      fillStyle: 'solid',
      strokeWidth,
      roughness,
      seed: newSeed(),
      groupIds: [groupId],
    }));
  }

  const box = bbox(elements);
  if (label) {
    elements.push(caption(label, box.x, box.y + box.height + CAPTION_GAP, box.width, { ...captionOpts, groupIds: [groupId] }));
  }
  return {
    elements, skipped, viewBox,
    shapeCount: elements.length,
    holes: ordered.filter((s) => s.hole).length,
  };
}

// ---------------------------------------------------------------- store

function rebuildHouseLibrary() {
  const index = loadIndex();
  const items = [];
  const files = {};
  for (const key of Object.keys(index).sort()) {
    const itemPath = join(index[key].dir, 'items', `${key}.excalidrawlib`);
    if (!existsSync(itemPath)) continue;
    const [item] = readLibrary(itemPath);
    if (!item) continue;
    items.push({ id: item.id, name: index[key].label ?? key, created: item.created ?? Date.now(), elements: item.elements });
    const entry = index[key];
    if (entry.kind === 'embedded' && entry.fileId) {
      const bytes = readFileSync(join(entry.dir, entry.file));
      files[entry.fileId] = {
        mimeType: entry.mime, id: entry.fileId,
        dataURL: dataUrl(entry.mime, bytes), created: Date.now(), lastRetrieved: Date.now(),
      };
    }
  }
  mkdirSync(ICON_DIR, { recursive: true });
  writeLibrary(HOUSE_LIB, items, files);
  return { items: items.length, path: HOUSE_LIB };
}

export function storeIcon(name, bytes, opts = {}) {
  const {
    source = 'local', force = false, trace = false, size = DEFAULT_ICON_SIZE,
    label = null, monochrome = false, outline = false, stroke = PALETTE.black.stroke,
    holeColor = '#ffffff', roughness = ROUGHNESS.architect, strokeWidth = STROKE_WIDTH.thin,
  } = opts;

  const key = normalizeName(name);
  if (!key) throw new Error('an icon needs a name');
  if (bytes.length > MAX_BYTES) throw new Error(`too large: ${bytes.length} bytes (limit ${MAX_BYTES})`);
  const mime = sniff(bytes);
  if (!mime) throw new Error('not a recognised image (png, svg, webp or jpeg expected)');
  if (trace && mime !== 'image/svg+xml') throw new Error('--trace needs an SVG; fetch the vector version or drop --trace');

  if (loadIndex()[key] && !force) throw new Error(`"${key}" already exists; pass --force to replace it`);
  const index = readIndexAt(ICON_DIR);

  mkdirSync(ICON_DIR, { recursive: true });
  mkdirSync(ITEM_DIR, { recursive: true });
  for (const old of readdirSync(ICON_DIR)) {
    if (old.startsWith(`${key}.`) && old !== 'index.json') unlinkSync(join(ICON_DIR, old));
  }

  const file = `${key}${EXT[mime] ?? '.bin'}`;
  writeFileSync(join(ICON_DIR, file), bytes);

  const dims = dimensions(mime, bytes);
  const trans = transparency(mime, bytes);
  const entry = {
    name: key,
    label: label ?? name,
    kind: trace ? 'traced' : 'embedded',
    file,
    mime,
    byteLength: bytes.length,
    width: dims.width,
    height: dims.height,
    size,
    transparent: trans.alpha,
    transparencyNote: trans.note,
    sha256: sha256(bytes),
    source,
    created: new Date().toISOString(),
  };

  let elements;
  let traceReport = null;
  if (trace) {
    const r = traceSvgToElements(bytes.toString('utf8'), {
      size, monochrome, outline, stroke, holeColor, roughness, strokeWidth,
    });
    elements = r.elements;
    traceReport = { shapes: r.shapeCount, holes: r.holes, skipped: r.skipped };
    entry.tracedShapes = r.shapeCount;
    entry.tracedHoles = r.holes;
    entry.tracedSkipped = r.skipped;
    entry.monochrome = monochrome;
    entry.outline = outline;
  } else {
    entry.fileId = fileIdFor(bytes);
    elements = embeddedIconElements(entry, { size });
  }

  writeLibrary(join(ITEM_DIR, `${key}.excalidrawlib`),
    [{ id: newId(), name: entry.label, created: Date.now(), elements }],
    entry.fileId ? { [entry.fileId]: { mimeType: mime, id: entry.fileId, dataURL: dataUrl(mime, bytes), created: Date.now(), lastRetrieved: Date.now() } } : null);

  index[key] = entry;
  saveIndex(index);
  const house = rebuildHouseLibrary();
  return { entry, traceReport, house };
}

export async function fetchIcon(name, url, opts = {}) {
  if (!/^https:\/\//i.test(url)) throw new Error('only https URLs are accepted');
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'arkitect-excalidraw/1.0 (+diagram icon fetch)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  return storeIcon(name, bytes, { ...opts, source: url });
}

// Removed from whichever folder holds it: asked to remove an icon made before
// #257, the old folder is the one to change.
export function removeIcon(name) {
  const key = normalizeName(name);
  const found = loadIndex()[key];
  if (!found) throw new Error(`no icon "${key}"`);
  for (const old of readdirSync(found.dir)) {
    if (old.startsWith(`${key}.`) && old !== 'index.json') unlinkSync(join(found.dir, old));
  }
  const itemPath = join(found.dir, 'items', `${key}.excalidrawlib`);
  if (existsSync(itemPath)) unlinkSync(itemPath);
  const index = readIndexAt(found.dir);
  delete index[key];
  writeFileSync(join(found.dir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  rebuildHouseLibrary();
  return key;
}

// ---------------------------------------------------------------- cli

function report(entry, extra = {}) {
  return {
    name: entry.name,
    label: entry.label,
    kind: entry.kind,
    mime: entry.mime,
    intrinsic: entry.width && entry.height ? `${entry.width}x${entry.height}` : 'unknown',
    drawnAt: `${entry.size}px longest side`,
    transparent: entry.transparent,
    transparencyNote: entry.transparencyNote,
    source: entry.source,
    sha256: (entry.sha256 ?? '').slice(0, 16),
    ...extra,
    warning: entry.kind === 'embedded' && !entry.transparent
      ? 'Opaque background - it will show as a solid box on the canvas. Prefer a transparent PNG, or an SVG with --trace.'
      : undefined,
  };
}

async function main(argv) {
  const flag = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
  const has = (n) => argv.includes(n);

  if (argv[0] === '--list') {
    const index = loadIndex();
    const rows = Object.values(index).map((e) => ({
      name: e.name, label: e.label, kind: e.kind, mime: e.mime,
      transparent: e.transparent, source: e.source,
    }));
    console.log(JSON.stringify(rows.length ? rows : {
      icons: 0,
      hint: 'node make-icon.mjs --url <https url> --name <product> [--trace]',
    }, null, 2));
    return;
  }

  if (argv[0] === '--inspect') {
    const e = getIcon(argv[1]);
    if (!e) { console.error(`no icon "${argv[1]}"`); process.exit(1); }
    console.log(JSON.stringify(report(e, {
      elements: e.elements?.length ?? 0,
      item: e.itemPath,
      tracedSkipped: e.tracedSkipped,
    }), null, 2));
    return;
  }

  if (argv[0] === '--remove') {
    console.log(JSON.stringify({ removed: removeIcon(argv[1]) }, null, 2));
    return;
  }

  const common = {
    trace: has('--trace'),
    size: flag('--size') ? Number(flag('--size')) : DEFAULT_ICON_SIZE,
    label: flag('--label'),
    monochrome: has('--monochrome'),
    outline: has('--outline'),
    stroke: flag('--stroke') ?? PALETTE.black.stroke,
    holeColor: flag('--hole-color') ?? '#ffffff',
    strokeWidth: flag('--stroke-width') ? Number(flag('--stroke-width')) : STROKE_WIDTH.thin,
    roughness: flag('--roughness') ? Number(flag('--roughness')) : ROUGHNESS.architect,
    force: true,
  };

  // Restyle re-runs the build over the bytes already on disk: no second download.
  if (argv[0] === '--restyle') {
    const existing = getIcon(argv[1]);
    if (!existing) { console.error(`no icon "${argv[1]}"`); process.exit(1); }
    try {
      const r = storeIcon(existing.name, existing.bytes, {
        ...common,
        label: common.label ?? existing.label,
        source: existing.source,
      });
      console.log(JSON.stringify({ restyled: r.entry.name, ...report(r.entry, { trace: r.traceReport, house: r.house }) }, null, 2));
    } catch (e) { console.error(`failed: ${e.message}`); process.exit(1); }
    return;
  }

  const url = flag('--url');
  const file = flag('--file');
  const name = flag('--name');
  if ((!url && !file) || !name) {
    console.error('usage: make-icon.mjs --url <https url> --name <product> [--trace] [--size N] [--label X] [--monochrome] [--force]\n'
      + '       make-icon.mjs --file <path> --name <product> [...]\n'
      + '       make-icon.mjs --list | --inspect <name> | --restyle <name> [...] | --remove <name>');
    process.exit(2);
  }

  try {
    const opts = { ...common, force: has('--force') };
    const r = file
      ? storeIcon(name, readFileSync(file), { ...opts, source: `file:${file}` })
      : await fetchIcon(name, url, opts);
    console.log(JSON.stringify({
      stored: r.entry.name,
      ...report(r.entry, { trace: r.traceReport, house: r.house }),
      next: `node find-icon.mjs "${r.entry.name}"  |  use it in a spec: { "kind": "icon", "icon": "${r.entry.name}" }`,
    }, null, 2));
  } catch (e) {
    console.error(`failed: ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('make-icon.mjs')) main(process.argv.slice(2));
