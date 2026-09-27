#!/usr/bin/env node
// Assemble a native, editable .drawio file from a compact JSON spec, applying
// the style tokens derived in references/style-guide.md and embedding custom
// icons from the bundled libraries so the result is portable.
//
//   node build-diagram.mjs spec.json --out diagram.drawio
//   node build-diagram.mjs spec.json --out diagram.drawio --defaults   house style only
//   node build-diagram.mjs --print-style                              what a build would use
//
// A person's own conventions, chosen with apply-style.mjs, are merged in from
// <ARKITECT_HOME>/drawio/style-overrides.json on every CLI build (#89).
// Anything that rebuilds a committed example passes --defaults, so the example
// builds the same on every machine.
//
// An existing target is never overwritten silently: a timestamped sibling
// backup is written first (see backupExisting), and once the new file is
// written the oldest and the newest five backups of it are kept (see
// pruneBackups; --keep-backups N, 0 keeps all).
//
// Placement is on a column/row grid using the observed pitch, which keeps
// generated output collision-free and readable. See the style guide's note on
// grid snapping - the reference diagrams are placed free-hand, so this is a
// deliberate normalisation, not an observed convention.

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { backupExisting, pruneBackups, DEFAULT_KEEP_BACKUPS } from './lib/backups.mjs';
export { backupExisting, pruneBackups, DEFAULT_KEEP_BACKUPS } from './lib/backups.mjs';
import { resolve, byExactId, recommendedSize, styleSafeDataUri, loadCatalog, onDemandNext, lifecycleOf } from './find-icon.mjs';
import { getLogo, logoStyle, logoBox, DEFAULT_LOGO_SIZE } from './fetch-logo.mjs';
import { parseCliOrExit, exitUsage } from './lib/drawio-core.mjs';
import { readJson } from './lib/read-json.mjs';
import {
  numberProblems, defaulted, gridProblems, nonFiniteBoxes,
  FINITE, POSITIVE, NON_NEGATIVE, SPAN,
} from './lib/spec-numbers.mjs';
import { engineStore } from './lib/store.mjs';
import { looksLikeBoundary } from './lib/fake-boundaries.mjs';
import { namedProducts } from './lib/named-products.mjs';
import { iconKind, unusedIcon } from './lib/icon-kind.mjs';
import { GENERIC_VENDOR } from './lib/generic-words.mjs';
import { resolveStyle, loadStyleOrWarn, styleSummary } from './lib/style-tokens.mjs';
import { planEdges, readEnd, SIDES } from './lib/edge-plan.mjs';
import { captionBox } from './lib/routes.mjs';

// ---------------------------------------------------------------- tokens

// The house style's tokens (`T`) and connector kinds (`EDGE_KINDS`) live in
// lib/style-tokens.mjs, beside the per-install override layer that can restyle
// them (#89).
export { T, EDGE_KINDS, resolveStyle, loadStyle, validateOverrides } from './lib/style-tokens.mjs';

// Icon captions render below the cell; boundaries must leave room for them.
const CAPTION_ROOM = 34;
// Height of one caption line at the body font size, for captions that wrap onto
// several lines (#45).
const CAPTION_LINE = 15;
// Clear space between the title block and the highest thing on the page (#239).
const TITLE_GAP = 12;

// Node kinds the builder draws. Any other kind still draws, as a box, and is
// named in the build report so a typo cannot silently change the diagram (#48).
const NODE_KINDS = ['box', 'icon', 'aws4', 'logo', 'note', 'text'];

// Every key each part of a spec may carry. An unknown key is not a broken
// spec - one written against a field this builder does not have yet still has
// to build - so it is reported rather than refused. What it must never be is
// silent: an agent that writes a field and is told nothing believes it took
// effect, and the diagram it describes is not the diagram it got (#205).
const BOUNDARY_FIELDS = ['id', 'label', 'kind', 'parent', 'col', 'row', 'cols', 'rows',
  'color', 'dashed', 'grIcon', 'padLeft', 'padRight', 'padTop', 'padBottom', 'labelAlign'];
// Where a boundary's name sits along its top. The default is the kind's own (#250).
const LABEL_ALIGNS = ['left', 'center', 'right'];
const NODE_FIELDS = ['id', 'label', 'kind', 'parent', 'col', 'row', 'width', 'height',
  'icon', 'pack', 'logo', 'size', 'resIcon', 'color', 'fontSize', 'bold', 'align'];
const EDGE_FIELDS = ['id', 'kind', 'from', 'to', 'label', 'labelPos', 'exit', 'entry'];
// What a page of a multi-page spec may carry (#184).
const PAGE_FIELDS = ['name', 'id', 'title', 'subtitle', 'titleColor', 'boundaries', 'nodes', 'edges', 'legend', 'legendX', 'legendY'];
// What the spec itself may carry. A misspelled `edges` dropped every connector
// in silence (#221). A key starting with `_` is a comment: the committed
// templates use `_comment`, and agents copy them.
const SPEC_FIELDS = ['pages', 'layout', 'context', 'page', 'pageId', 'title', 'subtitle', 'titleColor',
  'boundaries', 'nodes', 'edges', 'legend', 'legendX', 'legendY'];
const SPEC_HINTS = {
  edge: 'not a field: connectors go in `edges`',
  node: 'not a field: nodes go in `nodes`',
  boundary: 'not a field: boundaries go in `boundaries`',
};

// A raw style string is what an agent reaches for when it wants something the
// house style will not give it, and it is the one field worth answering rather
// than only naming.
const FIELD_HINTS = {
  style: 'not a field: the look comes from `kind`, and from color, fontSize, bold or align',
  fill: 'not a field: pick the `kind` that means it, or set `color`',
  note: 'not a field: a note is a node with kind "note"',
};

const isObject = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

const unknownKeys = (item, field, valid) => Object.keys(item).filter((key) => !valid.includes(key))
  .map((key) => ({
    field: `${field}.${key}`, value: item[key], valid,
    ...(FIELD_HINTS[key] ? { hint: FIELD_HINTS[key] } : {}),
  }));

