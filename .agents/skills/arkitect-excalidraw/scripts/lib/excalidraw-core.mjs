// Scene model for .excalidraw / .excalidrawlib files.
//
// Everything here runs locally and has no npm dependencies. Nothing in this
// module prints element text; callers decide what is safe to emit.
//
// Format reference: ../../references/excalidraw-format.md

import { readFileSync, writeFileSync } from 'node:fs';
export { backupExisting, pruneBackups, DEFAULT_KEEP_BACKUPS } from '../../../arkitect-drawio/scripts/lib/backups.mjs';
import { readJson } from '../../../arkitect-drawio/scripts/lib/read-json.mjs';
export { parseCliOrExit, exitUsage, UsageError } from '../../../arkitect-drawio/scripts/lib/drawio-core.mjs';
import { createHash, randomBytes } from 'node:crypto';
import { CHARS, ADVANCE } from './text-widths.mjs';

export const SCENE_TYPE = 'excalidraw';
export const LIB_TYPE = 'excalidrawlib';
export const SOURCE = 'https://excalidraw.com';

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function fileMeta(path) {
  const buf = readFileSync(path);
  return { path, bytes: buf.length, sha256: sha256(buf) };
}

// ---------------------------------------------------------------- palette

// The five stroke colours and five backgrounds Excalidraw offers by default,
// plus two from its extended picker. Sticking to these is what makes a
// generated scene look like it was drawn in the app rather than imported.
export const PALETTE = {
  black:  { stroke: '#1e1e1e', bg: 'transparent' },
  red:    { stroke: '#e03131', bg: '#ffc9c9' },
  green:  { stroke: '#2f9e44', bg: '#b2f2bb' },
  blue:   { stroke: '#1971c2', bg: '#a5d8ff' },
  orange: { stroke: '#f08c00', bg: '#ffec99' },
  // extended picker, not on the default five-swatch row
  violet: { stroke: '#6741d9', bg: '#d0bfff' },
  grey:   { stroke: '#495057', bg: '#e9ecef' },
};

export const CANVAS_BG = {
  white: '#ffffff', grey: '#f8f9fa', blue: '#f5faff', yellow: '#fffce8', pink: '#fdf8f6',
};

// Excalidraw's font-size steps (S/M/L/XL) and family ids. 1/2/3 are the legacy
// ids and are still accepted and remapped by current builds, so they are the
// portable choice: 1 = hand-drawn, 2 = normal, 3 = code.
export const FONT = { S: 16, M: 20, L: 28, XL: 36 };
// 5 (Excalifont) and 6 (Nunito) are the current picker's hand and normal faces.
// The reference corpus writes captions in 1 and multi-line body copy in 6.
export const FONT_FAMILY = { hand: 1, normal: 2, code: 3, excalifont: 5, nunito: 6 };
export const STROKE_WIDTH = { thin: 1, bold: 2, extraBold: 4 };
export const ROUGHNESS = { architect: 0, artist: 1, cartoonist: 2 };

// ---------------------------------------------------------------- cli args

// The CLIs parse with Draw.io's parseCliOrExit (re-exported above): a flag's
// value is taken with its flag, and an unknown flag, a missing value or a
// repeated flag exits 2 before anything is read or written (#116).

// One line naming the file and what is wrong with it - never a stack trace,
// never the file's content.
export function readProblem(path, error, what = 'file') {
  if (error.code === 'ENOENT') return `no ${what} at ${path}`;
  if (error instanceof SyntaxError) return `${path} is not valid JSON`;
  return error.code ? `cannot read ${what} ${path}: ${error.code}` : error.message;
}

// ---------------------------------------------------------------- ids

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

// Excalidraw ids are 21-character nanoid strings. Nothing depends on the exact
// alphabet, but matching it keeps hand-edited and generated scenes uniform.
export function newId(len = 21) {
  const bytes = seeded ? Array.from({ length: len }, () => seeded.next() * 64) : randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += ID_ALPHABET[bytes[i] & 63];
  return s;
}

