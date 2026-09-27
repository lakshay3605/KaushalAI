#!/usr/bin/env node
// Structural and layout validation for generated .drawio files.
//
//   node validate-drawio.mjs <file> [--page N] [--json] [--strict]
//
// Errors block delivery; warnings are judgement calls to look at in the render.
// Nothing here prints cell labels - only ids, counts and geometry.

import { readFileSync } from 'node:fs';
import {
  readMxfile, extractCells, parseStyle, parseDataUri, graphModelAttrs,
  parseCliOrExit, exitUsage, pageIndexArg, pageRangeError,
} from './lib/drawio-core.mjs';
import { checkXml } from './lib/xml-check.mjs';
import { routeThrough, crosses, captionBox, lengthOf, pointAt } from './lib/routes.mjs';

const USAGE = 'usage: validate-drawio.mjs <file...> [--page N] [--json] [--strict]';

const MAX_COORD = 20000;      // draw.io stays usable well below this
const MIN_GAP = 8;            // px of clear space expected between siblings
const TRUNK_MIN = 10;         // px two edges may share into one port (#246)
const SLIDE_WIDTH = 1920;     // px a page is fit to when it is shown (#247)
const TEXT_FLOOR = 9;         // px a label may shrink to at that width (#247)

function absoluteGeometry(cells) {
  const byId = new Map(cells.map((c) => [c.id, c]));
  const abs = new Map();
  const resolve = (c, seen = new Set()) => {
    if (abs.has(c.id)) return abs.get(c.id);
    if (seen.has(c.id)) return null;         // parent cycle
    seen.add(c.id);
    const g = c.geometry;
    if (!g || g.x == null || g.relative) return null;
    const parent = byId.get(c.parent);
    let ox = 0; let oy = 0;
    if (parent && parent.id !== '0' && parent.id !== '1') {
      const p = resolve(parent, seen);
      if (p) { ox = p.x; oy = p.y; }
    }
    const box = { x: g.x + ox, y: g.y + oy, width: g.width ?? 0, height: g.height ?? 0 };
    abs.set(c.id, box);
    return box;
  };
  for (const c of cells) if (c.vertex) resolve(c);
  return abs;
}

// A label's visible lines, with Draw.io's HTML taken out.
const textLines = (value) => value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .split('\n').map((l) => l.trim());

const isContainerish = (style) => {
  const s = parseStyle(style);
  return s.container === '1' || s.swimlane !== undefined || s.group !== undefined
    || String(s.shape ?? '').includes('group') || s.childLayout !== undefined;
};