export function unknownFields(spec) {
  if (!isObject(spec)) return [];
  const pages = Array.isArray(spec.pages) ? spec.pages.map((page, n) => [page, `pages[${n}]`]) : [[spec, '']];
  const out = Object.keys(spec).filter((key) => !key.startsWith('_') && !SPEC_FIELDS.includes(key))
    .map((key) => ({
      field: key, value: spec[key], valid: SPEC_FIELDS,
      ...(SPEC_HINTS[key] ? { hint: SPEC_HINTS[key] } : {}),
    }));
  for (const [page, at] of pages) {
    if (!isObject(page)) continue;
    if (at) out.push(...unknownKeys(page, at, PAGE_FIELDS));
    for (const [part, valid] of [['boundaries', BOUNDARY_FIELDS], ['nodes', NODE_FIELDS], ['edges', EDGE_FIELDS]]) {
      const list = Array.isArray(page[part]) ? page[part] : [];
      for (const [i, item] of list.entries()) {
        if (isObject(item)) out.push(...unknownKeys(item, `${at ? `${at}.` : ''}${part}[${i}]`, valid));
      }
    }
  }
  return out;
}

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Every label is html=1, where a newline is whitespace, and XML turns one in an
// attribute into a space anyway: a two-line caption drew on one line (#238).
// `<br>` is what Draw.io itself stores; one already written stays as it is.
const BREAK = /\r?\n|<br\s*\/?>/gi;
export const labelValue = (s) => esc(String(s ?? '').replace(/\r?\n/g, '<br>'));
const linesOf = (s) => String(s ?? '').split(BREAK);

// Room a heading needs on one line, generous enough that Draw.io never wraps it.
const textWidth = (s, size, bold) => Math.ceil(Math.max(...linesOf(s).map((l) => l.length)) * size * (bold ? 0.62 : 0.56)) + 16;

// Every style string the builder writes, from one resolved set of tokens and
// kinds. Literals that used to be baked in here - corner rounding, the note
// colours, the scope stroke, the edge-label size - go through named tokens now
// (#89); with the shipped tokens each string is exactly what it always was.
const stylesFor = (T, EDGE_KINDS) => ({
  icon: (uri) => `shape=image;html=1;verticalLabelPosition=bottom;verticalAlign=top;`
    + `labelBackgroundColor=none;imageAspect=0;aspect=fixed;fontSize=${T.fontBody};fontColor=${T.text};image=${uri};`,
  aws4: (resIcon, fill) => `sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],`
    + `[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;`
    + `fontColor=${T.text};gradientColor=none;fillColor=${fill};strokeColor=#ffffff;dashed=0;`
    + `verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=${T.fontBody};fontStyle=0;`
    + `aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=${resIcon};`,
  box: `rounded=${T.rounded};whiteSpace=wrap;html=1;fillColor=none;strokeColor=${T.text};fontColor=${T.text};fontSize=${T.fontBody};`,
  note: `rounded=${T.rounded};whiteSpace=wrap;html=1;fillColor=${T.noteFill};strokeColor=${T.noteStroke};fontColor=${T.noteText};`
    + `fontSize=${T.fontBody};align=left;verticalAlign=top;spacing=6;`,
  text: (size, color, bold, align = 'center') =>
    `text;html=1;whiteSpace=wrap;align=${align};verticalAlign=middle;rounded=${T.rounded};fillColor=none;strokeColor=none;`
    + `fontSize=${size};fontColor=${color};${bold ? 'fontStyle=1;' : ''}`,
  // Copied from the reference corpus verbatim apart from grIcon/colour.
  awsGroup: (grIcon, color) => 'points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],'
    + '[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;'
    + `whiteSpace=wrap;fontSize=${T.fontBody};fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`
    + `shape=mxgraph.aws4.group;grIcon=${grIcon};strokeColor=${color};fillColor=none;verticalAlign=top;align=left;`
    + `spacingLeft=30;fontColor=${color};dashed=0;`,
  scope: (color, dashed) => `rounded=${T.rounded};whiteSpace=wrap;html=1;fillColor=none;strokeColor=${color};strokeWidth=${T.scopeStrokeWidth};`
    + `${dashed ? `dashed=1;dashPattern=${T.scopeDashPattern};` : 'dashed=0;'}fontColor=${color};fontSize=${T.fontBody};`
    + 'verticalAlign=top;align=left;spacingLeft=8;spacingTop=2;container=1;collapsible=0;pointerEvents=0;',
  lane: `swimlane;html=1;whiteSpace=wrap;rounded=${T.rounded};fillColor=none;strokeColor=${T.text};fontColor=${T.text};`
    + `fontSize=${T.fontHeading};fontStyle=1;startSize=34;horizontal=1;collapsible=0;container=1;`,
  edge: (k) => {
    const e = Object.hasOwn(EDGE_KINDS, k) ? EDGE_KINDS[k] : EDGE_KINDS.flow;
    return `edgeStyle=orthogonalEdgeStyle;rounded=${T.edgeRounded};html=1;jettySize=auto;orthogonalLoop=1;`
      + `strokeColor=${e.stroke};strokeWidth=${e.width};dashed=${e.dashed};endArrow=classic;endFill=1;`;
  },
  edgeLabel: (color) => `edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;`
    + `labelBackgroundColor=${T.labelBg};fontSize=${T.fontEdgeLabel};fontColor=${color ?? T.text};`,
});

// ---------------------------------------------------------------- helpers