// Never 0: a zero seed makes the preview's stroke generator fall back to
// Math.random, so the same scene would draw differently each time.
export function newSeed() {
  return 1 + Math.floor((seeded ? seeded.next() : Math.random()) * (2 ** 31 - 1));
}

// The time stamped on elements and embedded files.
export function now() {
  return seeded ? SEEDED_TIME : Date.now();
}

// Reproducible builds (#119). Inside withSeed(), ids, stroke seeds, nonces and
// timestamps come from the seed rather than from chance and the clock, so the
// same spec, style, seed and assets give byte-identical scenes. Outside it
// nothing changes. Synchronous only: the seed is scoped to fn's call.
export const SEEDED_TIME = Date.UTC(2024, 0, 1);
let seeded = null;

// mulberry32: small, fast and good enough to keep 21-character ids unique.
function seededRandom(seed) {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
    },
  };
}

export function parseSeed(value) {
  const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return Number.isSafeInteger(n) && n >= 0 && n <= 0xffffffff ? n : null;
}

export function withSeed(seed, fn) {
  if (seed == null) return fn();
  const n = parseSeed(seed);
  if (n === null) throw new Error(`seed must be a whole number from 0 to 4294967295, got ${seed}`);
  const outer = seeded;
  seeded = seededRandom(n);
  try { return fn(); } finally { seeded = outer; }
}

// Fractional index keys, in the `fractional-indexing` format Excalidraw uses.
//
// The leading character encodes how many digits follow: 'a' means one, 'b' two,
// 'c' three, and so on, so the sequence runs a0..az, b00..bzz, c000... Sorting
// these as plain strings gives the right order, and - unlike an arbitrary
// sortable string - Excalidraw can generate a key after the last one when
// somebody adds an element, instead of rejecting the whole set as invalid and
// regenerating every index.
const IDX_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const IDX_HEADS = 'abcdefghijklmnopqrstuvwxyz';

export function indexKey(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`index must be a non-negative integer, got ${n}`);
  let remaining = n;
  for (let width = 1; width < IDX_HEADS.length; width++) {
    const capacity = 62 ** width;
    if (remaining < capacity) {
      let digits = '';
      let v = remaining;
      for (let i = 0; i < width; i++) { digits = IDX_ALPHABET[v % 62] + digits; v = Math.floor(v / 62); }
      return IDX_HEADS[width - 1] + digits;
    }
    remaining -= capacity;
  }
  throw new Error('scene is too large to index');
}

// ---------------------------------------------------------------- elements

function base(overrides = {}) {
  return {
    id: newId(),
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: PALETTE.black.stroke,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: STROKE_WIDTH.bold,
    strokeStyle: 'solid',
    roughness: ROUGHNESS.artist,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: newSeed(),
    version: 1,
    versionNonce: newSeed(),
    isDeleted: false,
    boundElements: null,
    updated: now(),
    link: null,
    locked: false,
    ...overrides,
  };
}

export const ROUND = { type: 3 };   // adaptive corner radius, what the UI's "round" edges produce

export function rectangle(o = {}) { return base({ type: 'rectangle', ...o }); }
export function ellipse(o = {})   { return base({ type: 'ellipse', ...o }); }
export function diamond(o = {})   { return base({ type: 'diamond', ...o }); }

export function frame(o = {}) {
  const { name = null, ...rest } = o;
  return base({
    type: 'frame',
    name,
    strokeColor: '#bbb',
    backgroundColor: 'transparent',
    strokeWidth: STROKE_WIDTH.bold,
    roughness: ROUGHNESS.architect,
    roundness: null,
    ...rest,
  });
}

