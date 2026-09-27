#!/usr/bin/env node
// Summarize .excalidraw scenes without pulling them into context.
//
//   node analyze-excalidraw.mjs scene.excalidraw
//   node analyze-excalidraw.mjs a.excalidraw b.excalidraw --out summary.json
//   node analyze-excalidraw.mjs scene.excalidraw --cells     geometry table
//   node analyze-excalidraw.mjs scene.excalidraw --images    embedded image inventory
//   node analyze-excalidraw.mjs scene.excalidraw --find "Checkout API"   what a label names
//
// A scene with embedded images runs to megabytes of base64; reading one whole
// is never the right move. This emits structure, style tokens and geometry.
// It never emits element text, links, frame names or file dataURLs - the same
// rule the learning skill relies on to keep private diagrams private.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import {
  readScene, elementBox, bbox, decodeDataUrl, sha256, parseCliOrExit, exitUsage, readProblem,
} from './lib/excalidraw-core.mjs';

function tally(values) {
  const counts = new Map();
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const k = String(v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1]));
}

function percentiles(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const at = (p) => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]);
  return { n: s.length, p25: at(0.25), p50: at(0.5), p75: at(0.75) };
}

export function analyzeScene(scene, { name = '<scene>' } = {}) {
  const all = scene.elements ?? [];
  const live = all.filter((el) => !el.isDeleted);
  const byId = new Map(live.map((el) => [el.id, el]));
  const shapes = live.filter((el) => ['rectangle', 'ellipse', 'diamond'].includes(el.type));
  const linears = live.filter((el) => el.type === 'arrow' || el.type === 'line');
  const texts = live.filter((el) => el.type === 'text');

  // Which shapes look like boundaries: a shape that geometrically contains at
  // least two others is a scope, not a node.
  const containers = [];
  for (const el of shapes) {
    const b = elementBox(el);
    const inside = live.filter((o) => o !== el && o.containerId !== el.id).filter((o) => {
      const ob = elementBox(o);
      return ob.x >= b.x && ob.y >= b.y && ob.x + ob.width <= b.x + b.width && ob.y + ob.height <= b.y + b.height;
    });
    if (inside.length >= 2) containers.push({ id: el.id, holds: inside.length, size: `${Math.round(b.width)}x${Math.round(b.height)}` });
  }

  // Pitch between connected elements: how far apart the author actually places
  // things that talk to each other.
  const dx = [];
  const dy = [];
  let horizontal = 0;
  let vertical = 0;
  for (const el of linears) {
    const a = byId.get(el.startBinding?.elementId);
    const b = byId.get(el.endBinding?.elementId);
    if (!a || !b) continue;
    const ab = elementBox(a);
    const bb = elementBox(b);
    const cx = Math.abs((ab.x + ab.width / 2) - (bb.x + bb.width / 2));
    const cy = Math.abs((ab.y + ab.height / 2) - (bb.y + bb.height / 2));
    if (cx > 4) dx.push(cx);
    if (cy > 4) dy.push(cy);
    if (cx >= cy) horizontal++; else vertical++;
  }

  const images = live.filter((el) => el.type === 'image');
  const files = scene.files ?? {};
  const imageInventory = [];
  for (const [id, file] of Object.entries(files)) {
    const decoded = decodeDataUrl(file.dataURL);
    const uses = images.filter((el) => el.fileId === id);
    imageInventory.push({
      fileId: id.slice(0, 12),
      mime: file.mimeType ?? decoded?.mime ?? null,
      bytes: decoded?.bytes.length ?? null,
      sha256: decoded ? decoded.sha256.slice(0, 16) : null,
      placements: uses.length,
      drawnAt: uses.map((el) => `${Math.round(el.width)}x${Math.round(el.height)}`),
    });
  }

  const view = bbox(live);
  const groupIds = new Set();
  for (const el of live) for (const g of el.groupIds ?? []) groupIds.add(g);

  // Whole-scene style tallies are dominated by the hundreds of line segments
  // inside library icons, which say nothing about how the author draws. Split
  // the counts by the role an element plays, and drop anything sitting in a
  // group of four or more - that is an icon's internals, not a placed element.
  const groupSize = new Map();
  for (const el of live) for (const g of el.groupIds ?? []) groupSize.set(g, (groupSize.get(g) ?? 0) + 1);
  const authored = (el) => !(el.groupIds ?? []).some((g) => (groupSize.get(g) ?? 0) >= 4);

  const roles = { arrow: {}, text: {}, shape: {}, zone: {} };
  const put = (role, key, value) => {
    roles[role][key] ??= {};
    roles[role][key][value] = (roles[role][key][value] ?? 0) + 1;
  };
  const isZone = (el) => el.strokeStyle && el.strokeStyle !== 'solid' && el.width >= 200 && el.height >= 100;

  for (const el of live) {
    if (el.type === 'arrow') {
      put('arrow', 'strokeColor', el.strokeColor);
      put('arrow', 'strokeWidth', el.strokeWidth);
      put('arrow', 'strokeStyle', el.strokeStyle);
      put('arrow', 'roughness', el.roughness);
      put('arrow', 'elbowed', String(!!el.elbowed));
      put('arrow', 'endArrowhead', String(el.endArrowhead));
      put('arrow', 'labelled', String((el.boundElements ?? []).some((b) => b.type === 'text')));
      continue;
    }
    if (!authored(el)) continue;
    if (el.type === 'text') {
      put('text', 'fontFamily', el.fontFamily);
      put('text', 'fontSize', Math.round(el.fontSize));
      put('text', 'textAlign', el.textAlign);
      put('text', 'bound', String(!!el.containerId));
      continue;
    }
    if (!['rectangle', 'ellipse', 'diamond'].includes(el.type)) continue;
    const role = isZone(el) ? 'zone' : 'shape';
    put(role, 'strokeColor', el.strokeColor);
    put(role, 'backgroundColor', el.backgroundColor);
    put(role, 'strokeWidth', el.strokeWidth);
    put(role, 'strokeStyle', el.strokeStyle);
    put(role, 'roughness', el.roughness);
    put(role, 'fillStyle', el.fillStyle);
    put(role, 'roundness', el.roundness?.type ? `type${el.roundness.type}` : 'sharp');
    put(role, 'size', `${Math.round(el.width / 100) * 100}x${Math.round(el.height / 100) * 100}`);
  }

  return {
    name,
    roles,
    counts: {
      elements: live.length,
      deleted: all.length - live.length,
      byType: tally(live.map((el) => el.type)),
      groups: groupIds.size,
      frames: live.filter((el) => el.type === 'frame').length,
      boundLabels: texts.filter((el) => el.containerId).length,
      freeText: texts.filter((el) => !el.containerId).length,
      containerLikeShapes: containers.length,
      // A boundary drawn as a shape: a large rectangle or ellipse with a broken
      // stroke. Counted so the record can say whether zones are scope shapes or
      // real frame elements.
      scopeShapes: live.filter((el) => (el.type === 'rectangle' || el.type === 'ellipse')
        && el.strokeStyle && el.strokeStyle !== 'solid'
        && el.width >= 200 && el.height >= 100).length,
      boundArrowEnds: linears.reduce((n, el) => n + (el.startBinding ? 1 : 0) + (el.endBinding ? 1 : 0), 0),
      unboundArrows: linears.filter((el) => el.type === 'arrow' && !el.startBinding && !el.endBinding).length,
    },
    style: {
      strokeColor: tally(live.map((el) => el.strokeColor)),
      backgroundColor: tally(live.map((el) => el.backgroundColor)),
      fillStyle: tally(shapes.filter((el) => el.backgroundColor !== 'transparent').map((el) => el.fillStyle)),
      strokeWidth: tally(live.map((el) => el.strokeWidth)),
      strokeStyle: tally(live.map((el) => el.strokeStyle)),
      roughness: tally(live.map((el) => el.roughness)),
      opacity: tally(live.map((el) => el.opacity)),
      roundness: tally(shapes.map((el) => (el.roundness ? `type${el.roundness.type}` : 'sharp'))),
      fontSize: tally(texts.map((el) => el.fontSize)),
      fontFamily: tally(texts.map((el) => el.fontFamily)),
      textAlign: tally(texts.map((el) => el.textAlign)),
      endArrowhead: tally(live.filter((el) => el.type === 'arrow').map((el) => el.endArrowhead ?? 'none')),
      startArrowhead: tally(live.filter((el) => el.type === 'arrow').map((el) => el.startArrowhead ?? 'none')),
      elbowed: tally(live.filter((el) => el.type === 'arrow').map((el) => Boolean(el.elbowed))),
    },
    geometry: {
      canvas: { width: Math.round(view.width), height: Math.round(view.height) },
      canvasBackground: scene.appState?.viewBackgroundColor ?? null,
      gridSize: scene.appState?.gridSize ?? null,
      nodeWidth: percentiles(shapes.map((el) => el.width)),
      nodeHeight: percentiles(shapes.map((el) => el.height)),
      containerSizes: containers.slice(0, 12),
      connectedPitchX: percentiles(dx),
      connectedPitchY: percentiles(dy),
      readingDirection: { horizontalEdges: horizontal, verticalEdges: vertical },
      arrowSegments: tally(linears.filter((el) => el.type === 'arrow').map((el) => (el.points ?? []).length)),
      // Free-hand placement lands on arbitrary coordinates; a snapped scene is
      // a different working style and worth recording.
      snappedTo10: Math.round(
        (live.filter((el) => Number.isFinite(el.x) && el.x % 10 === 0).length / Math.max(1, live.length)) * 100,
      ),
    },
    images: {
      placements: images.length,
      distinctFiles: Object.keys(files).length,
      inventory: imageInventory,
    },
  };
}