// Resolution never guesses. `spec.context.packs` biases the search toward the
// stack being drawn, a node's own `pack` pins it outright, and anything the
// resolver is not confident about is reported rather than silently drawn - a
// GCP diagram must not quietly receive an Azure icon.
export function resolveIcon(node, catalog, report, contextPacks) {
  const query = typeof node === 'string' ? node : node.icon;
  if (!query) return null;
  const pinned = typeof node === 'object' ? node.pack ?? null : null;

  // Whatever route chose the mark, an on-demand entry ships no bytes: it is
  // reported to fetch, never swapped for something that does draw.
  const take = (chosen) => {
    // Drawn or not, a product that was discontinued, renamed or absorbed is
    // named in the report, so the person reading the diagram hears it (#83).
    const lifecycle = lifecycleOf(chosen, catalog);
    if (lifecycle) (report.lifecycle ??= []).push({ query, id: chosen.id, ...lifecycle });
    if (chosen.bytes === 'on-demand') {
      report.needsFetch.push({
        query, id: chosen.id, licence: chosen.licence, reason: chosen.reason, artwork: chosen.artwork,
        ...(chosen.fetch ? { fetch: chosen.fetch } : { next: onDemandNext(chosen) }),
      });
      return null;
    }
    report.used.push({ query, title: chosen.title, id: chosen.id, pack: chosen.pack });
    return chosen;
  };

  // An exact catalog id is an instruction, not a search term. `<pack>/<slug>`
  // is what a search prints and what the skill tells an agent to put in a
  // spec; sending it through text search drew another product's mark for 752
  // of the 4,843 committed ids and a plain box for 227 more (#95).
  const exact = byExactId(catalog, query);
  if (exact) {
    // A node that pins a pack the id does not belong to is a spec arguing with
    // itself, and neither half is safe to act on unattended. Searching the
    // pinned pack for the id is the same bug in miniature: "aws" plus
    // `databases/postgresql` scores Amazon RDS, confidently.
    if (pinned && exact.pack !== pinned) {
      report.missing.push({
        query,
        pack: pinned,
        reason: `${query} is in the "${exact.pack}" pack, but this node pins "${pinned}"`,
      });
      return null;
    }
    return take(exact);
  }

  const r = resolve(query, { catalog, limit: 3, packs: contextPacks, pack: pinned });
  if (!r.groups.length) {
    report.missing.push({ query, ...(pinned ? { pack: pinned } : {}) });
    return null;
  }

  const g = r.groups[0];
  const chosen = g.variants[0];

  // Any other doubt still draws the leader and lists it. Here the leader is
  // the harm - a vendor's mark on a component named in generic words - so the
  // node gets the labelled box instead (#231).
  if (r.reason === GENERIC_VENDOR) {
    report.missing.push({ query, reason: r.reason, alternatives: r.groups.slice(0, 4).map((x) => x.variants[0].id) });
    return null;
  }

  if (!r.confident) {
    report.ambiguous.push({
      query,
      reason: r.reason,
      chose: chosen.id,
      alternatives: r.groups.slice(0, 4).flatMap((x) => x.variants.slice(0, 2)).map((v) => v.id)
        .filter((id) => id !== chosen.id),
      fix: 'pin it with "pack": "<id>" on the node, or name the product more precisely',
    });
  }

  return take(chosen);
}

// ---------------------------------------------------------------- spec checks

// A spec is checked before anything is built, backed up or written (#36). A typo
// in an edge endpoint used to produce a successful build with a dangling edge.
// Every problem is collected, so one run lists them all, each naming its field.
export class SpecError extends Error {
  constructor(errors) {
    super(`invalid spec:\n  ${errors.join('\n  ')}`);
    this.name = 'SpecError';
    this.errors = errors;
  }
}

// Ids the builder writes cells under itself. Automatic edge ids (`e1`, `e2`, ...)
// are not listed: they skip any id the spec already uses instead.
const RESERVED_IDS = /^(?:0|1|title|subtitle|legend|legend-[abet]\d+)$|-lbl$/;

// Coordinates may be fractional or negative; sizes, spans and pitches may not.
const LAYOUT_NUMBERS = { originX: FINITE, originY: FINITE, colPitch: POSITIVE, rowPitch: POSITIVE };
const BOUNDARY_NUMBERS = {
  col: FINITE, row: FINITE, cols: SPAN, rows: SPAN,
  padLeft: NON_NEGATIVE, padTop: NON_NEGATIVE, padRight: NON_NEGATIVE, padBottom: NON_NEGATIVE,
};
const NODE_NUMBERS = { col: FINITE, row: FINITE, width: POSITIVE, height: POSITIVE, size: POSITIVE, fontSize: POSITIVE };

// Only what did not come out as a number, keyed by attribute, for the guard
// above; mxPoint children are derived from these boxes and follow them.
function geometryOf(cell) {
  const out = {};
  for (const tag of cell.match(/<mxGeometry\b[^>]*>/g) ?? []) {
    for (const [, key, value] of tag.matchAll(/\b(x|y|width|height)="([^"]*)"/g)) {
      const n = Number(value);
      if (!Number.isFinite(n)) out[key] = n;
    }
  }
  return out;
}

// A spec with `pages` keeps these on each page. Left at the top as well they
// would be drawn on no page, which is the silence #205 was about (#184).
const PAGE_KEYS = ['boundaries', 'nodes', 'edges', 'title', 'subtitle', 'titleColor', 'legend', 'legendX', 'legendY', 'page', 'pageId'];

// The name and id each page is written under. Draw.io keys a page by its id
// and shows its name on the tab.
export const pagesOf = (spec) => (Array.isArray(spec.pages)
  ? spec.pages.map((page, n) => ({
    at: `pages[${n}].`, page, name: page.name ?? `Page ${n + 1}`, id: page.id ?? `generated-page-${n + 1}`,
  }))
  : [{ at: '', page: spec, name: spec.page ?? 'Architecture', id: spec.pageId ?? 'generated-page-1' }]);