export function text(o = {}) {
  const {
    text: body = '', fontSize = FONT.S, fontFamily = FONT_FAMILY.hand,
    textAlign = 'left', verticalAlign = 'top', containerId = null, ...rest
  } = o;
  const metrics = measureText(body, fontSize, fontFamily);
  return base({
    type: 'text',
    text: body,
    originalText: body,
    fontSize,
    fontFamily,
    textAlign,
    verticalAlign,
    containerId,
    lineHeight: LINE_HEIGHT[fontFamily] ?? 1.25,
    autoResize: true,
    width: metrics.width,
    height: metrics.height,
    ...rest,
  });
}

export function arrow(o = {}) {
  const {
    points = [[0, 0], [100, 0]], startBinding = null, endBinding = null,
    startArrowhead = null, endArrowhead = 'arrow', elbowed = false, ...rest
  } = o;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const el = base({
    type: 'arrow',
    points,
    lastCommittedPoint: null,
    startBinding,
    endBinding,
    startArrowhead,
    endArrowhead,
    elbowed,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    ...rest,
  });
  // An elbow arrow is routed by the app, not by the file. It carries three
  // companion fields and must have roundness null; the points written here are
  // only the opening position. Field set taken from arrows the app itself wrote.
  if (elbowed) {
    el.roundness = null;
    el.fixedSegments = el.fixedSegments ?? null;
    el.startIsSpecial = el.startIsSpecial ?? null;
    el.endIsSpecial = el.endIsSpecial ?? null;
  }
  return el;
}

export function line(o = {}) {
  const { points = [[0, 0], [100, 0]], ...rest } = o;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return base({
    type: 'line',
    points,
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    ...rest,
  });
}

export function image(o = {}) {
  const { fileId, scale = [1, 1], ...rest } = o;
  return base({
    type: 'image',
    fileId,
    status: 'saved',
    scale,
    crop: null,
    ...rest,
  });
}

// ---------------------------------------------------------------- text metrics

export const LINE_HEIGHT = { 1: 1.25, 2: 1.15, 3: 1.2 };

// Excalidraw measures text on a canvas and there is none here, so a line is
// the sum of per-character widths taken from the app's own fonts. Summing
// drops kerning, which errs a little wide: that costs space, where a narrow
// width costs letters, since the app clips free text to it (#222).
const AT = new Map([...CHARS].map((c, i) => [c, i]));
// CJK, Hangul, full-width forms and emoji draw about one em in every family.
const FULL_WIDTH = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u;
// Anything else unlisted, an average capital: wide rather than clipped.
const OTHER = Object.fromEntries(Object.entries(ADVANCE).map(([f, t]) => {
  const caps = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((c) => t[AT.get(c)]);
  return [f, caps.reduce((a, b) => a + b, 0) / caps.length];
}));

function advance(ch, family) {
  const t = ADVANCE[family] ?? ADVANCE[FONT_FAMILY.hand];
  const at = AT.get(ch) ?? AT.get(ch.normalize('NFD')[0]);
  if (at !== undefined) return t[at];
  if (FULL_WIDTH.test(ch)) return 1;
  return OTHER[family] ?? OTHER[FONT_FAMILY.hand];
}

export function measureLine(s, fontSize, fontFamily = FONT_FAMILY.hand) {
  let w = 0;
  for (const ch of String(s)) w += advance(ch, fontFamily);
  return w * fontSize;
}

export function measureText(s, fontSize, fontFamily = FONT_FAMILY.hand) {
  const lines = String(s).split('\n');
  const lineHeight = fontSize * (LINE_HEIGHT[fontFamily] ?? 1.25);
  return {
    width: Math.max(0, ...lines.map((l) => measureLine(l, fontSize, fontFamily))),
    height: Math.max(lineHeight, lines.length * lineHeight),
    lines: lines.length,
    lineHeight,
  };
}

// Greedy word wrap to a pixel width, matching how Excalidraw wraps bound text.
export function wrapText(s, maxWidth, fontSize, fontFamily = FONT_FAMILY.hand) {
  const out = [];
  for (const para of String(s).split('\n')) {
    let cur = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const probe = cur ? `${cur} ${word}` : word;
      if (cur && measureLine(probe, fontSize, fontFamily) > maxWidth) { out.push(cur); cur = word; }
      else cur = probe;
    }
    out.push(cur);
  }
  return out.join('\n');
}

