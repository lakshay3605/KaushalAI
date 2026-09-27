#!/usr/bin/env node
// Derive the style-evidence record from designated .excalidraw examples.
//
//   node build-knowledge.mjs --sources a.excalidraw b.excalidraw --merge [--out <file>]
//   node build-knowledge.mjs --baseline [--out <file>]   a defaults record, no corpus
//   node build-knowledge.mjs --print [--out <file>]      show the record
//
// Writes structural statistics, style-token counts and file digests. Never
// labels, file names, paths, hostnames, URLs or image payloads - that redaction
// is what makes it safe to commit a record derived from private diagrams.
//
// By default the record is this install's own, in <ARKITECT_HOME>/excalidraw/,
// beside a sources.json naming the files it came from - outside the plugin, so
// an update cannot wipe it (#89). references/source-analysis.json is the shipped
// house style; a maintainer rebuilds that only with an explicit --out.
//
// Until examples are supplied, every convention is marked `default`: it comes
// from Excalidraw's own defaults and ordinary architecture-drawing practice,
// not from evidence. Nothing here invents an evidence count it does not have.

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readScene, sha256 } from './lib/excalidraw-core.mjs';
import { analyzeScene } from './analyze-excalidraw.mjs';
import { storeFile, writeJson } from '../../arkitect-drawio/scripts/lib/store.mjs';
import { readJson } from '../../arkitect-drawio/scripts/lib/read-json.mjs';
import { parseCliOrExit, exitUsage } from '../../arkitect-drawio/scripts/lib/drawio-core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
const SHIPPED_RECORD = join(SKILL_ROOT, 'references', 'source-analysis.json');