export function validateSpec(spec) {
  if (!isObject(spec)) return ['spec: expected a JSON object'];
  if (spec.pages === undefined) return pageProblems(spec, '', { layout: true });

  const errors = [];
  if (!Array.isArray(spec.pages) || !spec.pages.length || !spec.pages.every(isObject)) {
    return ['pages: expected a non-empty array of page objects'];
  }
  const stray = PAGE_KEYS.filter((key) => spec[key] !== undefined);
  if (stray.length) errors.push(`pages: ${stray.join(', ')} ${stray.length > 1 ? 'belong' : 'belongs'} on a page in a spec with pages`);
  if (spec.layout != null && !isObject(spec.layout)) errors.push('layout: expected an object');
  else if (spec.layout) errors.push(...numberProblems('layout', spec.layout, LAYOUT_NUMBERS));

  const pages = pagesOf(spec);
  for (const [key, what] of [['id', 'id'], ['name', 'name']]) {
    const first = new Map();
    pages.forEach((p, n) => {
      if (typeof p[key] !== 'string' || !p[key]) errors.push(`pages[${n}].${key}: expected a non-empty string`);
      else if (first.has(p[key])) errors.push(`pages[${n}].${key}: ${JSON.stringify(p[key])} is already the ${what} of pages[${first.get(p[key])}]`);
      else first.set(p[key], n);
    });
  }
  // Where each id lives, so an edge that names a node on another page is told so.
  const pageOf = new Map();
  spec.pages.forEach((page, n) => {
    for (const key of ['boundaries', 'nodes']) {
      for (const item of Array.isArray(page[key]) ? page[key] : []) {
        if (isObject(item) && typeof item.id === 'string' && !pageOf.has(item.id)) pageOf.set(item.id, n);
      }
    }
  });
  spec.pages.forEach((page, n) => errors.push(...pageProblems(page, `pages[${n}].`, { pageOf, n })));
  return errors;
}

// One page's boundaries, nodes and edges: ids, parents, edge ends and numbers.
// A spec without pages is its own single page, with the layout checked here in
// the order it always was.
function pageProblems(spec, at, { layout = false, pageOf = null, n = 0 } = {}) {
  const errors = [];
  const show = (v) => JSON.stringify(v);
  const listOf = (key) => {
    if (spec[key] === undefined) return [];
    if (Array.isArray(spec[key])) return spec[key];
    errors.push(`${at}${key}: expected an array`);
    return [];
  };
  const boundaries = listOf('boundaries');
  const nodes = listOf('nodes');
  const edges = listOf('edges');

  // Boundaries, nodes and named edges all become cells, so they share one id space.
  const declaredBy = new Map();
  const declare = (field, item, required) => {
    if (!isObject(item)) { errors.push(`${field}: expected an object`); return; }
    if (item.id === undefined && !required) return;
    if (typeof item.id !== 'string' || !item.id) { errors.push(`${field}.id: expected a non-empty string`); return; }
    if (RESERVED_IDS.test(item.id)) errors.push(`${field}.id: ${show(item.id)} is reserved for a cell the builder generates`);
    if (declaredBy.has(item.id)) errors.push(`${field}.id: ${show(item.id)} is already used by ${declaredBy.get(item.id)}`);
    else declaredBy.set(item.id, field);
  };
  boundaries.forEach((b, i) => declare(`${at}boundaries[${i}]`, b, true));
  nodes.forEach((n, i) => declare(`${at}nodes[${i}]`, n, true));
  edges.forEach((e, i) => declare(`${at}edges[${i}]`, e, false));

  const idsOf = (list) => new Set(list.filter(isObject).map((x) => x.id).filter((id) => typeof id === 'string' && id));
  const boundaryIds = idsOf(boundaries);
  const nodeIds = idsOf(nodes);

  // Coordinates are laid out relative to a boundary, so a parent must be one.
  const checkParent = (field, item) => {
    if (item.parent === undefined || item.parent === null) return;
    if (!boundaryIds.has(item.parent)) errors.push(`${field}.parent: ${show(item.parent)} is not a boundary id`);
  };
  boundaries.forEach((b, i) => { if (isObject(b)) checkParent(`${at}boundaries[${i}]`, b); });
  nodes.forEach((n, i) => { if (isObject(n)) checkParent(`${at}nodes[${i}]`, n); });

  const parentOf = new Map(boundaries.filter(isObject).map((b) => [b.id, b.parent]));
  boundaries.forEach((b, i) => {
    if (!isObject(b) || !boundaryIds.has(b.id)) return;
    const chain = [b.id];
    const seen = new Set(chain);
    for (let p = parentOf.get(b.id); boundaryIds.has(p); p = parentOf.get(p)) {
      chain.push(p);
      if (p === b.id) {
        errors.push(`${at}boundaries[${i}].parent: boundary ${show(b.id)} is nested inside itself (${chain.join(' -> ')})`);
        break;
      }
      if (seen.has(p)) break;
      seen.add(p);
    }
  });

  // Draw.io can connect an edge to a container, so a boundary is a valid end.
  // It cannot connect two pages: each page is its own graph.
  edges.forEach((e, i) => {
    if (!isObject(e)) return;
    for (const end of ['from', 'to']) {
      const ref = e[end];
      const field = `${at}edges[${i}].${end}`;
      if (ref === undefined || ref === null || ref === '') errors.push(`${field}: missing`);
      else if (nodeIds.has(ref) || boundaryIds.has(ref)) continue;
      else if (pageOf?.has(ref) && pageOf.get(ref) !== n) errors.push(`${field}: ${show(ref)} is on pages[${pageOf.get(ref)}]; an edge cannot cross pages`);
      else errors.push(`${field}: ${show(ref)} is not a node or boundary id`);
    }
  });

  // Geometry the builder multiplies and writes out; a missing col or row is 0 (#115).
  if (layout) {
    if (spec.layout != null && !isObject(spec.layout)) errors.push('layout: expected an object');
    else if (spec.layout) errors.push(...numberProblems('layout', spec.layout, LAYOUT_NUMBERS));
  }
  errors.push(...numberProblems(at ? at.slice(0, -1) : 'spec', spec, { legendX: FINITE, legendY: FINITE }));
  boundaries.forEach((b, i) => { if (isObject(b)) errors.push(...numberProblems(`${at}boundaries[${i}]`, b, BOUNDARY_NUMBERS)); });
  nodes.forEach((n, i) => { if (isObject(n)) errors.push(...numberProblems(`${at}nodes[${i}]`, n, NODE_NUMBERS)); });
  edges.forEach((e, i) => { if (isObject(e)) errors.push(...numberProblems(`${at}edges[${i}]`, e, { labelPos: FINITE })); });

  return errors;
}

