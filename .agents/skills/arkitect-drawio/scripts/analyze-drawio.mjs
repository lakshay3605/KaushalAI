#!/usr/bin/env node
// Summarize .drawio files into compact JSON without ever emitting page XML or
// raw labels. Handles compressed and uncompressed pages.
//
//   node analyze-drawio.mjs <file...> [--out summary.json]
//   node analyze-drawio.mjs <file> --page 0 --cells       (per-cell geometry table)
//   node analyze-drawio.mjs <file> --page 0 --images      (embedded image inventory)
//   node analyze-drawio.mjs <file> --find "Checkout API"  (the cells a label names)

import { writeFileSync } from 'node:fs';
import {
  fileMeta, readMxfile, extractCells, graphModelAttrs, parseStyle,
  styleShape, styleSignature, parseDataUri,
  parseCliOrExit, exitUsage, pageIndexArg, pageRangeError,
} from './lib/drawio-core.mjs';

const USAGE = 'usage: analyze-drawio.mjs <file...> [--out out.json]\n'
  + '       analyze-drawio.mjs <file> [--page N] (--cells | --images | --find <label>)';

const COLOR_KEYS = ['fillColor', 'strokeColor', 'fontColor', 'gradientColor', 'labelBackgroundColor', 'swimlaneFillColor'];

function tally(map, key) {
  if (key === undefined || key === null || key === '') return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topN(map, n = 20) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, n)
    .map(([k, v]) => ({ value: k, count: v }));
}

// Labels are confidential. Only shape statistics leave this function.
function labelStats(value) {
  const html = /<[^>]+>/.test(value);
  const text = value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!text) return null;
  const lines = text.split(/\n/).filter((l) => l.trim());
  const words = text.split(/\s+/).filter(Boolean);
  const letters = text.replace(/[^A-Za-z]/g, '');
  let caps = 'mixed';
  if (letters && letters === letters.toUpperCase()) caps = 'upper';
  else if (letters && letters === letters.toLowerCase()) caps = 'lower';
  else if (/^[A-Z]/.test(text)) caps = 'sentence';
  return {
    chars: text.length,
    words: words.length,
    lines: lines.length,
    caps,
    html,
    bold: /<b>|font-weight:\s*bold|fontStyle=1/i.test(value),
    hasDigit: /\d/.test(text),
    numberedPrefix: /^\(?\d+[).:\s]/.test(text),
  };
}

function bucket(n, step) {
  return n === null || !Number.isFinite(n) ? null : Math.round(n / step) * step;
}