// Each convention names the tally it is read from and the value the house style
// asserts. `basis` is what it rests on when there is no corpus yet.
// Each convention names the tally it is read from and the value the house style
// asserts. `basis` is what it rests on when there is no corpus yet.
//
// Most read from a `roles` tally rather than the whole-scene one: a scene's raw
// style counts are dominated by the hundreds of line segments inside library
// icons, which say nothing about how the author draws. Roles count arrows,
// authored text, authored shapes and zone boxes separately.
const CONVENTIONS = [
  { id: 'stroke-roughness', tally: ['style', 'roughness'], defaultValue: '1',
    statement: 'Shapes are drawn with roughness 1 (artist) - the hand-drawn look Excalidraw is chosen for.',
    basis: 'Excalidraw default' },
  { id: 'stroke-width', tally: ['roles', 'shape', 'strokeWidth'], defaultValue: '2',
    statement: 'Stroke width 2 (bold) for shapes; 1 only for weak associations.',
    basis: 'Excalidraw default is 1; 2 reads better at architecture scale' },
  { id: 'font-family', tally: ['roles', 'text', 'fontFamily'], defaultValue: '1',
    statement: 'Hand-drawn font family (1) throughout; family 3 for code or identifiers only.',
    basis: 'Excalidraw default' },
  { id: 'font-size', tally: ['roles', 'text', 'fontSize'], defaultValue: '16',
    statement: 'Body and node labels at 16 (S); section headings 20 (M); diagram title 28 (L).',
    basis: 'Excalidraw size steps' },
  { id: 'edges-rounded', tally: ['roles', 'shape', 'roundness'], defaultValue: 'type3',
    statement: 'Rounded corners on rectangles; sharp only where a shape must read as a boundary.',
    basis: 'Excalidraw default' },
  { id: 'fill-style', tally: ['roles', 'shape', 'fillStyle'], defaultValue: 'solid',
    statement: 'Solid fills rather than hachure, so a filled node stays legible when scaled down.',
    basis: 'Excalidraw default is hachure; solid is the common choice for diagrams' },
  { id: 'stroke-palette', tally: ['roles', 'shape', 'strokeColor'], defaultValue: '#1e1e1e',
    statement: 'Excalidraw default palette only: #1e1e1e, #e03131, #2f9e44, #1971c2, #f08c00.',
    basis: 'Excalidraw default swatches' },
  { id: 'node-background', tally: ['roles', 'shape', 'backgroundColor'], defaultValue: 'transparent',
    statement: 'Shapes are unfilled by default; fill carries meaning, so it is spent sparingly.',
    basis: 'Excalidraw default' },
  { id: 'node-footprint', tally: ['roles', 'shape', 'size'], defaultValue: '100x100',
    statement: 'Icon-sized nodes occupy roughly a 100x100 square.',
    basis: 'the size Excalidraw library items are authored at' },
  { id: 'stroke-style', tally: ['roles', 'shape', 'strokeStyle'], defaultValue: 'solid',
    statement: 'Solid strokes; a broken stroke marks a boundary rather than a thing.',
    basis: 'Excalidraw default' },
  { id: 'text-align', tally: ['roles', 'text', 'textAlign'], defaultValue: 'center',
    statement: 'Node captions centred; only multi-line body copy is left-aligned.',
    basis: 'Excalidraw default for bound labels' },
  { id: 'arrowhead', tally: ['roles', 'arrow', 'endArrowhead'], defaultValue: 'arrow',
    statement: 'Target end only, default open arrowhead.',
    basis: 'Excalidraw default' },
  { id: 'arrow-color', tally: ['roles', 'arrow', 'strokeColor'], defaultValue: '#1e1e1e',
    statement: 'Connectors are near-black unless the colour itself carries meaning.',
    basis: 'Excalidraw default' },
  { id: 'arrow-stroke-width', tally: ['roles', 'arrow', 'strokeWidth'], defaultValue: '2',
    statement: 'Connectors at stroke width 2.',
    basis: 'reads clearly without dominating the shapes' },
  { id: 'arrow-routing', tally: ['roles', 'arrow', 'elbowed'], defaultValue: 'false',
    statement: 'Connectors run as straight or multi-point arrows rather than elbow arrows.',
    basis: 'Excalidraw default; elbow arrows are opt-in' },
  { id: 'arrow-labels', tally: ['roles', 'arrow', 'labelled'], defaultValue: 'true',
    statement: 'An edge that needs a word carries it as a label bound to the arrow.',
    basis: 'a bound label follows the arrow when either end moves' },
  { id: 'zone-stroke-style', tally: ['roles', 'zone', 'strokeStyle'], defaultValue: 'dashed',
    statement: 'Boundary boxes are drawn with a dashed stroke.',
    basis: 'a broken outline reads as a region rather than a thing' },
  { id: 'zone-stroke-width', tally: ['roles', 'zone', 'strokeWidth'], defaultValue: '2',
    statement: 'Boundary boxes at stroke width 2.',
    basis: 'matches the shapes they enclose' },
  { id: 'canvas-background', tally: ['geometry', 'canvasBackground'], defaultValue: '#ffffff',
    statement: 'White canvas.',
    basis: 'Excalidraw default' },
  // The four below read from tallies derived across the corpus rather than from
  // any single element property - see buildDerived().
  { id: 'label-placement', tally: ['derived', 'labelPlacement'], defaultValue: 'bound',
    statement: 'Labels are bound to their shape, so moving the shape moves the text.',
    basis: 'bound labels survive editing; the alternative is free text placed by eye' },
  { id: 'boundary-mechanism', tally: ['derived', 'boundary'], defaultValue: 'frame',
    statement: 'Named regions are frame elements.',
    basis: 'frames are the purpose-built mechanism' },
  { id: 'arrow-binding', tally: ['derived', 'arrowEnds'], defaultValue: 'bound',
    statement: 'Both ends of every connector are bound to their shapes.',
    basis: 'unbound arrows detach when a shape is moved' },
  { id: 'icon-source', tally: ['derived', 'iconSource'], defaultValue: 'drawn',
    statement: 'Icons are drawn as Excalidraw elements rather than placed as raster images.',
    basis: 'vector icons stay editable and restyleable' },
];

// Corpus-wide comparisons that no single element carries. Shaped like the other
// tallies so one code path reads them all.
function buildDerived(analyses) {
  const sum = (f) => analyses.reduce((n, a) => n + (f(a) ?? 0), 0);
  const arrows = sum((a) => a.counts.byType.arrow);
  const boundEnds = sum((a) => a.counts.boundArrowEnds);
  return {
    labelPlacement: {
      free: sum((a) => a.counts.freeText),
      bound: sum((a) => a.counts.boundLabels),
    },
    boundary: {
      'scope-shape': sum((a) => a.counts.scopeShapes),
      frame: sum((a) => a.counts.frames),
    },
    arrowEnds: {
      bound: boundEnds,
      unbound: Math.max(0, arrows * 2 - boundEnds),
    },
    iconSource: {
      drawn: sum((a) => a.counts.groups),
      image: sum((a) => a.images.placements),
    },
  };
}