export function validateFile(path, { pageIndex = null } = {}) {
  // A malformed index is the caller's bug; a page the file lacks is the file's.
  if (pageIndex !== null && !(Number.isSafeInteger(pageIndex) && pageIndex >= 0)) {
    const shown = typeof pageIndex === 'string' ? JSON.stringify(pageIndex) : String(pageIndex);
    throw new TypeError(`pageIndex must be a non-negative integer or null, got ${shown}`);
  }
  const errors = [];
  const warnings = [];
  // Neither a warning nor a failure: what the page claims, for a person to check.
  const notes = [];
  const info = {};
  const text = readFileSync(path, 'utf8');

  // A forgiving tag scanner is what extractCells needs - it has to keep going
  // through a page it only half understands - but it cannot tell a native
  // Draw.io file from a malformed one, so a mismatched closing tag used to get
  // a clean PASS (#155). The strict reader the packs check their SVG payloads
  // with answers that question, here over the wrapper and then over each page
  // that had to be decoded first. It is dependency-free, reads the text once,
  // and reports element and attribute names and a position - never an attribute
  // value - so no label or image payload reaches the output.
  const wrapper = checkXml(text);
  if (!wrapper.ok) {
    errors.push(`not well-formed XML at line ${wrapper.line}, column ${wrapper.column}: ${wrapper.reason}`);
    return { path, ok: false, errors, warnings, notes, info };
  }
  // The wrapper string checks this replaces could not see a declaration or a
  // comment around the root, both of which XML allows; the parse can.
  if (wrapper.root.name !== 'mxfile') {
    errors.push(`the root element is <${wrapper.root.name}>, not <mxfile>`);
    return { path, ok: false, errors, warnings, notes, info };
  }

  let mx;
  try {
    mx = readMxfile(path);
  } catch (e) {
    return { path, ok: false, errors: [`unparseable: ${e.message}`], warnings, notes, info };
  }
  if (!mx.pages.length) errors.push('no <diagram> pages found');
  // Selecting a page that is not there must fail, never pass having checked nothing.
  else if (pageIndex !== null && pageIndex >= mx.pages.length) errors.push(pageRangeError(path, pageIndex, mx.pages.length));

  const pageIds = new Set();
  const pageNames = new Set();
  const pages = [];

  mx.pages.forEach((page, idx) => {
    if (pageIndex !== null && idx !== pageIndex) return;
    const label = `page ${idx}`;
    if (!page.id) errors.push(`${label}: missing id`);
    else if (pageIds.has(page.id)) errors.push(`${label}: duplicate page id`);
    pageIds.add(page.id);
    if (!page.name) warnings.push(`${label}: unnamed page`);
    else if (pageNames.has(page.name)) warnings.push(`${label}: duplicate page name`);
    pageNames.add(page.name);

    let xml;
    try {
      xml = page.xml;
    } catch (e) {
      errors.push(`${label}: cannot decode page (${e.message})`);
      return;
    }
    // An uncompressed page sits inside the wrapper the check above already
    // read; a compressed one is base64 there and is only XML once decoded.
    if (page.compressed) {
      const decoded = checkXml(xml);
      if (!decoded.ok) {
        errors.push(`${label}: not well-formed XML at line ${decoded.line}, column ${decoded.column}: ${decoded.reason}`);
        return;
      }
    }
    if (!/<mxGraphModel\b/.test(xml)) { errors.push(`${label}: no <mxGraphModel>`); return; }
    if (!/<root>/.test(xml)) errors.push(`${label}: no <root> element`);

    const cells = extractCells(xml);
    const ids = new Set();
    const dupes = new Set();
    for (const c of cells) {
      if (!c.id) errors.push(`${label}: cell with empty id`);
      else if (ids.has(c.id)) dupes.add(c.id);
      ids.add(c.id);
    }
    for (const d of dupes) errors.push(`${label}: duplicate cell id "${d}"`);

    if (!ids.has('0') || !ids.has('1')) errors.push(`${label}: missing root cells 0 and 1`);

    for (const c of cells) {
      if (c.id === '0') continue;
      if (!c.parent) { errors.push(`${label}: cell "${c.id}" has no parent`); continue; }
      if (!ids.has(c.parent)) errors.push(`${label}: cell "${c.id}" references missing parent "${c.parent}"`);
    }

    let dangling = 0;
    for (const c of cells) {
      if (!c.edge) continue;
      for (const [end, ref] of [['source', c.source], ['target', c.target]]) {
        if (!ref) { dangling++; warnings.push(`${label}: edge "${c.id}" has no ${end} (floating endpoint)`); continue; }
        if (!ids.has(ref)) errors.push(`${label}: edge "${c.id}" ${end} "${ref}" does not exist`);
      }
    }

    let embedded = 0; let remote = 0;
    for (const c of cells) {
      const s = parseStyle(c.style);
      if (!s.image) continue;
      const v = String(s.image);
      if (v.startsWith('data:')) {
        const d = parseDataUri(v);
        if (!d || !d.bytes.length) errors.push(`${label}: cell "${c.id}" has an unreadable embedded image`);
        else embedded++;
      } else {
        remote++;
        warnings.push(`${label}: cell "${c.id}" points at an external image; the diagram will not be portable`);
      }
    }

    const abs = absoluteGeometry(cells);
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const [id, b] of abs) {
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) { errors.push(`${label}: cell "${id}" has non-numeric geometry`); continue; }
      if (b.width <= 0 || b.height <= 0) warnings.push(`${label}: cell "${id}" has zero or negative size`);
      if (Math.abs(b.x) > MAX_COORD || Math.abs(b.y) > MAX_COORD) {
        warnings.push(`${label}: cell "${id}" sits outside +/-${MAX_COORD}px`);
      }
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
    }

    // Overlap check: only leaf vertices sharing a parent. Containers enclose
    // their children by design, and transparent text cells are routinely laid
    // over icons as captions, so neither counts as a collision.
    const isTransparentLabel = (style) => {
      const s = parseStyle(style);
      if (s.text !== undefined) return true;
      const noFill = s.fillColor === 'none' || s.fillColor === undefined;
      const noStroke = s.strokeColor === 'none';
      return noFill && noStroke && s.image === undefined && s.shape === undefined;
    };
    const leaves = cells.filter((c) => c.vertex && abs.has(c.id) && !isContainerish(c.style)
      && !isTransparentLabel(c.style)
      && !cells.some((k) => k.parent === c.id));
    let overlaps = 0;
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const A = leaves[i]; const B = leaves[j];
        if (A.parent !== B.parent) continue;
        const a = abs.get(A.id); const b = abs.get(B.id);
        const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (ox > 0 && oy > 0) {
          overlaps++;
          if (overlaps <= 10) warnings.push(`${label}: cells "${A.id}" and "${B.id}" overlap by ${Math.round(ox)}x${Math.round(oy)}px`);
        } else if (ox > -MIN_GAP && oy > 0 && ox <= 0) {
          // touching but not overlapping - only interesting when flush
        }
      }
    }

    // Clipped-label heuristic. Captions rendered below an icon may legally
    // overflow the cell, so only in-box labels are checked.
    let clipped = 0;
    for (const c of cells) {
      if (!c.vertex || !c.value) continue;
      const s = parseStyle(c.style);
      if (s.verticalLabelPosition === 'bottom' || s.verticalLabelPosition === 'top') continue;
      if (isContainerish(c.style)) continue;
      const g = abs.get(c.id);
      if (!g || !g.width) continue;
      const longest = Math.max(...textLines(c.value).map((l) => l.length), 0);
      const size = Number(s.fontSize ?? 12);
      const wrap = s.whiteSpace === 'wrap';
      const estimated = longest * size * 0.55;
      if (!wrap && estimated > g.width + 4) {
        clipped++;
        if (clipped <= 10) warnings.push(`${label}: cell "${c.id}" label needs ~${Math.round(estimated)}px but the box is ${Math.round(g.width)}px and does not wrap`);
      }
    }

    // Crossings (#45, #242). Each edge's route is estimated from its two ports
    // and its waypoints, and tested against every other node's box and every
    // caption, its own ends' captions included: a caption hangs below its icon,
    // where an edge attached to the icon's bottom runs straight through it.
    const captions = [];
    for (const c of cells) {
      if (!c.vertex || !c.value) continue;
      const s = parseStyle(c.style);
      if (s.verticalLabelPosition !== 'bottom') continue;
      const g = abs.get(c.id);
      if (!g) continue;
      captions.push({ id: c.id, ...captionBox(g, textLines(c.value), Number(s.fontSize ?? 12)) });
    }
    // An unconstrained end goes where Draw.io's orthogonal router puts it
    // (mxEdgeStyle.OrthConnector): boxes apart on both axes get an L that
    // leaves the source sideways and enters the target from above or below;
    // apart on one axis, both ends face each other across it; otherwise both
    // are vertical. The port is the middle of that side.
    const port = (box, style, end, other) => {
      const s = parseStyle(style);
      if (s[`${end}X`] !== undefined && s[`${end}Y`] !== undefined) {
        const ry = Number(s[`${end}Y`]);
        return {
          x: box.x + Number(s[`${end}X`]) * box.width + Number(s[`${end}Dx`] ?? 0),
          y: box.y + ry * box.height + Number(s[`${end}Dy`] ?? 0),
          vertical: ry === 0 || ry === 1,
        };
      }
      const left = box.x - (other.x + other.width); const right = other.x - (box.x + box.width);
      const up = box.y - (other.y + other.height); const down = other.y - (box.y + box.height);
      const h = Math.max(left, right) > 0; const v = Math.max(up, down) > 0;
      if (h && (!v || end === 'exit')) {
        return { x: left >= right ? box.x : box.x + box.width, y: box.y + box.height / 2, vertical: false };
      }
      return { x: box.x + box.width / 2, y: up >= down ? box.y : box.y + box.height, vertical: true };
    };
    // Only leaves are in the way. An edge between zones crosses container
    // borders by design, and text cells over containers are #243's.
    let nodeCrossings = 0; let captionCrossings = 0;
    const routes = [];
    for (const c of cells) {
      if (!c.edge) continue;
      const a = abs.get(c.source); const b = abs.get(c.target);
      if (!a || !b) continue;
      // Waypoints are in the coordinates of the edge's parent.
      const o = abs.get(c.parent) ?? { x: 0, y: 0 };
      const points = c.points.map((pt) => ({ x: pt.x + o.x, y: pt.y + o.y }));
      const dot = (pt) => pt && { ...pt, width: 0, height: 0 };
      const exit = port(a, c.style, 'exit', dot(points[0]) ?? b);
      const entry = port(b, c.style, 'entry', dot(points.at(-1)) ?? a);
      const segments = routeThrough(exit, points, entry);
      routes.push({ id: c.id, source: c.source, target: c.target, entry, segments });
      const hits = (box) => segments.some((segment) => crosses(segment, box));
      const through = new Set();
      for (const o of leaves) {
        if (o.id === c.source || o.id === c.target || !hits(abs.get(o.id))) continue;
        through.add(o.id);
        nodeCrossings++;
        if (nodeCrossings <= 10) warnings.push(`${label}: edge "${c.id}" runs through "${o.id}"`);
      }
      for (const cap of captions) {
        if (through.has(cap.id) || !hits(cap)) continue;
        captionCrossings++;
        if (captionCrossings <= 10) warnings.push(`${label}: edge "${c.id}" runs through the caption of "${cap.id}"`);
      }
    }

    // Shared trunks (#246). Two edges that reach the same port along the same
    // line draw as one, with one arrowhead; two between the same pair of nodes,
    // either way, draw as one double-headed line (#272). TRUNK_MIN is in
    // maintenance.md.
    const shared = (r, s) => {
      let n = 0;
      for (const [p, q] of r.segments) {
        for (const [u, w] of s.segments) {
          const flat = Math.abs(p.y - q.y) < 1 && Math.abs(u.y - w.y) < 1 && Math.abs(p.y - u.y) < 1;
          const upright = Math.abs(p.x - q.x) < 1 && Math.abs(u.x - w.x) < 1 && Math.abs(p.x - u.x) < 1;
          const k = flat ? 'x' : upright ? 'y' : null;
          if (k) n += Math.max(0, Math.min(Math.max(p[k], q[k]), Math.max(u[k], w[k])) - Math.max(Math.min(p[k], q[k]), Math.min(u[k], w[k])));
        }
      }
      return n;
    };
    let sharedTrunks = 0;
    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        const r = routes[i]; const s = routes[j];
        const port = r.target === s.target && Math.abs(r.entry.x - s.entry.x) < 1 && Math.abs(r.entry.y - s.entry.y) < 1;
        const pair = (r.source === s.source && r.target === s.target) || (r.source === s.target && r.target === s.source);
        if (!port && !pair) continue;
        const n = shared(r, s);
        if (n <= TRUNK_MIN) continue;
        sharedTrunks++;
        if (sharedTrunks > 10) continue;
        warnings.push(port
          ? `${label}: edges "${r.id}" and "${s.id}" share ${Math.round(n)}px of line into the same port of "${r.target}"`
          : `${label}: edges "${r.id}" and "${s.id}" between "${r.source}" and "${r.target}" share ${Math.round(n)}px of line`);
      }
    }

    // An icon no edge touches claims no relation, and a reader supplies one
    // (#244). A deliberate shared tier is fine; the note only asks.
    const edges = cells.filter((c) => c.edge);
    const ended = new Set(edges.flatMap((c) => [c.source, c.target]));
    const isIcon = (style) => {
      const s = parseStyle(style);
      return s.image !== undefined || String(s.shape ?? '').startsWith('mxgraph.');
    };
    const alone = leaves.filter((c) => isIcon(c.style) && !ended.has(c.id)).map((c) => c.id);
    if (alone.length) {
      notes.push(`${label}: ${alone.length} icon${alone.length > 1 ? 's have' : ' has'} no edge: ${alone.join(', ')}`);
    }

    // An edge that ends on a container is drawn to its border, where it reads
    // as the call of whichever child sits nearest (#245). Sometimes meant.
    const containers = new Set(cells.filter((c) => c.vertex && isContainerish(c.style)).map((c) => c.id));
    for (const c of edges) {
      for (const end of [c.source, c.target]) {
        if (!containers.has(end)) continue;
        const kids = cells.filter((k) => k.vertex && k.parent === end).map((k) => k.id);
        notes.push(`${label}: edge "${c.id}" ends on the border of container "${end}"`
          + `${kids.length ? `; if one child is meant, connect it: ${kids.join(', ')}` : ''}`);
      }
    }

    // Text on a container (#243): a title, legend or edge label that lies
    // across a container's border, or over the strip its own label is drawn
    // in. The overlap check above skips both text and containers. Each text is
    // measured by its lines, not its cell, which may be far wider.
    const extent = (lines, s) => {
      const size = Number(s.fontSize ?? 12);
      return { width: Math.max(...lines.map((l) => l.length), 0) * size * (s.fontStyle & 1 ? 0.6 : 0.55), height: lines.length * size * 1.25 };
    };
    const texts = [];
    for (const c of cells) {
      if (!c.vertex || !c.value || !isTransparentLabel(c.style) || !abs.has(c.id)) continue;
      const lines = textLines(c.value).filter(Boolean);
      if (!lines.length) continue;
      const s = parseStyle(c.style); const g = abs.get(c.id);
      const t = extent(lines, s);
      const width = Math.min(t.width, g.width);
      const height = Math.min(t.height * Math.ceil(t.width / (g.width || 1)), g.height);
      const x = s.align === 'left' ? g.x : s.align === 'right' ? g.x + g.width - width : g.x + (g.width - width) / 2;
      const y = s.verticalAlign === 'top' ? g.y : s.verticalAlign === 'bottom' ? g.y + g.height - height : g.y + (g.height - height) / 2;
      texts.push({ id: `"${c.id}"`, box: { x, y, width, height } });
    }
    // An edge's label sits along its route: geometry x runs from -1 at the
    // source to 1 at the target, over the whole length.
    const along = (segments, x) => pointAt(segments, ((x ?? 0) + 1) / 2 * lengthOf(segments));
    const routeOf = new Map(routes.map((r) => [r.id, r.segments]));
    // How far each label's chip ends before its arrowhead, along the route (#241).
    const labels = [];
    for (const c of cells) {
      const segments = routeOf.get(c.edge ? c.id : c.parent);
      if (!segments || !c.value || (!c.edge && !c.geometry?.relative)) continue;
      const lines = textLines(c.value).filter(Boolean);
      if (!lines.length) continue;
      const t = extent(lines, parseStyle(c.style));
      const at = along(segments, c.geometry?.x);
      const o = c.geometry?.offset ?? { x: 0, y: 0 };
      const [p, q] = segments.at(-1);
      const half = Math.abs(p.y - q.y) < 1 ? t.width / 2 + 2 : t.height / 2 + 1;
      labels.push({ id: c.id, beforeArrow: Math.round(lengthOf(segments) * (1 - ((c.geometry?.x ?? 0) + 1) / 2) - half) });
      texts.push({
        id: c.edge ? `the label of edge "${c.id}"` : `"${c.id}"`,
        box: { x: at.x + o.x - t.width / 2 - 2, y: at.y + o.y - t.height / 2 - 1, width: t.width + 4, height: t.height + 2 },
      });
    }
    // A Draw.io group, or a container with no stroke, draws no border to sit on.
    const bordered = (s) => s.group === undefined && s.strokeColor !== 'none';
    const strip = (c, g) => {
      const s = parseStyle(c.style);
      const lines = textLines(c.value).filter(Boolean);
      if (!lines.length) return null;
      const t = extent(lines, s);
      if (s.swimlane !== undefined) {
        return { x: g.x + (g.width - t.width) / 2 - 4, y: g.y, width: t.width + 8, height: Number(s.startSize ?? 23) };
      }
      if ((s.verticalAlign ?? 'middle') !== 'top') return null;
      const lead = Number(s.spacingLeft ?? 0) + 2;
      const x = s.align === 'left' ? g.x : s.align === 'right' ? g.x + g.width - t.width - lead : g.x + (g.width - t.width) / 2 - lead;
      // An AWS group draws its 25px icon in that corner, beside the name.
      return { x, y: g.y, width: t.width + lead + 4, height: Math.max(25, t.height + Number(s.spacingTop ?? 0) + 4) };
    };
    const overlap = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1
      && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
    const within = (a, b) => a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.width <= b.x + b.width + 1 && a.y + a.height <= b.y + b.height + 1;
    // A container turned a quarter turn is drawn with its sides swapped about
    // its centre, and its header is no longer on top; any other angle is skipped.
    const turned = (s, g) => {
      const q = (((Number(s.rotation ?? 0) % 360) + 360) % 360) / 90;
      if (q === 0 || q === 2) return g;
      if (q !== 1 && q !== 3) return null;
      return { x: g.x + (g.width - g.height) / 2, y: g.y + (g.height - g.width) / 2, width: g.height, height: g.width };
    };
    let textOnContainers = 0;
    for (const c of cells) {
      const s = parseStyle(c.style);
      if (!containers.has(c.id) || !abs.has(c.id) || !bordered(s)) continue;
      const g = turned(s, abs.get(c.id));
      if (!g) continue;
      const head = Number(s.rotation ?? 0) || s.horizontal === '0' ? null : strip(c, g);
      for (const t of texts) {
        if (!overlap(t.box, g)) continue;
        const what = !within(t.box, g) ? 'lies across the border of' : head && overlap(t.box, head) ? 'covers the label of' : null;
        if (!what) continue;
        textOnContainers++;
        if (textOnContainers <= 10) warnings.push(`${label}: ${t.id} ${what} container "${c.id}"`);
      }
    }

    // Density (#247). A page wider than a slide is shrunk to fit it, and its
    // text with it. The size most labels use stands for the page, so one small
    // footnote does not. SLIDE_WIDTH and TEXT_FLOOR are in maintenance.md.
    const sizes = new Map();
    for (const c of cells) {
      if (!c.vertex || !abs.has(c.id) || isContainerish(c.style) || !textLines(c.value).some(Boolean)) continue;
      const px = Number(parseStyle(c.style).fontSize ?? 12);
      sizes.set(px, (sizes.get(px) ?? 0) + 1);
    }
    const width = Number.isFinite(minX) ? maxX - minX : 0;
    const density = {
      icons: leaves.filter((c) => isIcon(c.style)).length,
      textPx: [...sizes].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null,
      fittedPx: null,
    };
    if (density.textPx && width > SLIDE_WIDTH) {
      density.fittedPx = Math.round(density.textPx * SLIDE_WIDTH / width * 10) / 10;
      if (density.fittedPx < TEXT_FLOOR) {
        warnings.push(`${label}: at ${SLIDE_WIDTH}px wide its ${density.textPx}px labels draw at ${density.fittedPx}px, `
          + `under ${TEXT_FLOOR}px; split it into pages, one tier or flow each`);
      }
    }

    const model = graphModelAttrs(xml);
    pages.push({
      index: idx, name: page.name, compressed: page.compressed,
      cells: cells.length,
      vertices: cells.filter((c) => c.vertex).length,
      edges: cells.filter((c) => c.edge).length,
      danglingEdges: dangling, embeddedImages: embedded, externalImages: remote,
      overlaps, clippedLabels: clipped, nodeCrossings, captionCrossings, sharedTrunks, textOnContainers, density, labels,
      bounds: Number.isFinite(minX)
        ? { minX: Math.round(minX), minY: Math.round(minY), width: Math.round(maxX - minX), height: Math.round(maxY - minY) }
        : null,
      pageSize: model.pageWidth && model.pageHeight ? `${model.pageWidth}x${model.pageHeight}` : null,
    });
  });

  info.bytes = Buffer.byteLength(text);
  info.pages = pages;
  return { path, ok: errors.length === 0, errors, warnings, notes, info };
}

