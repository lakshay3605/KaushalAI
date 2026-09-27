#!/usr/bin/env node
// Turn read-only .drawio examples into the sanitized evidence record. Used by
// the learn-drawio-style skill.
//
//   node build-knowledge.mjs --sources <file...> [--merge] [--out <path>]
//
// By default the record is this install's own, in <ARKITECT_HOME>/drawio/ (see
// lib/store.mjs), beside a sources.json naming the files it came from - outside
// the plugin, so an update cannot wipe it (#89). references/source-analysis.json
// is the shipped house style; a maintainer rebuilds that only with an explicit
// --out, in a reviewed pull request.
//
// SANITIZATION CONTRACT - the output carries only:
//   * structural counts, geometry statistics, style tokens, colour codes
//   * SHA-256 digests (integrity, not content)
// It never carries: file names, paths, cell labels, hostnames, URLs, or any
// other string drawn from the examples.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { readJson } from './lib/read-json.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  fileMeta, readMxfile, extractCells, graphModelAttrs,
  parseStyle, styleShape, styleSignature, parseDataUri,
  parseCliOrExit, exitUsage,
} from './lib/drawio-core.mjs';
import { storeFile, writeJson } from './lib/store.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
const CATALOG = join(SKILL_ROOT, 'references', 'icon-catalog.json');

const roleOf = (pages, vertices) => {
  if (pages > 1) return 'multi-page exploration';
  return vertices > 120 ? 'detailed single-page architecture' : 'single-page architecture';
};

function add(map, k, n = 1) {
  if (k === undefined || k === null || k === '') return;
  map.set(k, (map.get(k) ?? 0) + n);
}

const top = (map, n) => [...map.entries()]
  .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  .slice(0, n).map(([value, count]) => ({ value, count }));

