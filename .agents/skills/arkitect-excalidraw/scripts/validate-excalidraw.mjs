#!/usr/bin/env node
// Structural and layout validation for .excalidraw scenes and .excalidrawlib
// libraries.
//
//   node validate-excalidraw.mjs scene.excalidraw [--json] [--strict]
//
// Errors block delivery: they are the things that make Excalidraw drop an
// element, draw a broken arrow, or show an empty image box. Warnings are
// judgement calls - look at them against the render before deciding.
//
// Nothing here prints element text, only ids, counts and geometry.

import { readJson } from '../../arkitect-drawio/scripts/lib/read-json.mjs';
import {
  elementBox, bbox, decodeDataUrl, measureText, PALETTE, FONT, LINE_HEIGHT,
  parseCliOrExit, exitUsage, readProblem,
} from './lib/excalidraw-core.mjs';

const MAX_COORD = 200000;

const KNOWN_TYPES = new Set([
  'rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text', 'image',
  'freedraw', 'frame', 'magicframe', 'embeddable', 'iframe', 'selection',
]);

const CONTAINER_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'arrow', 'frame', 'magicframe']);
const PALETTE_STROKES = new Set(Object.values(PALETTE).map((p) => p.stroke));
const PALETTE_FILLS = new Set([...Object.values(PALETTE).map((p) => p.bg), 'transparent']);
const FONT_SIZES = new Set(Object.values(FONT));

// ---------------------------------------------------------------- structure

// Everything below reads element fields directly, and so do the geometry
// helpers in excalidraw-core. A file the app would never have written - a null
// element, a point that is not a pair, a width that is a string - used to reach
// them and throw, so the caller got a stack trace instead of a result and a
// batch stopped at that file (#154). Shape is checked first, and a document
// that fails here is returned without the semantic passes, whose answers would
// be about nothing. Diagnostics name fields and types, never values.

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const kindOf = (v) => (v === undefined ? 'missing'
  : v === null ? 'null'
  : Array.isArray(v) ? 'an array'
  : `a ${typeof v}`);

const shownType = (v) => (typeof v === 'string' ? JSON.stringify(v) : kindOf(v));

// Excalidraw keeps a connector's shape in points, so an arrow drawn straight
// down legitimately has width 0 and always has. A rectangle whose width is a
// string does not, and is an error rather than the same size warning.
const LINEAR = new Set(['arrow', 'line', 'freedraw']);

export function shapeErrors(elements, files) {
  const out = [];
  elements.forEach((el, i) => {
    if (!isObject(el)) { out.push(`element at index ${i} is ${kindOf(el)}, expected an object`); return; }
    const where = typeof el.id === 'string' && el.id ? `element "${el.id}"` : `element at index ${i}`;

    // Read on every element, deleted or not: byId hands a deleted element back
    // to the binding checks, which walk its boundElements and its type.
    if (el.id !== undefined && typeof el.id !== 'string') out.push(`${where} has a non-string id`);
    if (el.type !== undefined && typeof el.type !== 'string') out.push(`${where} has a non-string type`);
    for (const k of ['containerId', 'frameId', 'fileId']) {
      if (el[k] !== undefined && el[k] !== null && typeof el[k] !== 'string') out.push(`${where} has a non-string ${k}`);
    }
    if (el.groupIds !== undefined && el.groupIds !== null
      && (!Array.isArray(el.groupIds) || el.groupIds.some((g) => typeof g !== 'string'))) {
      out.push(`${where} has groupIds that are not a list of strings`);
    }
    if (el.boundElements !== undefined && el.boundElements !== null) {
      if (!Array.isArray(el.boundElements)) out.push(`${where} has a non-array boundElements`);
      else {
        el.boundElements.forEach((b, j) => {
          if (!isObject(b) || typeof b.id !== 'string') out.push(`${where} boundElements ${j} does not name an element id`);
        });
      }
    }
    if (el.isDeleted) return;

    // Geometry, which only live elements are measured by.
    for (const k of ['x', 'y']) {
      if (!Number.isFinite(el[k])) out.push(`${where} has non-numeric ${k}`);
    }
    for (const k of ['width', 'height']) {
      if (el[k] !== undefined && !Number.isFinite(el[k])) out.push(`${where} has non-numeric ${k}`);
    }
    if (el.points !== undefined && el.points !== null) {
      if (!Array.isArray(el.points)) out.push(`${where} has a non-array points`);
      else {
        el.points.forEach((p, j) => {
          if (!Array.isArray(p) || p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
            out.push(`${where} point ${j} is not a pair of numbers`);
          }
        });
      }
    }
    if ((el.type === 'arrow' || el.type === 'line') && (!Array.isArray(el.points) || el.points.length < 2)) {
      out.push(`${where} needs at least two points`);
    }
    for (const end of ['startBinding', 'endBinding']) {
      const bind = el[end];
      if (bind === undefined || bind === null) continue;
      if (!isObject(bind) || typeof bind.elementId !== 'string') out.push(`${where} has a ${end} that does not name an element`);
    }
    if (el.type === 'text') {
      if (el.text !== undefined && el.text !== null && typeof el.text !== 'string') out.push(`${where} has non-string text`);
      if (el.fontSize !== undefined && !Number.isFinite(el.fontSize)) out.push(`${where} has a non-numeric fontSize`);
    }
  });
  for (const [id, file] of Object.entries(files)) {
    if (!isObject(file)) out.push(`file "${id}" is ${kindOf(file)}, expected an object`);
  }
  return out;
}