// Said where the agent reads it, just before it reports: a warning printed
// here is a defect still in the drawing until it is fixed (#248).
export const WARNINGS_LEFT = '   each warning is a defect still in the drawing: fix it, or quote it in '
  + 'your report as printed, every id included, never as "minor" or "expected"';

function main(argv) {
  const { options, positionals: files } = parseCliOrExit(argv,
    { values: { '--page': pageIndexArg }, switches: ['--json', '--strict'] }, USAGE);
  if (!files.length) exitUsage('expected at least one .drawio file', USAGE);
  const pageIndex = options.page ?? null;

  let bad = 0;
  for (const f of files) {
    const r = validateFile(f, { pageIndex });
    if (options.json) { console.log(JSON.stringify(r, null, 2)); }
    else {
      const warned = r.warnings.length ? `, ${r.warnings.length} warning${r.warnings.length > 1 ? 's' : ''}` : '';
      console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${f}${warned}`);
      for (const p of r.info.pages ?? []) {
        console.log(`   page ${p.index} "${p.name}": ${p.vertices} vertices, ${p.edges} edges, ` +
          `${p.embeddedImages} embedded images, bounds ${p.bounds ? `${p.bounds.width}x${p.bounds.height}` : 'n/a'}` +
          `${p.overlaps ? `, ${p.overlaps} overlaps` : ''}${p.clippedLabels ? `, ${p.clippedLabels} tight labels` : ''}`
          + `${p.nodeCrossings ? `, ${p.nodeCrossings} node crossings` : ''}`
          + `${p.captionCrossings ? `, ${p.captionCrossings} caption crossings` : ''}`
          + `${p.sharedTrunks ? `, ${p.sharedTrunks} shared trunks` : ''}`
          + `${p.textOnContainers ? `, ${p.textOnContainers} texts on containers` : ''}`
          + `, ${p.density.icons} icons`
          + `${p.density.fittedPx ? `, ${p.density.textPx}px labels at ${p.density.fittedPx}px on a ${SLIDE_WIDTH}px slide` : ''}`);
      }
      for (const e of r.errors) console.log(`   ERROR  ${e}`);
      for (const w of r.warnings) console.log(`   warn   ${w}`);
      if (r.warnings.length) console.log(WARNINGS_LEFT);
      for (const n of r.notes) console.log(`   info   ${n}`);
    }
    if (!r.ok || (options.strict && r.warnings.length)) bad++;
  }
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('validate-drawio.mjs')) main(process.argv.slice(2));