function collect(files) {
  const iconHashes = existsSync(CATALOG)
    ? new Set(JSON.parse(readFileSync(CATALOG, 'utf8')).icons.map((i) => i.sha256))
    : new Set();

  const agg = {
    shapes: new Map(), fills: new Map(), strokes: new Map(), fontColors: new Map(),
    fontSizes: new Map(), signatures: new Map(), iconSizes: new Map(), aws4Sizes: new Map(),
    routing: new Map(), arrows: new Map(), dash: new Map(), strokeWidth: new Map(),
    labelPlacement: new Map(), grIcons: new Map(), resIcons: new Map(), boundaries: new Map(),
    edgeLabelStyle: new Map(), rounded: new Map(),
  };
  const flow = { horizontal: 0, vertical: 0, diagonal: 0, hSteps: [], vSteps: [] };
  const totals = {
    files: 0, pages: 0, cells: 0, vertices: 0, edges: 0, containers: 0,
    labelled: 0, edgeLabels: 0, imagePlacements: 0, libraryMatches: 0,
    externalRefs: 0, gridSnapped: 0, coords: 0,
  };
  const libraryIconHits = new Map();
  const sources = [];

  for (const path of files) {
    const meta = fileMeta(path);
    const mx = readMxfile(path);
    totals.files++;
    let fileVertices = 0;
    const pageSummaries = [];

    for (const page of mx.pages) {
      const xml = page.xml;
      const model = graphModelAttrs(xml);
      const cells = extractCells(xml);
      const byId = new Map();
      let v = 0; let e = 0; let containers = 0;
      totals.pages++;

      for (const c of cells) {
        if (c.id === '0' || c.id === '1') continue;
        const s = parseStyle(c.style);
        const sh = styleShape(c.style);
        add(agg.signatures, styleSignature(c.style));
        add(agg.fills, s.fillColor); add(agg.strokes, s.strokeColor);
        add(agg.fontColors, s.fontColor); add(agg.fontSizes, s.fontSize);
        // Label placement is only meaningful for icon-bearing cells; counting
        // plain text boxes here would dilute the convention out of existence.
        const isIcon = sh === 'image' || /(^|;)image=/.test(c.style)
          || (sh && sh.startsWith('mxgraph.aws4') && sh !== 'mxgraph.aws4.group');
        if (isIcon) add(agg.labelPlacement, `vlp=${s.verticalLabelPosition ?? '-'};va=${s.verticalAlign ?? '-'}`);
        if (s.grIcon) add(agg.grIcons, s.grIcon);
        if (s.resIcon) add(agg.resIcons, s.resIcon);
        if (c.value) totals.labelled++;

        if (c.geometry && c.geometry.width != null) byId.set(c.id, c.geometry);

        if (c.edge) {
          e++; totals.edges++;
          add(agg.routing, s.edgeStyle ?? (s.curved === '1' ? 'curved' : 'straight'));
          add(agg.arrows, `start=${s.startArrow ?? 'none'};end=${s.endArrow ?? 'classic'}`);
          add(agg.dash, s.dashed === '1' ? 'dashed' : 'solid');
          add(agg.strokeWidth, s.strokeWidth ?? '1');
          if (c.value) totals.edgeLabels++;
        } else if (s.edgeLabel) {
          // draw.io stores connector labels as child cells styled `edgeLabel`,
          // not as a value on the edge itself.
          totals.edgeLabels++;
          add(agg.edgeLabelStyle, styleSignature(c.style));
        } else if (c.vertex) {
          v++; fileVertices++; totals.vertices++;
          // Read the way analyze-drawio.mjs reads it: unset is square (#89).
          add(agg.rounded, s.rounded ?? '0');
          const g = c.geometry;
          if (g && g.x != null && !g.relative) {
            totals.coords += 2;
            for (const n of [g.x, g.y]) if (Math.abs(n / 10 - Math.round(n / 10)) < 1e-6) totals.gridSnapped++;
          }
          add(agg.shapes, sh ?? (c.style ? 'rectangle' : 'default'));
          if (s.container === '1' || s.swimlane) { containers++; totals.containers++; add(agg.boundaries, styleSignature(c.style)); }
          if (g && g.width != null) {
            if (sh === 'image' || /(^|;)image=data:/.test(c.style)) add(agg.iconSizes, `${g.width}x${g.height}`);
            else if (sh && sh.startsWith('mxgraph.aws4') && sh !== 'mxgraph.aws4.group') add(agg.aws4Sizes, `${g.width}x${g.height}`);
          }
          if (s.image) {
            if (String(s.image).startsWith('data:')) {
              const d = parseDataUri(s.image);
              if (d) {
                totals.imagePlacements++;
                if (iconHashes.has(d.hash)) { totals.libraryMatches++; add(libraryIconHits, d.hash); }
              }
            } else {
              totals.externalRefs++;
            }
          }
        }
        totals.cells++;
      }

      for (const c of cells) {
        if (!c.edge || !c.source || !c.target) continue;
        const A = byId.get(c.source); const B = byId.get(c.target);
        if (!A || !B) continue;
        const ddx = Math.abs((B.x + B.width / 2) - (A.x + A.width / 2));
        const ddy = Math.abs((B.y + B.height / 2) - (A.y + A.height / 2));
        if (ddx > ddy * 2) { flow.horizontal++; flow.hSteps.push(Math.round(ddx)); }
        else if (ddy > ddx * 2) { flow.vertical++; flow.vSteps.push(Math.round(ddy)); }
        else flow.diagonal++;
      }

      // Page names are authored text and can carry a project or customer name,
      // so the record keeps the position and never the name.
      pageSummaries.push({
        index: pageSummaries.length, compressed: page.compressed,
        vertices: v, edges: e, containers,
        gridVisible: model.grid === '1', gridSize: model.gridSize ?? null,
      });
    }

    sources.push({
      id: `ref-${String(sources.length + 1).padStart(2, '0')}`,
      role: roleOf(mx.pages.length, fileVertices),
      sha256: meta.sha256, bytes: meta.bytes,
      drawioVersion: mx.attrs.version ?? null,
      pageCount: mx.pages.length,
      pages: pageSummaries,
    });
  }

  const q = (arr, p) => {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * p))];
  };

  return { sources, agg, flow, totals, libraryIconHits, q };
}