export function validateScene(scene, { path = '<scene>' } = {}) {
  const errors = [];
  const warnings = [];
  const info = {};

  if (!isObject(scene)) {
    return { path, ok: false, errors: [`the scene is ${kindOf(scene)}, expected a JSON object`], warnings, info };
  }
  if (scene.type !== 'excalidraw') errors.push(`type is ${shownType(scene.type)}, expected "excalidraw"`);
  if (!Array.isArray(scene.elements)) {
    return { path, ok: false, errors: [...errors, 'elements is not an array'], warnings, info };
  }
  if (scene.files !== undefined && scene.files !== null && !isObject(scene.files)) {
    return { path, ok: false, errors: [...errors, 'files is not an object'], warnings, info };
  }
  const files = scene.files ?? {};
  const malformed = shapeErrors(scene.elements, files);
  if (malformed.length) return { path, ok: false, errors: [...errors, ...malformed], warnings, info };
  const live = scene.elements.filter((el) => !el.isDeleted);

  // ------------------------------------------------------------ identity

  const byId = new Map();
  for (const el of scene.elements) {
    if (!el.id) { errors.push('element with no id'); continue; }
    if (byId.has(el.id)) errors.push(`duplicate element id "${el.id}"`);
    byId.set(el.id, el);
    if (!KNOWN_TYPES.has(el.type)) warnings.push(`element "${el.id}" has unfamiliar type "${el.type}"`);
  }

  // ------------------------------------------------------------ geometry

  for (const el of live) {
    if (!LINEAR.has(el.type) && el.type !== 'text') {
      if (!(el.width > 0) || !(el.height > 0)) warnings.push(`element "${el.id}" has zero or negative size`);
    }
    const b = elementBox(el);
    if (Math.abs(b.x) > MAX_COORD || Math.abs(b.y) > MAX_COORD) {
      warnings.push(`element "${el.id}" sits outside +/-${MAX_COORD}px`);
    }
  }

  // ------------------------------------------------------------ bindings

  let boundText = 0;
  let boundArrows = 0;
  for (const el of live) {
    if (Array.isArray(el.boundElements)) {
      for (const b of el.boundElements) {
        const target = byId.get(b.id);
        if (!target) { errors.push(`element "${el.id}" lists bound element "${b.id}" which does not exist`); continue; }
        if (target.isDeleted) warnings.push(`element "${el.id}" is bound to deleted element "${b.id}"`);
        if (b.type === 'text') {
          boundText++;
          if (target.containerId !== el.id) {
            errors.push(`text "${b.id}" is listed on "${el.id}" but its containerId is "${target.containerId ?? 'null'}"`);
          }
          if (!CONTAINER_TYPES.has(el.type)) {
            errors.push(`element "${el.id}" is a ${el.type} and cannot hold bound text`);
          }
        }
      }
    }
    if (el.type === 'text' && el.containerId) {
      const container = byId.get(el.containerId);
      if (!container) errors.push(`text "${el.id}" names missing container "${el.containerId}"`);
      else if (!(container.boundElements ?? []).some((b) => b.id === el.id)) {
        errors.push(`container "${el.containerId}" does not list its bound text "${el.id}"`);
      }
    }
    for (const end of ['startBinding', 'endBinding']) {
      const bind = el[end];
      if (!bind) continue;
      boundArrows++;
      const target = byId.get(bind.elementId);
      if (!target) { errors.push(`arrow "${el.id}" ${end} points at missing element "${bind.elementId}"`); continue; }
      if (!(target.boundElements ?? []).some((b) => b.id === el.id)) {
        errors.push(`arrow "${el.id}" binds to "${bind.elementId}" but that element does not list it back`);
      }
    }
    if (el.frameId) {
      const fr = byId.get(el.frameId);
      if (!fr) errors.push(`element "${el.id}" names missing frame "${el.frameId}"`);
      else if (fr.type !== 'frame' && fr.type !== 'magicframe') {
        errors.push(`element "${el.id}" names "${el.frameId}" as its frame but that is a ${fr.type}`);
      }
    }
  }

  let floating = 0;
  for (const el of live) {
    if (el.type !== 'arrow') continue;
    // An arrow inside a group is composition - a legend sample, a drawn glyph -
    // and is not meant to track anything, so it is counted but not flagged.
    const decorative = (el.groupIds ?? []).length > 0;
    if (!el.startBinding && !el.endBinding) {
      floating++;
      if (!decorative) warnings.push(`arrow "${el.id}" is bound at neither end; it will not follow the shapes it connects`);
    } else if ((!el.startBinding || !el.endBinding) && !decorative) {
      warnings.push(`arrow "${el.id}" is bound at only one end`);
    }
    // Every point in one place draws a bare arrowhead. Builds before 2.0.0 made
    // one for each edge from a node to itself (#159).
    const pts = el.points ?? [];
    if (!decorative && pts.length > 1 && pts.every(([x, y]) => x === pts[0][0] && y === pts[0][1])) {
      warnings.push(`arrow "${el.id}" has zero length and draws as a bare arrowhead; `
        + 'a loop built before 2.0.0 does this, and a rebuild draws it over a corner');
    }
  }

  // ------------------------------------------------------------ files

  let images = 0;
  const referenced = new Set();
  for (const el of live) {
    if (el.type !== 'image') continue;
    images++;
    if (!el.fileId) { errors.push(`image "${el.id}" has no fileId`); continue; }
    referenced.add(el.fileId);
    const file = files[el.fileId];
    if (!file) { errors.push(`image "${el.id}" references file "${el.fileId}" which is not in files`); continue; }
    const decoded = decodeDataUrl(file.dataURL);
    if (!decoded || !decoded.bytes.length) errors.push(`file "${el.fileId}" has an unreadable dataURL`);
    if (typeof file.dataURL === 'string' && !file.dataURL.startsWith('data:')) {
      errors.push(`file "${el.fileId}" is a remote URL; the scene will not be portable`);
    }
  }
  for (const id of Object.keys(files)) {
    if (!referenced.has(id)) warnings.push(`file "${id}" is embedded but no element uses it`);
  }

  // ------------------------------------------------------------ ordering

  const indexed = scene.elements.filter((el) => typeof el.index === 'string');
  if (indexed.length && indexed.length !== scene.elements.length) {
    warnings.push(`${scene.elements.length - indexed.length} elements have no index key; Excalidraw will regenerate the z-order`);
  }
  for (let i = 1; i < indexed.length; i++) {
    if (indexed[i - 1].index >= indexed[i].index) {
      errors.push(`index keys are not increasing at position ${i} ("${indexed[i - 1].index}" then "${indexed[i].index}")`);
      break;
    }
  }
  // A frame comes after all of its children: Excalidraw's renderer relies on
  // the order to clip them (#192).
  const at = new Map(live.map((el, i) => [el.id, i]));
  for (const fr of live.filter((el) => el.type === 'frame' || el.type === 'magicframe')) {
    const late = live.filter((el) => el.frameId === fr.id && at.get(el.id) > at.get(fr.id)).length;
    if (late) {
      warnings.push(`frame "${fr.id}" comes before ${late} of its children; Excalidraw expects children first. `
        + 'A scene built before 2.0.0 does this: rebuild it from its spec');
    }
  }

  // ------------------------------------------------------------ layout

  // Only leaf shapes count. Containers enclose their children by design, frames
  // enclose their members, bound text sits inside its container, and arrows cross
  // things on purpose.
  const isLeaf = (el) => ['rectangle', 'ellipse', 'diamond', 'image'].includes(el.type)
    && !el.containerId
    && !live.some((k) => k.frameId === el.id)
    && !(el.boundElements ?? []).some((b) => b.type !== 'text' && byId.get(b.id)?.frameId === el.id);

  const scopeLike = new Set();
  for (const el of live) {
    if (el.type !== 'rectangle' && el.type !== 'ellipse') continue;
    const box = elementBox(el);
    const encloses = live.filter((o) => o !== el && o.type !== 'arrow' && o.type !== 'line' && o.containerId !== el.id).filter((o) => {
      const b = elementBox(o);
      return b.x >= box.x && b.y >= box.y && b.x + b.width <= box.x + box.width && b.y + b.height <= box.y + box.height;
    });
    if (encloses.length >= 2) scopeLike.add(el.id);
  }

  const leaves = live.filter((el) => isLeaf(el) && !scopeLike.has(el.id));
  const shareGroup = (a, b) => (a.groupIds ?? []).some((g) => (b.groupIds ?? []).includes(g));
  let overlaps = 0;
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = elementBox(leaves[i]);
      const b = elementBox(leaves[j]);
      if (leaves[i].frameId !== leaves[j].frameId) continue;
      // Pieces of one composed shape are meant to sit on top of each other.
      if (shareGroup(leaves[i], leaves[j])) continue;
      const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (ox > 1 && oy > 1) {
        overlaps++;
        if (overlaps <= 10) {
          warnings.push(`elements "${leaves[i].id}" and "${leaves[j].id}" overlap by ${Math.round(ox)}x${Math.round(oy)}px`);
        }
      }
    }
  }

  let tight = 0;
  for (const el of live) {
    if (el.type !== 'text' || !el.containerId) continue;
    const container = byId.get(el.containerId);
    if (!container || container.type === 'arrow') continue;
    const m = measureText(el.text ?? '', el.fontSize ?? 16, el.fontFamily ?? 1);
    // A diamond only offers half its width on the centre line, an ellipse about
    // 1/sqrt(2); the usable box is not the bounding box.
    const factor = container.type === 'diamond' ? 0.5 : container.type === 'ellipse' ? 0.7 : 1;
    if (m.width > container.width * factor - 8 || m.height > container.height * factor - 4) {
      tight++;
      if (tight <= 10) {
        warnings.push(`label in ${container.type} "${container.id}" needs about ${Math.round(m.width)}x${Math.round(m.height)}px `
          + `but only ${Math.round(container.width * factor)}x${Math.round(container.height * factor)}px is usable`);
      }
    }
  }

  const crossings = connectorCrossings(live);
  for (const c of crossings.slice(0, 10)) {
    warnings.push(`arrow "${c.arrow}" crosses "${c.node}", which it does not connect; move that shape off the line or give the edge "route": "avoid"`);
  }

  // ------------------------------------------------------------ house style

  const offPalette = new Set();
  const offSizes = new Set();
  for (const el of live) {
    if (el.strokeColor && el.strokeColor !== 'transparent' && !PALETTE_STROKES.has(el.strokeColor)) offPalette.add(el.strokeColor);
    if (el.backgroundColor && !PALETTE_FILLS.has(el.backgroundColor)) offPalette.add(el.backgroundColor);
    if (el.type === 'text' && !FONT_SIZES.has(el.fontSize)) offSizes.add(el.fontSize);
  }

  const view = bbox(live);
  info.elements = live.length;
  info.deleted = scene.elements.length - live.length;
  info.byType = live.reduce((acc, el) => { acc[el.type] = (acc[el.type] ?? 0) + 1; return acc; }, {});
  info.boundText = boundText;
  info.boundArrowEnds = boundArrows;
  info.floatingArrows = floating;
  info.images = images;
  info.embeddedFiles = Object.keys(files).length;
  info.overlaps = overlaps;
  info.tightLabels = tight;
  info.crossings = crossings.length;
  info.canvas = { width: Math.round(view.width), height: Math.round(view.height) };
  // Off-palette colour is legal Excalidraw and sometimes correct - a brand
  // colour in a traced logo, for one - so it is reported, never failed.
  info.offPalette = [...offPalette].slice(0, 12);
  info.nonStandardFontSizes = [...offSizes];

  return { path, ok: errors.length === 0, errors, warnings, info };
}