// ---------------------------------------------------------------- build

// `style` is what to draw with: the shipped house style unless the caller hands
// over another (resolveStyle(override) or loadStyle()). This never reads an
// install's override itself - main() does - so an example built through here is
// the same on every machine (#89).
export function buildDiagram(spec, { style = resolveStyle() } = {}) {
  const problems = validateSpec(spec);
  if (problems.length) throw new SpecError(problems);
  // The resolved tokens and kinds, under the names the drawing code has always used.
  const T = style.tokens;
  const EDGE_KINDS = style.edgeKinds;
  const STYLE = stylesFor(T, EDGE_KINDS);
  const catalog = loadCatalog();
  const report = {
    used: [], missing: [], ambiguous: [], needsFetch: [], sameArtwork: [], lifecycle: [], logos: [], missingLogos: [], opaqueLogos: [], unknownKinds: [], unknownFields: unknownFields(spec), looksLikeBoundary: [], namesAProduct: [], notes: [],
    style: { source: style.source, reason: style.reason, file: style.file, overridden: style.overridden, errors: style.errors },
  };
  const drawnIcons = [];
  // Packs named by the spec win ties, so a diagram declared as GCP resolves
  // "cloud run" inside GCP rather than wherever the string happens to match.
  const contextPacks = spec.context?.packs ?? null;
  // defaulted, not a plain spread: an explicit null is documented as taking the
  // default, and a spread writes it over the default instead (#153).
  const L = { originX: 80, originY: 100, colPitch: T.colPitch, rowPitch: T.rowPitch, ...defaulted(spec.layout) };
  const colX = (c) => L.originX + c * L.colPitch;
  const rowY = (r) => L.originY + r * L.rowPitch;

  // Each page is its own graph, drawn from its own boundaries, nodes and edges;
  // the layout, the icon context and the style are the file's (#184). A spec
  // without `pages` is one page, written exactly as it always was.
  const diagrams = pagesOf(spec).map(({ at, page: spec, name, id: pageId }) => {
    const cells = [];
    const push = (xml) => cells.push(xml);

    // Finite operands, non-finite product: refused here, naming the field, rather
    // than written out as pageWidth="Infinity" and a coordinate of its own (#153).
    const grid = gridProblems(spec, { colX, rowY });
    if (grid.length) throw new SpecError(grid.map((problem) => at + problem));

    let pageW = 0; let pageH = 0;
    const track = (x, y, w, h) => { pageW = Math.max(pageW, x + w); pageH = Math.max(pageH, y + h); };

    // A boundary spans whole grid cells. Its box runs from the left edge of its
    // first column to the right edge of its last, with room under the bottom row
    // for the icon captions that hang below their cells.
    const boundaries = spec.boundaries ?? [];
    const byBoundaryId = new Map(boundaries.map((b) => [b.id, b]));
    // A missing col or row is 0, as in Excalidraw (#115).
    const boxOf = (b) => {
      const col = b.col ?? 0;
      const row = b.row ?? 0;
      const left = colX(col) - (b.padLeft ?? 40);
      const top = rowY(row) - (b.padTop ?? 55);
      const right = colX(col + (b.cols ?? 1) - 1) + T.iconSize + (b.padRight ?? 40);
      const bottom = rowY(row + (b.rows ?? 1) - 1) + T.iconSize + CAPTION_ROOM + (b.padBottom ?? 25);
      return { x: left, y: top, width: right - left, height: bottom - top };
    };
    // Origin a child's coordinates are relative to. boxOf already returns
    // absolute page coordinates, so this is the parent's own box - not a sum up
    // the chain, which would count every ancestor twice.
    const originOf = (parentId) => {
      const b = byBoundaryId.get(parentId);
      return b ? boxOf(b) : { x: 0, y: 0 };
    };

    for (const [i, b] of boundaries.entries()) {
      const abs = boxOf(b);
      const origin = originOf(b.parent);
      let style;
      if (b.kind === 'aws-cloud') style = STYLE.awsGroup('mxgraph.aws4.group_aws_cloud_alt', b.color ?? T.text);
      else if (b.kind === 'aws-group') style = STYLE.awsGroup(b.grIcon, b.color ?? T.text);
      else if (b.kind === 'lane') style = STYLE.lane;
      else style = STYLE.scope(b.color ?? T.neutralStroke, b.dashed !== false);
      if (b.labelAlign !== undefined) {
        if (LABEL_ALIGNS.includes(b.labelAlign)) style = `${style.replace(/(^|;)align=\w+;/, '$1')}align=${b.labelAlign};${b.labelAlign === 'right' ? 'spacingRight=8;' : ''}`;
        else report.unknownKinds.push({ field: `${at}boundaries[${i}].labelAlign`, value: b.labelAlign, drawnAs: 'the default', valid: LABEL_ALIGNS });
      }
      push(`<mxCell id="${esc(b.id)}" value="${labelValue(b.label)}" style="${style}" vertex="1" parent="${esc(b.parent ?? '1')}">`
        + `<mxGeometry x="${Math.round(abs.x - origin.x)}" y="${Math.round(abs.y - origin.y)}" `
        + `width="${Math.round(abs.width)}" height="${Math.round(abs.height)}" as="geometry" /></mxCell>`);
      track(abs.x, abs.y, abs.width, abs.height);
    }

    const nodeBox = new Map();
    // Where each node landed on the page, and whether a caption hangs below it.
    const placed = new Map();
    const footprints = [];
    for (const [i, node] of (spec.nodes ?? []).entries()) {
      const n = iconKind(node);
      const unused = unusedIcon(node, `${at}nodes[${i}]`, ['icon']);
      if (unused) report.notes.push(unused);
      const parent = n.parent ?? '1';
      if (n.kind != null && !NODE_KINDS.includes(n.kind)) {
        report.unknownKinds.push({ field: `${at}nodes[${i}].kind`, value: n.kind, drawnAs: 'box', valid: NODE_KINDS });
      }
      const w = n.width ?? (n.kind === 'icon' ? T.iconSize : 190);
      const h = n.height ?? (n.kind === 'icon' ? T.iconSize : 60);
      const origin = originOf(parent);

      let style;
      if (n.kind === 'note') style = STYLE.note;
      else if (n.kind === 'text') style = STYLE.text(n.fontSize ?? T.fontBody, n.color ?? T.text, n.bold ?? false, n.align ?? 'center');
      else if (n.kind === 'aws4') style = STYLE.aws4(n.resIcon, n.color ?? '#ED7100');
      else if (n.kind === 'icon') {
        const icon = resolveIcon(n.icon ? n : { ...n, icon: n.label }, catalog, report, contextPacks);
        if (icon) {
          drawnIcons.push({ node: n.id, id: icon.id, sha256: icon.sha256 });
          const dim = recommendedSize(icon, n.width ?? T.iconSize);
          style = STYLE.icon(styleSafeDataUri(icon));
          nodeBox.set(n.id, { w: dim.width, h: dim.height });
        } else {
          style = STYLE.box;
        }
      } else if (n.kind === 'logo') {
        // Third-party product logo from the local cache (see fetch-logo.mjs).
        const entry = getLogo(n.logo ?? n.label);
        if (entry) {
          const box = logoBox(entry, n.size ?? DEFAULT_LOGO_SIZE);
          style = logoStyle(entry);
          nodeBox.set(n.id, { w: n.width ?? box.width, h: n.height ?? box.height });
          report.logos.push({ name: entry.name, transparent: entry.transparent });
          if (!entry.transparent) {
            report.opaqueLogos.push(`${entry.name} (${entry.transparencyNote}) — renders as a solid box`);
          }
        } else {
          report.missingLogos.push(n.logo ?? n.label);
          style = STYLE.box;
        }
      } else style = STYLE.box;

      const box = nodeBox.get(n.id) ?? { w, h };
      // Every shape is centred on its grid cell in both axes, from the box it is
      // drawn at, so a box, a wordmark and an icon on one row share a centre line
      // and connectors between them run straight. Centring on the asked-for size
      // hung a wordmark from the top of its cell and put a logo 63px left (#255).
      const x = colX(n.col ?? 0) + (T.iconSize - box.w) / 2 - origin.x;
      const y = rowY(n.row ?? 0) + (T.iconSize - box.h) / 2 - origin.y;
      placed.set(n.id, {
        x: x + origin.x, y: y + origin.y, w: box.w, h: box.h,
        caption: Boolean(n.label) && style.includes('verticalLabelPosition=bottom'),
        lines: linesOf(n.label).length,
        leaf: n.kind !== 'text',
      });
      footprints.push({
        field: `${at}nodes[${i}]`, id: n.id, width: n.width, height: n.height, label: n.label, col: n.col, row: n.row,
        plain: n.kind == null || n.kind === 'box' || !NODE_KINDS.includes(n.kind),
        box: { x: x + origin.x, y: y + origin.y, width: box.w, height: box.h },
      });
      push(`<mxCell id="${esc(n.id)}" value="${labelValue(n.label)}" style="${style}" vertex="1" parent="${esc(parent)}">`
        + `<mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${box.w}" height="${box.h}" as="geometry" /></mxCell>`);
      if (parent === '1') track(x, y, box.w, box.h);
    }

    // The title sat at a fixed 70px above the origin, across the header of any
    // boundary at row 0, in a 900px box (#239). It now ends above whatever is
    // highest on the page, and is as wide as its text. A page whose content
    // starts lower keeps the title where it always was.
    if (spec.title) {
      const top = Math.min(...boundaries.map((b) => boxOf(b).y), ...[...placed.values()].map((p) => p.y));
      const height = 30 + (spec.subtitle ? 22 : 0);
      const y = Math.min(L.originY - 70, top - height - TITLE_GAP);
      const titleCells = [`<mxCell id="title" value="${labelValue(spec.title)}" style="${STYLE.text(T.fontHeading, spec.titleColor ?? T.text, true, 'left')}" vertex="1" parent="1">`
        + `<mxGeometry x="${L.originX}" y="${Math.round(y)}" width="${textWidth(spec.title, T.fontHeading, true)}" height="30" as="geometry" /></mxCell>`];
      if (spec.subtitle) {
        titleCells.push(`<mxCell id="subtitle" value="${labelValue(spec.subtitle)}" style="${STYLE.text(T.fontBody, T.text, false, 'left')}" vertex="1" parent="1">`
          + `<mxGeometry x="${L.originX}" y="${Math.round(y + 30)}" width="${textWidth(spec.subtitle, T.fontBody, false)}" height="20" as="geometry" /></mxCell>`);
      }
      cells.unshift(...titleCells);
    }

    report.looksLikeBoundary.push(...looksLikeBoundary(footprints));
    // The same verdict an icon node would get, so what is listed would draw (#240).
    const plainBoxes = footprints.filter((f) => f.plain).map((f) => (spec.nodes ?? []).find((n) => n.id === f.id));
    report.namesAProduct.push(...namedProducts(plainBoxes, (text) => {
      const r = resolve(text, { catalog, limit: 3, packs: contextPacks });
      return r.confident ? r.icon.id : null;
    }));

    // An unknown kind draws as a plain flow. It used to crash on the edge label.
    const kindOf = (e) => (Object.hasOwn(EDGE_KINDS, e.kind ?? '') ? e.kind : 'flow');

    // Sides, spread, waypoints and label positions for every edge (#237, #241).
    const boxes = new Map(placed);
    for (const b of boundaries) {
      const g = boxOf(b);
      boxes.set(b.id, { x: g.x, y: g.y, w: g.width, h: g.height, caption: false, lines: 0 });
    }
    const rect = (q) => ({ x: q.x, y: q.y, width: q.w, height: q.h });
    const plans = planEdges({
      edges: spec.edges ?? [],
      boxes,
      obstacles: [...placed].filter(([, q]) => q.leaf).map(([id, q]) => ({ id, box: rect(q) })),
      captions: [...placed].filter(([, q]) => q.caption)
        .map(([id, q]) => ({ id, box: captionBox(rect(q), linesOf((spec.nodes ?? []).find((n) => n.id === id).label), T.fontBody) })),
      containers: boundaries.map((b) => ({ id: b.id, box: boxOf(b) })),
      grid: { colX, rowY, colPitch: L.colPitch, rowPitch: L.rowPitch, iconSize: T.iconSize, captionRoom: CAPTION_ROOM, captionLine: CAPTION_LINE },
      label: (text) => {
        const lines = linesOf(text);
        return { width: Math.max(...lines.map((l) => l.length)) * T.fontEdgeLabel * 0.55 + 8, height: lines.length * T.fontEdgeLabel * 1.25 + 4 };
      },
    });
    // An automatic edge id skips any id the spec already uses, so a node called
    // `e1` never shares its id with the first unnamed edge (#36).
    const taken = new Set([...boundaries, ...(spec.nodes ?? []), ...(spec.edges ?? [])].map((x) => x.id));
    let edgeSeq = 0;
    for (const [i, e] of (spec.edges ?? []).entries()) {
      if (e.kind != null && !Object.hasOwn(EDGE_KINDS, e.kind)) {
        report.unknownKinds.push({ field: `${at}edges[${i}].kind`, value: e.kind, drawnAs: 'flow', valid: Object.keys(EDGE_KINDS) });
      }
      let id = e.id;
      while (id === undefined) {
        const next = `e${++edgeSeq}`;
        if (!taken.has(next)) id = next;
      }
      // Drawn to the border, where it reads as the nearest child's (#245).
      for (const end of ['from', 'to']) {
        if (!byBoundaryId.has(e[end])) continue;
        const kids = [...(spec.nodes ?? []), ...boundaries].filter((x) => x.parent === e[end]).map((x) => x.id);
        report.notes.push(`${at}edges[${i}].${end}: "${e[end]}" is a boundary, so the edge is drawn to its border`
          + `${kids.length ? `; if one component is meant, connect it: ${kids.join(', ')}` : ''}`);
      }
      for (const end of ['exit', 'entry']) {
        if (readEnd(e[end])?.bad) report.unknownKinds.push({ field: `${at}edges[${i}].${end}`, value: e[end], drawnAs: 'the side the grid gives', valid: SIDES });
      }
      const kind = kindOf(e);
      const plan = plans[i];
      const points = plan?.points.length
        ? `<Array as="points">${plan.points.map((pt) => `<mxPoint x="${pt.x}" y="${pt.y}" />`).join('')}</Array>` : '';
      push(`<mxCell id="${esc(id)}" style="${STYLE.edge(kind)}${plan?.style ?? ''}" edge="1" parent="1" `
        + `source="${esc(e.from)}" target="${esc(e.to)}">`
        + (points ? `<mxGeometry relative="1" as="geometry">${points}</mxGeometry></mxCell>` : '<mxGeometry relative="1" as="geometry" /></mxCell>'));
      if (e.label) {
        const color = EDGE_KINDS[kind].stroke === T.flow ? T.text : EDGE_KINDS[kind].stroke;
        push(`<mxCell id="${esc(id)}-lbl" value="${labelValue(e.label)}" style="${STYLE.edgeLabel(color)}" vertex="1" connectable="0" parent="${esc(id)}">`
          + `<mxGeometry x="${e.labelPos ?? plan?.labelX ?? -0.1}" relative="1" as="geometry"><mxPoint as="offset" /></mxGeometry></mxCell>`);
      }
    }

    // Legend: the reference corpus documents line semantics explicitly, so any
    // diagram using more than one connector kind gets one.
    const kinds = [...new Set((spec.edges ?? []).map(kindOf))];
    if (spec.legend !== false && kinds.length > 1) {
      const lx = spec.legendX ?? pageW + 120;
      const ly = spec.legendY ?? L.originY;
      push(`<mxCell id="legend" value="Legend" style="${STYLE.text(T.fontHeading, T.text, true, 'left')}" vertex="1" parent="1">`
        + `<mxGeometry x="${Math.round(lx)}" y="${Math.round(ly - 40)}" width="200" height="26" as="geometry" /></mxCell>`);
      kinds.forEach((k, i) => {
        const e = EDGE_KINDS[k] ?? EDGE_KINDS.flow;
        const y = ly + i * 40;
        push(`<mxCell id="legend-a${i}" value="" style="${STYLE.text(1, T.text, false)}" vertex="1" parent="1">`
          + `<mxGeometry x="${Math.round(lx)}" y="${Math.round(y)}" width="1" height="1" as="geometry" /></mxCell>`);
        push(`<mxCell id="legend-b${i}" value="" style="${STYLE.text(1, T.text, false)}" vertex="1" parent="1">`
          + `<mxGeometry x="${Math.round(lx + 70)}" y="${Math.round(y)}" width="1" height="1" as="geometry" /></mxCell>`);
        push(`<mxCell id="legend-e${i}" style="${STYLE.edge(k)}" edge="1" parent="1" source="legend-a${i}" target="legend-b${i}">`
          + '<mxGeometry relative="1" as="geometry" /></mxCell>');
        push(`<mxCell id="legend-t${i}" value="${esc(e.meaning)}" style="${STYLE.text(T.fontBody, T.text, false, 'left')}" vertex="1" parent="1">`
          + `<mxGeometry x="${Math.round(lx + 86)}" y="${Math.round(y - 15)}" width="230" height="30" as="geometry" /></mxCell>`);
        track(lx + 86, y - 15, 230, 30);
      });
    }

    // The last word before anything is written. main() backs up and writes only
    // after buildDiagram returns, so a throw here leaves the target untouched.
    const drawn = cells.map((cell) => ({ id: /\bid="([^"]*)"/.exec(cell)?.[1] ?? 'a cell with no id', ...geometryOf(cell) }));
    const nonFinite = nonFiniteBoxes([...drawn, { id: 'the page', width: pageW, height: pageH }]);
    if (nonFinite.length) throw new SpecError(nonFinite.map((problem) => at + problem));

    const model = `<mxGraphModel dx="1400" dy="800" grid="0" gridSize="10" guides="1" tooltips="1" `
      + `connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="${Math.max(850, Math.round(pageW + 120))}" `
      + `pageHeight="${Math.max(1100, Math.round(pageH + 120))}" math="0" shadow="0">\n`
      + `    <root>\n      <mxCell id="0" />\n      <mxCell id="1" parent="0" />\n      `
      + cells.join('\n      ') + '\n    </root>\n  </mxGraphModel>';

    return `  <diagram name="${esc(name)}" id="${esc(pageId)}">\n    ` + model + '\n  </diagram>';
  });

  // Different ids that draw the same picture, e.g. azure/groups beside
  // azure/my-customers: two concepts a reader cannot tell apart (#77).
  const byPayload = new Map();
  for (const d of drawnIcons) byPayload.set(d.sha256, [...(byPayload.get(d.sha256) ?? []), d]);
  for (const group of byPayload.values()) {
    const ids = [...new Set(group.map((d) => d.id))].sort();
    if (ids.length > 1) report.sameArtwork.push({ ids, nodes: group.map((d) => d.node) });
  }

  // Draw.io writes the page count on a multi-page file. A single page leaves it
  // off, so a spec without `pages` builds exactly what it always did.
  const count = Array.isArray(spec.pages) ? ` pages="${diagrams.length}"` : '';
  const xml = `<mxfile host="Electron" agent="arkitect-drawio" version="29.0.3"${count}>\n`
    + diagrams.join('\n') + '\n</mxfile>\n';

  return { xml, report };
}

const USAGE = 'usage: build-diagram.mjs <spec.json> --out <file.drawio> [--keep-backups N] [--defaults]\n'
  + '       build-diagram.mjs --print-style [--defaults]';

// styleSummary() says where the style came from and what it changed, and
// loadStyleOrWarn() warns once about an override it ignores; both are shared with
// Excalidraw's build, in lib/style-layer.mjs.
function main(argv) {
  const { options, positionals } = parseCliOrExit(argv, {
    values: { '--out': null, '--keep-backups': null }, switches: ['--defaults', '--print-style'],
  }, USAGE);
  if (options['print-style']) {
    if (positionals.length || options.out !== undefined || options['keep-backups'] !== undefined) {
      exitUsage('--print-style builds nothing, so it takes no spec, --out or --keep-backups', USAGE);
    }
    const style = loadStyleOrWarn(Boolean(options.defaults));
    console.log(JSON.stringify({ store: engineStore('drawio'), ...styleSummary(style, { full: true }) }, null, 2));
    return;
  }
  if (positionals.length !== 1) {
    exitUsage(positionals.length ? `expected one spec file, got ${positionals.length}` : 'expected a spec file', USAGE);
  }
  if (!options.out) exitUsage('--out <file.drawio> is required', USAGE);
  const [specPath] = positionals;
  const { out } = options;
  const keep = options['keep-backups'] ?? String(DEFAULT_KEEP_BACKUPS);
  if (!/^\d+$/.test(keep) || !Number.isSafeInteger(Number(keep))) {
    exitUsage(`--keep-backups expects how many backups to keep, a whole number (0 keeps all), got ${keep}`, USAGE);
  }

  // One line, not a stack trace: the message never quotes the spec's content.
  let spec;
  try {
    spec = readJson(specPath);
  } catch (error) {
    exitUsage(error.code === 'ENOENT' ? `no spec file at ${specPath}`
      : error instanceof SyntaxError ? `${specPath} is not valid JSON`
        : `cannot read spec ${specPath}: ${error.code ?? error.message}`);
  }
  const style = loadStyleOrWarn(Boolean(options.defaults));
  let built;
  try {
    built = buildDiagram(spec, { style });
  } catch (error) {
    if (!(error instanceof SpecError)) throw error;
    // Refused before the backup and the write, so an existing file is untouched.
    console.error(JSON.stringify({ ok: false, spec: specPath, wrote: null, errors: error.errors }, null, 2));
    process.exit(1);
  }
  const { xml, report } = built;
  // A missing output folder is created, not reported as a stack trace (#113).
  mkdirSync(dirname(out), { recursive: true });
  const backup = backupExisting(out);
  writeFileSync(out, xml);
  // Only once the new file is written: a failed write keeps every backup (#49).
  const pruned = pruneBackups(out, { keep: Number(keep) });

  console.log(JSON.stringify({
    wrote: out, bytes: Buffer.byteLength(xml), backup, pruned,
    icons: {
      resolved: report.used.length,
      missing: report.missing,
      ambiguous: report.ambiguous,
      needsFetch: report.needsFetch,
      sameArtwork: report.sameArtwork,
      lifecycle: report.lifecycle,
      ...(spec.context?.packs ? { contextPacks: spec.context.packs } : {}),
    },
    logos: { embedded: report.logos.length, missing: report.missingLogos, opaqueBackground: report.opaqueLogos },
    // Drawn, but not as the spec said. Treat it like an unresolved icon: fix the
    // kind and rebuild, or say why it stays (#48).
    unknownKinds: report.unknownKinds,
    // Written, and not drawn at all: a key this builder has no use for. Same
    // treatment - fix it or report it; do not let it stand as done (#205).
    unknownFields: report.unknownFields,
    // A plain box laid over nodes it does not own, or sized in grid cells.
    // Drawn as asked; fix it or say why it stays (#204).
    looksLikeBoundary: report.looksLikeBoundary,
    // A plain box whose label names a product with a bundled mark: drawn as
    // text. Paste an entry's `replace` over its node, or say why it stays text
    // (#240, #287).
    namesAProduct: report.namesAProduct,
    notes: report.notes,
    // Which style drew this: the house style, or this install's override (#89).
    style: styleSummary(style),
  }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('build-diagram.mjs')) main(process.argv.slice(2));