// ---------------------------------------------------------------- binding

function addBound(el, entry) {
  el.boundElements = [...(el.boundElements ?? []), entry];
}

// Put `label` inside `container` as bound text. Excalidraw recomputes the exact
// box on load, but a correct starting geometry means the SVG preview matches
// what the app will show.
// A diamond only offers half its width on the centre line and an ellipse about
// 1/sqrt(2); wrapping to the full width would push the label out of the shape.
const LABEL_WIDTH_FACTOR = { diamond: 0.5, ellipse: 0.7 };

export function bindLabel(container, label, opts = {}) {
  const {
    fontSize = FONT.S, fontFamily = FONT_FAMILY.hand, color = container.strokeColor,
    padding = 10, verticalAlign = 'middle', textAlign = 'center',
  } = opts;
  const usable = container.width * (LABEL_WIDTH_FACTOR[container.type] ?? 1) - padding * 2;
  const wrapped = wrapText(label, Math.max(20, usable), fontSize, fontFamily);
  const m = measureText(wrapped, fontSize, fontFamily);
  const t = text({
    text: wrapped,
    fontSize,
    fontFamily,
    textAlign,
    verticalAlign,
    containerId: container.id,
    strokeColor: color,
    width: m.width,
    height: m.height,
    x: textAlign === 'left'
      ? container.x + padding
      : container.x + (container.width - m.width) / 2,
    y: verticalAlign === 'top'
      ? container.y + padding
      : container.y + (container.height - m.height) / 2,
    frameId: container.frameId ?? null,
    groupIds: [...(container.groupIds ?? [])],
  });
  addBound(container, { id: t.id, type: 'text' });
  return t;
}

// Where an elbow arrow leaves or meets a shape, in the shape's own normalised
// coordinates: [0,0.5] is the middle of its left edge, [1,0.5] the right. The
// app writes values slightly outside 0..1 so the head clears the outline.
export const EDGE_POINT = {
  left:   [0, 0.5],
  right:  [1, 0.5],
  top:    [0.5, 0],
  bottom: [0.5, 1],
};

// Bind both ends of an arrow. `focus` 0 aims at the shape's centre; `gap` is
// the clear space Excalidraw keeps between arrowhead and shape. `fixedPoints`
// is [start, end] edge points and is required for elbow arrows - without it the
// app has nothing to route between and drops the binding.
export function bindArrow(a, from, to, { gap = 6, focus = 0, fixedPoints = null } = {}) {
  if (from) {
    a.startBinding = { elementId: from.id, focus, gap };
    if (fixedPoints?.[0]) a.startBinding.fixedPoint = fixedPoints[0];
    addBound(from, { id: a.id, type: 'arrow' });
  }
  if (to) {
    a.endBinding = { elementId: to.id, focus, gap };
    if (fixedPoints?.[1]) a.endBinding.fixedPoint = fixedPoints[1];
    // A loop binds both ends to one shape, which lists the arrow once.
    if (to !== from) addBound(to, { id: a.id, type: 'arrow' });
  }
  return a;
}

// ---------------------------------------------------------------- geometry

export function elementBox(el) {
  if (el.type === 'arrow' || el.type === 'line') {
    const pts = el.points ?? [[0, 0]];
    const xs = pts.map((p) => el.x + p[0]);
    const ys = pts.map((p) => el.y + p[1]);
    return {
      x: Math.min(...xs), y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys),
    };
  }
  return { x: el.x, y: el.y, width: el.width ?? 0, height: el.height ?? 0 };
}