// Arrows that run through a shape they do not connect, which makes that shape
// read as part of the flow (#125). A shape is one ungrouped rectangle, ellipse,
// diamond or image, or one outermost group - an icon, a cylinder - taken as the
// box around its non-text pieces. Anything that encloses another shape is a
// boundary, and arrows cross boundaries on purpose. Grouped arrows are legend
// samples and drawn glyphs, so they are skipped like everywhere else.
//
// Returns [{ arrow, node, members }]: the arrow's id, the id naming the shape
// and every element id in it, so a caller that knows the spec can name both.
export function connectorCrossings(elements) {
  const live = elements.filter((el) => !el.isDeleted);
  const SHAPES = new Set(['rectangle', 'ellipse', 'diamond', 'image', 'line', 'freedraw']);
  const units = new Map();
  for (const el of live) {
    if (!SHAPES.has(el.type) || el.containerId) continue;
    const groups = el.groupIds ?? [];
    if (!groups.length && (el.type === 'line' || el.type === 'freedraw')) continue;
    const key = groups.length ? `g:${groups[groups.length - 1]}` : `e:${el.id}`;
    if (!units.has(key)) units.set(key, []);
    units.get(key).push(el);
  }
  const grouped = new Set(live.filter((el) => el.type === 'arrow' && (el.groupIds ?? []).length)
    .map((el) => `g:${el.groupIds[el.groupIds.length - 1]}`));
  const shapes = [];
  for (const [key, members] of units) {
    if (grouped.has(key)) continue;
    const b = bbox(members);
    if (!(b.width > 0) || !(b.height > 0)) continue;
    const largest = members.reduce((best, el) => (el.width * el.height > best.width * best.height ? el : best));
    shapes.push({ id: largest.id, members: new Set(members.map((el) => el.id)), box: b });
  }
  const inside = (outer, inner) => inner !== outer && inner.box.x >= outer.box.x && inner.box.y >= outer.box.y
    && inner.box.x + inner.box.width <= outer.box.x + outer.box.width
    && inner.box.y + inner.box.height <= outer.box.y + outer.box.height;
  const obstacles = shapes.filter((s) => !shapes.some((o) => inside(s, o)));

  const found = [];
  for (const a of live) {
    if (a.type !== 'arrow' || (a.groupIds ?? []).length || !Array.isArray(a.points) || a.points.length < 2) continue;
    const pts = a.points.map(([px, py]) => ({ x: a.x + px, y: a.y + py }));
    const ends = [a.startBinding?.elementId, a.endBinding?.elementId].filter(Boolean);
    for (const s of obstacles) {
      if (ends.some((id) => s.members.has(id))) continue;
      // An unbound end that starts or stops inside a shape belongs to it.
      if ([pts[0], pts[pts.length - 1]].some((p) => pointIn(p, s.box))) continue;
      for (let i = 1; i < pts.length; i++) {
        if (segmentHitsBox(pts[i - 1], pts[i], s.box)) { found.push({ arrow: a.id, node: s.id, members: [...s.members] }); break; }
      }
    }
  }
  return found;
}