function pick(analysis, path) {
  let cur = analysis;
  for (const k of path) cur = cur?.[k];
  return cur;
}

function mergeTally(target, source) {
  if (!source) return;
  for (const [k, v] of Object.entries(source)) target[k] = (target[k] ?? 0) + (typeof v === 'number' ? v : 1);
}

function confidenceFor(share, n) {
  if (n < 6) return 'low';
  if (share >= 0.8) return 'high';
  if (share >= 0.6) return 'medium';
  return 'low';
}

export function buildRecord(analyses, { previous = null } = {}) {
  const corpus = {
    files: analyses.length,
    elements: analyses.reduce((n, a) => n + a.counts.elements, 0),
    images: analyses.reduce((n, a) => n + a.images.placements, 0),
  };

  const merged = { style: {}, geometry: {}, roles: {}, derived: buildDerived(analyses) };
  for (const a of analyses) {
    for (const key of Object.keys(a.style)) {
      merged.style[key] ??= {};
      mergeTally(merged.style[key], a.style[key]);
    }
    for (const [role, keys] of Object.entries(a.roles ?? {})) {
      merged.roles[role] ??= {};
      for (const [key, roleTally] of Object.entries(keys)) {
        merged.roles[role][key] ??= {};
        mergeTally(merged.roles[role][key], roleTally);
      }
    }
    merged.geometry.canvasBackground ??= {};
    if (a.geometry.canvasBackground) {
      merged.geometry.canvasBackground[a.geometry.canvasBackground] =
        (merged.geometry.canvasBackground[a.geometry.canvasBackground] ?? 0) + 1;
    }
  }

  const conventions = CONVENTIONS.map((c) => {
    const tally = pick(merged, c.tally);
    if (!tally || !Object.keys(tally).length) {
      return {
        id: c.id,
        statement: c.statement,
        observed: null,
        evidence: { n: 0, total: 0, share: null },
        confidence: 'default',
        basis: c.basis,
      };
    }
    const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((n, [, v]) => n + v, 0);
    const [value, n] = entries[0];
    const share = total ? n / total : 0;
    return {
      id: c.id,
      // Once there is evidence, the record states what the corpus actually does,
      // not what the default asserts. A disagreement is information, not an error.
      statement: value === c.defaultValue
        ? c.statement
        : `${c.statement} — the corpus instead prefers ${JSON.stringify(value)}.`,
      observed: value,
      agreesWithDefault: value === c.defaultValue,
      distribution: Object.fromEntries(entries.slice(0, 6)),
      evidence: { n, total, share: Math.round(share * 100) / 100 },
      confidence: confidenceFor(share, total),
    };
  });

  const layout = {
    readingDirection: analyses.reduce((acc, a) => ({
      horizontalEdges: acc.horizontalEdges + a.geometry.readingDirection.horizontalEdges,
      verticalEdges: acc.verticalEdges + a.geometry.readingDirection.verticalEdges,
    }), { horizontalEdges: 0, verticalEdges: 0 }),
    nodeWidth: analyses.map((a) => a.geometry.nodeWidth).filter(Boolean),
    nodeHeight: analyses.map((a) => a.geometry.nodeHeight).filter(Boolean),
    pitchX: analyses.map((a) => a.geometry.connectedPitchX).filter(Boolean),
    pitchY: analyses.map((a) => a.geometry.connectedPitchY).filter(Boolean),
    snappedTo10: analyses.map((a) => a.geometry.snappedTo10),
    canvases: analyses.map((a) => a.geometry.canvas),
  };

  const structure = {
    boundLabelShare: (() => {
      const bound = analyses.reduce((n, a) => n + a.counts.boundLabels, 0);
      const free = analyses.reduce((n, a) => n + a.counts.freeText, 0);
      return bound + free ? Math.round((bound / (bound + free)) * 100) / 100 : null;
    })(),
    boundArrowEnds: analyses.reduce((n, a) => n + a.counts.boundArrowEnds, 0),
    unboundArrows: analyses.reduce((n, a) => n + a.counts.unboundArrows, 0),
    frames: analyses.reduce((n, a) => n + a.counts.frames, 0),
    scopeShapes: analyses.reduce((n, a) => n + (a.counts.scopeShapes ?? 0), 0),
    containerLikeShapes: analyses.reduce((n, a) => n + a.counts.containerLikeShapes, 0),
    groups: analyses.reduce((n, a) => n + a.counts.groups, 0),
    imagesVsShapes: {
      images: corpus.images,
      shapes: analyses.reduce((n, a) => n + (a.counts.byType.rectangle ?? 0)
        + (a.counts.byType.ellipse ?? 0) + (a.counts.byType.diamond ?? 0), 0),
    },
  };

  const version = (previous?.version ?? 0) + 1;
  const history = [...(previous?.history ?? []), {
    version,
    at: new Date().toISOString(),
    files: corpus.files,
    elements: corpus.elements,
  }];

  return {
    _comment: 'Derived style evidence. Structural statistics and digests only - no labels, paths, URLs or image payloads. Regenerate with build-knowledge.mjs.',
    version,
    generated: new Date().toISOString(),
    corpus,
    sources: analyses.map((a) => ({ sha256: a.file?.sha256 ?? null, bytes: a.file?.bytes ?? null })),
    conventions,
    layout,
    structure,
    tallies: merged,
    history,
  };
}