export function bbox(elements) {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const el of elements) {
    if (el.isDeleted) continue;
    const b = elementBox(el);
    if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function translate(elements, dx, dy) {
  for (const el of elements) { el.x += dx; el.y += dy; }
  return elements;
}

export function scaleElements(elements, factor, ox = 0, oy = 0) {
  for (const el of elements) {
    el.x = ox + (el.x - ox) * factor;
    el.y = oy + (el.y - oy) * factor;
    if (typeof el.width === 'number') el.width *= factor;
    if (typeof el.height === 'number') el.height *= factor;
    if (el.points) el.points = el.points.map(([px, py]) => [px * factor, py * factor]);
    if (el.type === 'text') el.fontSize = Math.max(8, Math.round(el.fontSize * factor));
  }
  return elements;
}

// Bindings are stored twice - the arrow names its shapes, and each shape lists
// the arrow back - and published library items are routinely inconsistent about
// the second half. Excalidraw repairs that quietly on load; doing it here means
// a generated scene is self-consistent on disk and the validator stays strict.
export function repairBindings(elements) {
  const byId = new Map(elements.map((el) => [el.id, el]));
  const ensure = (host, entry) => {
    if (!host) return;
    host.boundElements = host.boundElements ?? [];
    if (!host.boundElements.some((b) => b.id === entry.id)) host.boundElements.push(entry);
  };
  for (const el of elements) {
    for (const end of ['startBinding', 'endBinding']) {
      if (el[end]?.elementId) ensure(byId.get(el[end].elementId), { id: el.id, type: 'arrow' });
    }
    if (el.type === 'text' && el.containerId) ensure(byId.get(el.containerId), { id: el.id, type: 'text' });
  }
  // The reverse direction too: a shape that lists a bound element which is not
  // here any more would fail validation on the copy.
  for (const el of elements) {
    if (!Array.isArray(el.boundElements)) continue;
    el.boundElements = el.boundElements.filter((b) => byId.has(b.id));
    if (!el.boundElements.length) el.boundElements = null;
  }
  return elements;
}

// Deep-copy a set of elements with fresh ids, rewriting every internal
// reference. Used when a library item is stamped into a scene more than once.
export function cloneElements(elements, { groupId = null } = {}) {
  const map = new Map();
  const copies = elements.map((el) => {
    const c = JSON.parse(JSON.stringify(el));
    c.id = newId();
    c.seed = newSeed();
    c.versionNonce = newSeed();
    map.set(el.id, c.id);
    return c;
  });
  // A reference to something outside the cloned set cannot be rewritten, and
  // leaving the original id behind produces an element bound to a stranger.
  // Published library items ship with these fairly often, so they are dropped.
  const remap = (id) => map.get(id) ?? null;
  for (const c of copies) {
    if (c.containerId) c.containerId = remap(c.containerId);
    if (c.frameId) c.frameId = remap(c.frameId);
    if (Array.isArray(c.boundElements)) {
      c.boundElements = c.boundElements
        .map((b) => ({ ...b, id: remap(b.id) }))
        .filter((b) => b.id !== null);
      if (!c.boundElements.length) c.boundElements = null;
    }
    for (const end of ['startBinding', 'endBinding']) {
      if (!c[end]) continue;
      const id = remap(c[end].elementId);
      c[end] = id === null ? null : { ...c[end], elementId: id };
    }
    if (groupId) c.groupIds = [...(c.groupIds ?? []), groupId];
  }
  return repairBindings(copies);
}

// ---------------------------------------------------------------- scene io

export function emptyScene(overrides = {}) {
  return {
    type: SCENE_TYPE,
    version: 2,
    source: SOURCE,
    elements: [],
    appState: {
      gridSize: null,
      gridStep: 5,
      gridModeEnabled: false,
      viewBackgroundColor: CANVAS_BG.white,
    },
    files: {},
    ...overrides,
  };
}

// Assign ordering keys in array order. Excalidraw regenerates missing keys, but
// writing them keeps z-order stable across a round trip through the app.
export function reindex(elements) {
  elements.forEach((el, i) => { el.index = indexKey(i); });
  return elements;
}

export function readScene(path) {
  const scene = readJson(path);
  if (scene.type !== SCENE_TYPE) throw new Error(`not an excalidraw scene: ${path} (type "${scene.type}")`);
  scene.elements ??= [];
  scene.files ??= {};
  return scene;
}

export function writeScene(path, scene) {
  reindex(scene.elements);
  writeFileSync(path, `${JSON.stringify(scene, null, 2)}\n`);
  return path;
}

// ---------------------------------------------------------------- files (images)

// Excalidraw keys binary files by a content hash. Any stable unique string
// works; a sha256 prefix keeps identical images sharing one entry.
export function fileIdFor(bytes) {
  return sha256(bytes).slice(0, 40);
}

export function dataUrl(mime, bytes) {
  return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
}

export function addFile(scene, mime, bytes) {
  const id = fileIdFor(bytes);
  const at = now();
  scene.files[id] = { mimeType: mime, id, dataURL: dataUrl(mime, bytes), created: at, lastRetrieved: at };
  return id;
}

export function decodeDataUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('data:')) return null;
  const comma = url.indexOf(',');
  if (comma === -1) return null;
  const meta = url.slice(5, comma);
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const isB64 = /;base64/i.test(meta);
  try {
    const bytes = isB64
      ? Buffer.from(url.slice(comma + 1), 'base64')
      : Buffer.from(decodeURIComponent(url.slice(comma + 1)), 'utf8');
    return { mime, bytes, sha256: sha256(bytes) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- libraries

// .excalidrawlib comes in two shapes. Version 1 is `library: [[el,...],...]`,
// which is what almost every entry in the public index still uses; version 2 is
// `libraryItems: [{ id, name, elements, ... }]`. Read both, always write 2.
export function readLibrary(path) {
  const raw = readJson(path);
  if (raw.type !== LIB_TYPE) throw new Error(`not an excalidraw library: ${path} (type "${raw.type}")`);
  if (Array.isArray(raw.libraryItems)) {
    return raw.libraryItems.map((it, index) => ({
      index,
      id: it.id ?? newId(),
      name: it.name ?? '',
      status: it.status ?? 'unpublished',
      created: it.created ?? null,
      elements: it.elements ?? [],
    }));
  }
  if (Array.isArray(raw.library)) {
    return raw.library.map((elements, index) => ({
      index,
      id: elements[0]?.id ?? newId(),
      // v1 items carry no name of their own; the public index's itemNames array
      // is the only source, so callers fill this in when they have it.
      name: '',
      status: 'published',
      created: null,
      elements,
    }));
  }
  throw new Error(`library has neither libraryItems nor library: ${path}`);
}

// `files` carries the binaries for any image elements in the items. Not every
// Excalidraw build reads it back out of a library file, which is why raster
// icons are also kept as loose bytes in the icon store - see make-icon.mjs.
export function writeLibrary(path, items, files = null) {
  const doc = {
    type: LIB_TYPE,
    version: 2,
    source: SOURCE,
    libraryItems: items.map((it) => ({
      id: it.id ?? newId(),
      status: it.status ?? 'unpublished',
      created: it.created ?? now(),
      name: it.name ?? '',
      elements: it.elements,
    })),
  };
  if (files && Object.keys(files).length) doc.files = files;
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
  return path;
}

// ---------------------------------------------------------------- misc

export function normalizeName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Search aliases for a library-item or icon name: the slug, the slug without
// separators, and a CamelCase split so "AmazonS3" also matches "amazon s3".
export function nameAliases(name) {
  const set = new Set();
  const slug = normalizeName(name);
  if (slug) { set.add(slug.replace(/-/g, ' ')); set.add(slug.replace(/-/g, '')); }
  const camel = String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  const camelSlug = normalizeName(camel).replace(/-/g, ' ');
  if (camelSlug) set.add(camelSlug);
  return [...set];
}