const pointIn = (p, b) => p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;

// Liang-Barsky against the box shrunk by a pixel, so a line that only grazes
// an edge does not count.
function segmentHitsBox(p, q, box) {
  const x0 = box.x + 1, y0 = box.y + 1, x1 = box.x + box.width - 1, y1 = box.y + box.height - 1;
  if (x1 <= x0 || y1 <= y0) return false;
  const dx = q.x - p.x, dy = q.y - p.y;
  let t0 = 0, t1 = 1;
  for (const [pk, qk] of [[-dx, p.x - x0], [dx, x1 - p.x], [-dy, p.y - y0], [dy, y1 - p.y]]) {
    if (pk === 0) { if (qk < 0) return false; continue; }
    const r = qk / pk;
    if (pk < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 < t1;
}

export function validateLibrary(doc, { path = '<library>' } = {}) {
  const errors = [];
  const warnings = [];
  const info = {};
  if (!isObject(doc)) {
    return { path, ok: false, errors: [`the library is ${kindOf(doc)}, expected a JSON object`], warnings, info };
  }
  if (doc.type !== 'excalidrawlib') errors.push(`type is ${shownType(doc.type)}, expected "excalidrawlib"`);
  if (doc.files !== undefined && doc.files !== null && !isObject(doc.files)) errors.push('files is not an object');
  const files = isObject(doc.files) ? doc.files : {};
  // A v2 entry that is not an object is kept in place, so every other item is
  // still reported rather than lost behind the first malformed one.
  const items = Array.isArray(doc.libraryItems)
    ? doc.libraryItems.map((it) => (isObject(it) ? it.elements ?? [] : it))
    : Array.isArray(doc.library) ? doc.library : null;
  if (!items) {
    return { path, ok: false, errors: [...errors, 'neither libraryItems nor library present'], warnings, info };
  }
  items.forEach((elements, i) => {
    if (!Array.isArray(elements)) { errors.push(`item ${i} is ${kindOf(elements)}, expected a list of elements`); return; }
    if (!elements.length) { errors.push(`item ${i} has no elements`); return; }
    const r = validateScene({ type: 'excalidraw', elements, files }, { path: `${path}#${i}` });
    for (const e of r.errors) errors.push(`item ${i}: ${e}`);
    for (const w of r.warnings.filter((w) => !w.includes('is bound at neither end'))) warnings.push(`item ${i}: ${w}`);
  });
  info.items = items.length;
  info.version = doc.version;
  return { path, ok: errors.length === 0, errors, warnings, info };
}

export function validateFile(path) {
  let doc;
  try {
    doc = readJson(path);
  } catch (e) {
    // Never Node's JSON message: it quotes the file's own text.
    return { path, ok: false, errors: [readProblem(path, e)], warnings: [], info: {} };
  }
  try {
    return isObject(doc) && doc.type === 'excalidrawlib'
      ? validateLibrary(doc, { path })
      : validateScene(doc, { path });
  } catch (error) {
    // A backstop, not the mechanism: shape is checked before anything reads it.
    // Whatever gets past that, one malformed file must not cost the caller the
    // rest of its batch (#154).
    return { path, ok: false, errors: [`could not be validated: ${error.message}`], warnings: [], info: {} };
  }
}

const USAGE = 'usage: validate-excalidraw.mjs <file...> [--json] [--strict]';

// Said where the agent reads it, just before it reports: a warning printed
// here is a defect still in the drawing until it is fixed (#248).
export const WARNINGS_LEFT = '   each warning is a defect still in the drawing: fix it, or quote it in '
  + 'your report as printed, every id included, never as "minor" or "expected"';

function main(argv) {
  const { options, positionals: files } = parseCliOrExit(argv, { switches: ['--json', '--strict'] }, USAGE);
  const { json, strict } = options;
  if (!files.length) exitUsage('expected at least one .excalidraw or .excalidrawlib file', USAGE);

  let bad = 0;
  for (const f of files) {
    const r = validateFile(f);
    if (json) console.log(JSON.stringify(r, null, 2));
    else {
      const warned = r.warnings.length ? `, ${r.warnings.length} warning${r.warnings.length > 1 ? 's' : ''}` : '';
      console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${f}${warned}`);
      const i = r.info;
      if (i.elements !== undefined) {
        console.log(`   ${i.elements} elements ${JSON.stringify(i.byType)}`);
        console.log(`   ${i.boundText} bound labels, ${i.boundArrowEnds} bound arrow ends, `
          + `${i.images} images / ${i.embeddedFiles} files, canvas ${i.canvas.width}x${i.canvas.height}`
          + `${i.overlaps ? `, ${i.overlaps} overlaps` : ''}${i.tightLabels ? `, ${i.tightLabels} tight labels` : ''}`);
        if (i.offPalette?.length) console.log(`   off-palette colours: ${i.offPalette.join(' ')}`);
      } else if (i.items !== undefined) {
        console.log(`   library v${i.version}, ${i.items} items`);
      }
      for (const e of r.errors) console.log(`   ERROR  ${e}`);
      for (const w of r.warnings) console.log(`   warn   ${w}`);
      if (r.warnings.length) console.log(WARNINGS_LEFT);
    }
    if (!r.ok || (strict && r.warnings.length)) bad++;
  }
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('validate-excalidraw.mjs')) main(process.argv.slice(2));