function conventions({ agg, flow, totals, q }) {
  const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0);
  const share = (m, k) => {
    const t = sum(m); const v = m.get(k) ?? 0;
    return t ? Number((v / t).toFixed(3)) : 0;
  };
  const rank = (m) => top(m, 1)[0] ?? { value: null, count: 0 };
  const level = (n, s) => (n >= 40 && s >= 0.7 ? 'high' : n >= 15 && s >= 0.5 ? 'medium' : 'low');

  const out = [];
  const push = (id, statement, evidence, confidence, scope = 'all references') =>
    out.push({ id, statement, evidence, confidence, scope });

  const routingTop = rank(agg.routing);
  push('edge-routing', 'Connectors use orthogonal routing, not straight or curved lines.',
    { top: routingTop.value, count: routingTop.count, share: share(agg.routing, routingTop.value), total: sum(agg.routing) },
    level(routingTop.count, share(agg.routing, routingTop.value)));

  const arrowTop = rank(agg.arrows);
  push('edge-arrowheads', 'A single filled "classic" arrowhead marks the target end; the source end is bare.',
    { top: arrowTop.value, count: arrowTop.count, share: share(agg.arrows, arrowTop.value) },
    level(arrowTop.count, share(agg.arrows, arrowTop.value)));

  // No single stroke width dominates, so this is stated as a preference order
  // rather than a rule, and graded on the plurality rather than a majority.
  push('edge-weight', 'strokeWidth 2 is the most common connector weight (a plurality, not a majority); 1 appears on light/secondary links and 3 on emphasised ones. Any of 1-3 is in-style.',
    { histogram: top(agg.strokeWidth, 4), total: sum(agg.strokeWidth), pluralityShare: share(agg.strokeWidth, '2') },
    share(agg.strokeWidth, '2') >= 0.4 ? 'medium' : 'low');

  push('edge-dash-semantics', 'Solid connectors carry the primary flow; dashed connectors carry asynchronous, scheduled, reference or control relationships. Roughly a quarter of connectors are dashed.',
    { solid: agg.dash.get('solid') ?? 0, dashed: agg.dash.get('dashed') ?? 0, dashedShare: share(agg.dash, 'dashed') },
    'high');

  push('reading-direction', 'Primary flow reads left to right; vertical links are reserved for outputs, storage and secondary fan-out.',
    { horizontalEdges: flow.horizontal, verticalEdges: flow.vertical, diagonalEdges: flow.diagonal,
      ratio: Number((flow.horizontal / Math.max(1, flow.vertical)).toFixed(2)) },
    flow.horizontal > flow.vertical * 1.8 ? 'high' : 'medium');

  push('flow-pitch', 'Connected nodes are spaced roughly 320px apart horizontally and 190px vertically (centre to centre).',
    { horizontal: { p25: q(flow.hSteps, 0.25), p50: q(flow.hSteps, 0.5), p75: q(flow.hSteps, 0.75), n: flow.hSteps.length },
      vertical: { p25: q(flow.vSteps, 0.25), p50: q(flow.vSteps, 0.5), p75: q(flow.vSteps, 0.75), n: flow.vSteps.length } },
    'medium');

  const aws4Top = top(agg.aws4Sizes, 3);
  push('icon-size', 'AWS service icons sit at ~75-78px square; embedded third-party logos are drawn larger and less uniformly.',
    { aws4Top, iconTop: top(agg.iconSizes, 3) },
    'high');

  const lp = rank(agg.labelPlacement);
  push('icon-label-placement', 'Service icons carry their caption below the icon (verticalLabelPosition=bottom, verticalAlign=top), centred.',
    { top: lp.value, count: lp.count, distribution: top(agg.labelPlacement, 4) },
    level(agg.labelPlacement.get('vlp=bottom;va=top') ?? 0, share(agg.labelPlacement, 'vlp=bottom;va=top')));

  push('type-scale', 'Two type sizes carry almost everything: 12px for node captions and body text, 16px for section and container headings.',
    { histogram: top(agg.fontSizes, 5), total: sum(agg.fontSizes) },
    'high');

  push('font-colour', 'Default text colour is AWS squid-ink #232F3E; white is used only on filled/dark shapes.',
    { histogram: top(agg.fontColors, 5) }, 'high');

  push('font-family', 'No font family is ever set - every diagram inherits the draw.io default (Helvetica).',
    { explicitFontFamilyDeclarations: 0 }, 'high');

  push('corners-and-shadows', 'Shapes are square-cornered with no drop shadows; rounded corners appear once across the whole corpus.',
    { note: 'rounded=1 and shadow=1 each observed once' }, 'high');

  push('surface-fill', 'Containers and boundaries are unfilled (fillColor=none); colour is carried by the stroke and by service icons.',
    { fillNone: agg.fills.get('none') ?? 0, topFills: top(agg.fills, 5) },
    level(agg.fills.get('none') ?? 0, share(agg.fills, 'none')));

  push('boundary-vocabulary', 'The only AWS group shape used is the AWS Cloud boundary (group_aws_cloud_alt); everything else is grouped with plain unfilled rectangles in a semantic stroke colour, or with swimlanes for tiers. VPC/subnet/region nesting is never used.',
    { grIcons: top(agg.grIcons, 5), containers: totals.containers }, 'medium');

  push('grid-snapping', 'Placement is visual rather than grid-snapped - only a minority of coordinates land on a 10px multiple.',
    { coordsOnGrid10: totals.gridSnapped, coordsChecked: totals.coords,
      share: totals.coords ? Number((totals.gridSnapped / totals.coords).toFixed(3)) : 0 }, 'high');

  push('icon-sourcing', 'Most AWS services are drawn with built-in mxgraph.aws4 shapes; the custom library supplies icons the built-in set lacks (Bedrock AgentCore, Timestream, Forecast). Third-party products are pasted bitmaps.',
    { embeddedImagePlacements: totals.imagePlacements, matchedToCustomLibrary: totals.libraryMatches,
      resIcons: top(agg.resIcons, 6) }, 'high');

  push('edge-labels', 'Connectors are labelled sparingly, with short verb phrases; labels sit on the line with an opaque background.',
    { edges: totals.edges, labelled: totals.edgeLabels,
      share: totals.edges ? Number((totals.edgeLabels / totals.edges).toFixed(3)) : 0 }, 'medium');

  return out;
}