const USAGE = 'usage: analyze-excalidraw.mjs <file...> [--out summary.json] [--cells] [--images] [--find <label>]';

// The text and frames whose words contain `query`, case-blind, each with the
// full id of the shape an edit acts on (#266): the container a label is bound
// to, else the shape grouped with a caption, else the text itself. Opt-in: only
// the labels asked for leave the file, never a dataURL.
export function findLabel(scene, query) {
  const q = String(query ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!q) return [];
  const live = scene.elements.filter((el) => !el.isDeleted);
  const byId = new Map(live.map((el) => [el.id, el]));
  const out = [];
  for (const el of live) {
    const words = el.type === 'text' ? el.text : el.type === 'frame' || el.type === 'magicframe' ? el.name : null;
    const label = String(words ?? '').replace(/\s+/g, ' ').trim();
    if (!label || !label.toLowerCase().includes(q)) continue;
    const group = (el.groupIds ?? [])[0];
    const shape = el.containerId ? byId.get(el.containerId)
      : el.type === 'text' && group ? live.find((o) => o !== el && o.type !== 'text' && o.type !== 'arrow' && (o.groupIds ?? []).includes(group))
        : null;
    const target = shape ?? el;
    const b = elementBox(target);
    out.push({
      id: target.id, type: target.type, label: label.length > 120 ? `${label.slice(0, 117)}...` : label,
      text: el.id === target.id ? null : el.id,
      x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
      frame: target.frameId ?? null,
    });
  }
  return out;
}