function loadRecord(path) {
  if (!existsSync(path)) return null;
  try { return readJson(path); } catch { return null; }
}

const USAGE = `usage: build-knowledge.mjs --sources <file...> [--merge] [--out p]
       build-knowledge.mjs --baseline    (no corpus: write the defaults record)
       build-knowledge.mjs --print`;

// Learning rewrites the style record, so the arguments are checked before a
// single scene is read. `--help` used to be ignored, which meant asking for the
// usage performed the learn and replaced the record (#151).
function main(argv) {
  const { options, positionals } = parseCliOrExit(argv, {
    variadic: ['--sources'],
    values: { '--out': null },
    switches: ['--merge', '--baseline', '--print'],
  }, USAGE);
  if (positionals.length) exitUsage(`unexpected argument ${positionals[0]}; files go after --sources`, USAGE);
  const has = (n) => options[n.slice(2)] === true;
  const sources = options.sources ?? [];

  // The three modes do different things to the record, so asking for two at
  // once is refused rather than silently ranked.
  if (has('--print') && (sources.length || has('--merge') || has('--baseline'))) {
    exitUsage('--print only reads a record; it takes no other mode', USAGE);
  }
  if (has('--baseline') && (sources.length || has('--merge'))) {
    exitUsage('--baseline writes the defaults record and reads no corpus', USAGE);
  }

  const ownRecord = storeFile('excalidraw', 'record');
  const out = options.out === undefined ? ownRecord : resolve(options.out);

  if (has('--print')) {
    // Your own record once you have one, the shipped house style until then.
    const path = options.out === undefined && !existsSync(ownRecord) ? SHIPPED_RECORD : out;
    const rec = loadRecord(path);
    if (!rec) { console.error(`no record at ${path}`); process.exit(1); }
    console.log(JSON.stringify({
      record: path,
      version: rec.version,
      corpus: rec.corpus,
      conventions: rec.conventions.map((c) => ({ id: c.id, confidence: c.confidence, observed: c.observed })),
      history: rec.history?.length ?? 0,
    }, null, 2));
    return;
  }

  if (!sources.length && !has('--baseline')) exitUsage('--sources needs at least one file', USAGE);
  const missing = sources.filter((f) => !existsSync(f));
  if (missing.length) exitUsage(`no such file: ${missing[0]}`, USAGE);

  const analyses = sources.map((f) => {
    const raw = readFileSync(f);
    return {
      file: { bytes: statSync(f).size, sha256: sha256(raw) },
      ...analyzeScene(readScene(f)),
    };
  });

  const previous = has('--merge') ? loadRecord(out) : null;
  const record = buildRecord(analyses, { previous });
  if (has('--baseline')) { record.version = 0; record.history = []; }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(record, null, 2)}\n`);
  // The paths stay beside your own record in the store, never beside a record
  // that could be committed.
  if (out === ownRecord && sources.length) writeJson(storeFile('excalidraw', 'sources'), { files: sources.map((f) => resolve(f)) });

  console.log(JSON.stringify({
    wrote: out,
    version: record.version,
    corpus: record.corpus,
    conventions: record.conventions.map((c) => ({ id: c.id, confidence: c.confidence, observed: c.observed })),
  }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('build-knowledge.mjs')) main(process.argv.slice(2));