function analyzePage(page) {
  const xml = page.xml;
  const model = graphModelAttrs(xml);
  const cells = extractCells(xml);

  const shapes = new Map();
  const signatures = new Map();
  const colors = Object.fromEntries(COLOR_KEYS.map((k) => [k, new Map()]));
  const fontSizes = new Map();
  const fontFamilies = new Map();
  const fontStyles = new Map();
  const sizes = new Map();
  const edgeStyles = new Map();
  const arrows = new Map();
  const dashPatterns = new Map();
  const strokeWidths = new Map();
  const labelPos = new Map();
  const aligns = new Map();
  const opacities = new Map();
  const rounded = new Map();
  const shadows = new Map();
  const images = new Map();
  const imageRefs = new Map();

  const ids = new Set();
  let vertices = 0; let edges = 0; let containers = 0; let swimlanes = 0;
  let groups = 0; let layers = 0; let withLabel = 0; let edgeLabels = 0;
  let danglingEdges = 0; let withWaypoints = 0; let totalWaypoints = 0;
  const labelSummaries = [];
  const xs = []; const ys = []; const ws = []; const hs = [];
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;

  for (const c of cells) {
    ids.add(c.id);
    const s = parseStyle(c.style);
    const isRoot = c.id === '0' || c.id === '1';
    if (isRoot || (!c.vertex && !c.edge)) {
      if (!isRoot && !c.style && c.parent === '0') layers++;
      if (isRoot) continue;
    }

    if (c.edge) {
      edges++;
      if (!c.source || !c.target) danglingEdges++;
      if (c.waypoints) { withWaypoints++; totalWaypoints += c.waypoints; }
      tally(edgeStyles, s.edgeStyle ?? (s.curved === '1' ? 'curved' : 'straight'));
      tally(arrows, `start=${s.startArrow ?? 'none'};end=${s.endArrow ?? 'classic'}`);
      tally(dashPatterns, s.dashed === '1' ? `dashed:${s.dashPattern ?? 'default'}` : 'solid');
      tally(strokeWidths, s.strokeWidth ?? '1');
      if (c.value) edgeLabels++;
    } else if (c.vertex) {
      vertices++;
      const g = c.geometry;
      if (g && g.x !== null && !g.relative) {
        xs.push(g.x); ys.push(g.y); ws.push(g.width); hs.push(g.height);
        minX = Math.min(minX, g.x); minY = Math.min(minY, g.y);
        maxX = Math.max(maxX, g.x + (g.width ?? 0));
        maxY = Math.max(maxY, g.y + (g.height ?? 0));
        tally(sizes, `${g.width}x${g.height}`);
      }
      if (s.container === '1' || s.swimlane) containers++;
      if (styleShape(c.style) === 'swimlane' || s.swimlane) swimlanes++;
      if (s.group) groups++;
      tally(shapes, styleShape(c.style) ?? (c.style ? 'rectangle' : 'default'));
      tally(rounded, s.rounded ?? '0');
      tally(shadows, s.shadow ?? '0');
      if (s.image) {
        const d = String(s.image).startsWith('data:') ? parseDataUri(s.image) : null;
        if (d) {
          const k = d.hash;
          const cur = images.get(k) ?? { hash: k, mime: d.mime, count: 0, sizes: new Set() };
          cur.count++;
          if (c.geometry) cur.sizes.add(`${c.geometry.width}x${c.geometry.height}`);
          images.set(k, cur);
        } else {
          // External reference. Record the class only - the URL itself may be
          // customer-specific, so it never enters the summary.
          tally(imageRefs, /^https?:/.test(String(s.image)) ? 'remote-url' : 'builtin-stencil');
        }
      }
    }

    tally(signatures, styleSignature(c.style));
    for (const k of COLOR_KEYS) tally(colors[k], s[k]);
    tally(fontSizes, s.fontSize);
    tally(fontFamilies, s.fontFamily);
    tally(fontStyles, s.fontStyle);
    tally(labelPos, `v=${s.verticalLabelPosition ?? '-'};valign=${s.verticalAlign ?? '-'};lp=${s.labelPosition ?? '-'}`);
    tally(aligns, s.align);
    tally(opacities, s.opacity);

    if (c.value) {
      withLabel++;
      const ls = labelStats(c.value);
      if (ls) labelSummaries.push(ls);
    }
  }

  // Alignment rhythm: how often coordinates land on a grid step.
  const gridFit = {};
  for (const step of [5, 10, 20, 25, 40, 50, 80]) {
    const all = xs.concat(ys).filter((v) => Number.isFinite(v));
    gridFit[step] = all.length ? Number((all.filter((v) => Math.abs(v / step - Math.round(v / step)) < 1e-6).length / all.length).toFixed(3)) : 0;
  }

  const sortNum = (a) => a.slice().sort((p, q) => p - q);
  const pct = (arr, p) => (arr.length ? sortNum(arr)[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null);

  const labelAgg = {
    count: labelSummaries.length,
    html: labelSummaries.filter((l) => l.html).length,
    bold: labelSummaries.filter((l) => l.bold).length,
    multiline: labelSummaries.filter((l) => l.lines > 1).length,
    numberedPrefix: labelSummaries.filter((l) => l.numberedPrefix).length,
    caps: labelSummaries.reduce((acc, l) => { acc[l.caps] = (acc[l.caps] ?? 0) + 1; return acc; }, {}),
    words: { p50: pct(labelSummaries.map((l) => l.words), 0.5), p90: pct(labelSummaries.map((l) => l.words), 0.9), max: Math.max(0, ...labelSummaries.map((l) => l.words)) },
    chars: { p50: pct(labelSummaries.map((l) => l.chars), 0.5), p90: pct(labelSummaries.map((l) => l.chars), 0.9), max: Math.max(0, ...labelSummaries.map((l) => l.chars)) },
  };

  return {
    name: page.name,
    id: page.id,
    compressed: page.compressed,
    model: {
      grid: model.grid, gridSize: model.gridSize, page: model.page,
      pageWidth: model.pageWidth, pageHeight: model.pageHeight,
      background: model.background, math: model.math, shadow: model.shadow,
      arrows: model.arrows, connect: model.connect,
    },
    counts: {
      cells: cells.length, vertices, edges, containers, swimlanes, groups, layers,
      uniqueIds: ids.size, duplicateIds: cells.length - ids.size,
      labelled: withLabel, edgeLabels, danglingEdges,
      edgesWithWaypoints: withWaypoints, avgWaypoints: withWaypoints ? Number((totalWaypoints / withWaypoints).toFixed(2)) : 0,
      distinctImages: images.size,
      imagePlacements: [...images.values()].reduce((a, b) => a + b.count, 0),
      externalImageRefs: [...imageRefs.entries()].map(([k, v]) => ({ kind: k, count: v })),
    },
    bounds: Number.isFinite(minX)
      ? { minX, minY, maxX, maxY, width: Math.round(maxX - minX), height: Math.round(maxY - minY),
          aspect: Number(((maxX - minX) / Math.max(1, maxY - minY)).toFixed(2)) }
      : null,
    geometry: {
      widths: { p10: pct(ws, 0.1), p50: pct(ws, 0.5), p90: pct(ws, 0.9) },
      heights: { p10: pct(hs, 0.1), p50: pct(hs, 0.5), p90: pct(hs, 0.9) },
      commonSizes: topN(sizes, 15),
      gridFit,
    },
    style: {
      shapes: topN(shapes, 20),
      signatures: topN(signatures, 15),
      fillColor: topN(colors.fillColor, 20),
      strokeColor: topN(colors.strokeColor, 20),
      fontColor: topN(colors.fontColor, 12),
      labelBackgroundColor: topN(colors.labelBackgroundColor, 8),
      fontSize: topN(fontSizes, 15),
      fontFamily: topN(fontFamilies, 6),
      fontStyle: topN(fontStyles, 6),
      align: topN(aligns, 6),
      labelPlacement: topN(labelPos, 10),
      opacity: topN(opacities, 6),
      rounded: topN(rounded, 4),
      shadow: topN(shadows, 4),
    },
    edgeStyle: {
      routing: topN(edgeStyles, 10),
      arrows: topN(arrows, 10),
      dash: topN(dashPatterns, 6),
      strokeWidth: topN(strokeWidths, 8),
    },
    images: [...images.values()]
      .filter((v) => v && v.hash)
      .map((v) => ({ hash: v.hash, mime: v.mime, count: v.count, sizes: [...v.sizes] }))
      .sort((a, b) => b.count - a.count),
    labels: labelAgg,
  };
}

// A label as a reader sees it: markup, line breaks and entities gone.
export function plainLabel(value) {
  return String(value ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

// The cells whose label contains `query`, case-blind, with the full id an edit
// needs and enough geometry to tell two apart (#266). Opt-in: only the labels
// asked for leave the file, never the page XML or an image.
export function findLabel(pages, query) {
  const q = plainLabel(query).toLowerCase();
  const out = [];
  if (!q) return out;
  for (const { index, name, xml } of pages) {
    for (const c of extractCells(xml)) {
      const label = plainLabel(c.value);
      if (!label.toLowerCase().includes(q)) continue;
      out.push({
        page: index, pageName: name, id: c.id, parent: c.parent, kind: c.edge ? 'edge' : 'vertex',
        label: label.length > 120 ? `${label.slice(0, 117)}...` : label,
        x: c.geometry?.x ?? null, y: c.geometry?.y ?? null, w: c.geometry?.width ?? null, h: c.geometry?.height ?? null,
        ...(c.edge ? { src: c.source, tgt: c.target } : {}),
      });
    }
  }
  return out;
}

function analyzeFile(path) {
  const meta = fileMeta(path);
  const mx = readMxfile(path);
  return {
    file: meta,
    mxfile: { host: mx.attrs.host, version: mx.attrs.version, declaredPages: mx.attrs.pages ?? String(mx.pages.length) },
    pageNames: mx.pages.map((p) => p.name),
    pages: mx.pages.map(analyzePage),
  };
}

function main(argv) {
  const { options: opts, positionals: files } = parseCliOrExit(argv,
    { values: { '--out': null, '--page': pageIndexArg, '--find': null }, switches: ['--cells', '--images'] }, USAGE);
  if (!files.length) exitUsage('expected at least one .drawio file', USAGE);
  if (opts.find !== undefined) {
    if (files.length > 1 || opts.cells || opts.images) exitUsage('--find reads one file, on its own', USAGE);
    const mx = readMxfile(files[0]);
    if (opts.page !== undefined && opts.page >= mx.pages.length) {
      console.error(pageRangeError(files[0], opts.page, mx.pages.length));
      process.exit(1);
    }
    const pages = mx.pages.map((p, index) => ({ index, name: p.name, xml: p.xml }))
      .filter((p) => opts.page === undefined || p.index === opts.page);
    console.log(JSON.stringify(findLabel(pages, opts.find), null, 1));
    return;
  }
  const perPage = opts.cells || opts.images;
  if (opts.page !== undefined && !perPage) exitUsage('--page selects the page for --cells or --images', USAGE);
  if (perPage && files.length > 1) exitUsage('--cells and --images read one file', USAGE);

  if (perPage) {
    const mx = readMxfile(files[0]);
    const index = opts.page ?? 0;
    if (index >= mx.pages.length) {
      console.error(pageRangeError(files[0], index, mx.pages.length));
      process.exit(1);
    }
    const page = mx.pages[index];
    const cells = extractCells(page.xml);
    if (opts.images) {
      const seen = new Map();
      for (const c of cells) {
        const s = parseStyle(c.style);
        if (!s.image) continue;
        const d = parseDataUri(s.image);
        if (!d) continue;
        const e = seen.get(d.hash) ?? { hash: d.hash, mime: d.mime, bytes: d.bytes.length, count: 0, sizes: new Set() };
        e.count++;
        if (c.geometry) e.sizes.add(`${c.geometry.width}x${c.geometry.height}`);
        seen.set(d.hash, e);
      }
      console.log(JSON.stringify([...seen.values()].map((e) => ({ ...e, sizes: [...e.sizes] })), null, 2));
      return;
    }
    // Geometry table only: id/parent/size/shape, never labels.
    const rows = cells
      .filter((c) => c.vertex || c.edge)
      .map((c) => ({
        id: c.id, parent: c.parent, kind: c.edge ? 'edge' : 'vertex',
        shape: styleShape(c.style), hasImage: /(^|;)image=/.test(c.style),
        x: c.geometry?.x ?? null, y: c.geometry?.y ?? null,
        w: c.geometry?.width ?? null, h: c.geometry?.height ?? null,
        src: c.source, tgt: c.target, wp: c.waypoints,
        labelWords: c.value ? c.value.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0,
        fill: parseStyle(c.style).fillColor ?? null,
        stroke: parseStyle(c.style).strokeColor ?? null,
        fontSize: parseStyle(c.style).fontSize ?? null,
      }));
    console.log(JSON.stringify(rows, null, 1));
    return;
  }

  const result = { generated: new Date().toISOString(), files: files.map(analyzeFile) };
  const json = JSON.stringify(result, null, 2);
  if (opts.out) {
    writeFileSync(opts.out, json);
    console.log(`wrote ${opts.out} (${json.length} bytes)`);
  } else {
    console.log(json);
  }
}

if (process.argv[1] && process.argv[1].endsWith('analyze-drawio.mjs')) main(process.argv.slice(2));