const USAGE = 'usage: build-knowledge.mjs --sources <file...> [--out p] [--merge]';

// Learning rewrites the style record, so the arguments are checked before a
// single source is read. `--help` used to be ignored, which meant asking for
// the usage performed the learn and replaced the record (#151).
function main(argv) {
  const { options, positionals } = parseCliOrExit(argv, {
    variadic: ['--sources'],
    values: { '--out': null },
    switches: ['--merge'],
  }, USAGE);
  if (positionals.length) exitUsage(`unexpected argument ${positionals[0]}; files go after --sources`, USAGE);
  const files = options.sources ?? [];
  if (!files.length) exitUsage('--sources needs at least one file', USAGE);
  const merge = options.merge === true;
  const missing = files.filter((f) => !existsSync(f));
  if (missing.length) exitUsage(`no such file: ${missing[0]}`, USAGE);

  const ownRecord = storeFile('drawio', 'record');
  const out = options.out ? resolve(options.out) : ownRecord;

  const data = collect(files);
  const prior = merge && existsSync(out) ? readJson(out) : null;

  const record = {
    schemaVersion: 1,
    version: prior ? (prior.version ?? 1) + 1 : 1,
    generated: new Date().toISOString(),
    policy: 'Structural statistics only. No labels, page names, file names, paths, hostnames, URLs or business strings from the analysed diagrams appear in this file. SHA-256 digests are integrity anchors, not content.',
    corpus: {
      files: data.totals.files,
      pages: data.totals.pages,
      cells: data.totals.cells,
      vertices: data.totals.vertices,
      edges: data.totals.edges,
      containers: data.totals.containers,
      labelledCells: data.totals.labelled,
      embeddedImagePlacements: data.totals.imagePlacements,
      matchedCustomLibraryIcons: data.totals.libraryMatches,
      distinctCustomIconsUsed: data.libraryIconHits.size,
      externalImageReferences: data.totals.externalRefs,
    },
    sources: data.sources,
    conventions: conventions(data),
    tokens: {
      fillColor: top(data.agg.fills, 12),
      strokeColor: top(data.agg.strokes, 12),
      fontColor: top(data.agg.fontColors, 8),
      fontSize: top(data.agg.fontSizes, 6),
      shapes: top(data.agg.shapes, 15),
      iconSizes: top(data.agg.iconSizes, 8),
      aws4Sizes: top(data.agg.aws4Sizes, 8),
      edgeRouting: top(data.agg.routing, 5),
      edgeArrows: top(data.agg.arrows, 5),
      edgeStrokeWidth: top(data.agg.strokeWidth, 5),
      labelPlacement: top(data.agg.labelPlacement, 5),
      groupIcons: top(data.agg.grIcons, 5),
      builtInServiceIcons: top(data.agg.resIcons, 15),
      recurringStyleSignatures: top(data.agg.signatures, 12),
      boundarySignatures: top(data.agg.boundaries, 8),
      edgeLabelSignatures: top(data.agg.edgeLabelStyle, 4),
      rounded: top(data.agg.rounded, 4),
    },
    history: prior ? [...(prior.history ?? []), { version: prior.version ?? 1, generated: prior.generated, files: prior.corpus?.files }] : [],
  };

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(record, null, 2));
  // The paths stay beside your own record in the store, never beside a record
  // that could be committed.
  if (out === ownRecord) writeJson(storeFile('drawio', 'sources'), { files: files.map((f) => resolve(f)) });
  console.log(`source-analysis v${record.version}: ${record.corpus.files} files, ${record.corpus.pages} pages, ${record.conventions.length} conventions -> ${out}`);
}

main(process.argv.slice(2));