// An unreadable file is one line and exit 2, like a usage error (#116).
function load(path) {
  try {
    return readScene(path);
  } catch (error) {
    return exitUsage(readProblem(path, error, 'scene'));
  }
}

function main(argv) {
  const { options, positionals: files } = parseCliOrExit(argv,
    { values: { '--out': null, '--find': null }, switches: ['--cells', '--images'] }, USAGE);
  if (!files.length) exitUsage('expected at least one .excalidraw file', USAGE);
  if (options.find !== undefined) {
    if (files.length > 1 || options.cells || options.images) exitUsage('--find reads one file, on its own', USAGE);
    console.log(JSON.stringify(findLabel(load(files[0]), options.find), null, 2));
    return;
  }
  if ((options.cells || options.images) && files.length > 1) exitUsage('--cells and --images read one file', USAGE);

  if (options.cells) {
    const scene = load(files[0]);
    const rows = scene.elements.filter((el) => !el.isDeleted).map((el) => {
      const b = elementBox(el);
      return {
        id: el.id.slice(0, 8),
        type: el.type,
        x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
        stroke: el.strokeColor, bg: el.backgroundColor,
        group: (el.groupIds ?? [])[0]?.slice(0, 6) ?? null,
        frame: el.frameId?.slice(0, 6) ?? null,
        container: el.containerId?.slice(0, 8) ?? null,
      };
    });
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (options.images) {
    const scene = load(files[0]);
    console.log(JSON.stringify(analyzeScene(scene, { name: basename(files[0]) }).images, null, 2));
    return;
  }

  const results = files.map((f) => {
    const scene = load(f);
    const raw = readFileSync(f);
    return {
      // The file name can itself carry a customer or project name, so only its
      // digest travels into any record derived from this.
      file: { bytes: statSync(f).size, sha256: sha256(raw) },
      ...analyzeScene(scene, { name: basename(f) }),
    };
  });

  const { out } = options;
  const payload = results.length === 1 ? results[0] : { scenes: results };
  if (out) {
    writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(JSON.stringify({ wrote: out, scenes: results.length }, null, 2));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

if (process.argv[1] && process.argv[1].endsWith('analyze-excalidraw.mjs')) main(process.argv.slice(2));
