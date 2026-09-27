// Shared parsing helpers for .drawio files and .drawio mxlibrary palettes.
// Everything here runs locally. Nothing in this module prints diagram labels;
// callers decide what is safe to emit.

import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function fileMeta(path) {
  const buf = readFileSync(path);
  const st = statSync(path);
  return { path, bytes: st.size, mtime: st.mtime.toISOString(), sha256: sha256(buf) };
}

// ---------------------------------------------------------------- cli args

// A mistake on the command line rather than in a file. The CLIs print it with
// their usage line and exit 2.
export class UsageError extends Error {}

// Strict argument parsing shared by the Draw.io CLIs. A flag's value is taken
// with its flag, so `--page 0` is never read as a file named "0" and options may
// come before or after the files. An unknown flag, a missing value or a repeated
// value flag is refused rather than ignored. `values` maps each value flag to a
// converter that may throw a UsageError, or to null to keep the string.
// `variadic` flags take every following argument up to the next flag, which is
// how `--sources a b c` is spelled.
export function parseCli(argv, { values = {}, switches = [], variadic = [] } = {}) {
  const options = {};
  const positionals = [];
  const key = (flag) => flag.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return { help: true, options, positionals };
    if (switches.includes(arg)) { options[key(arg)] = true; continue; }
    if (variadic.includes(arg)) {
      if (Object.hasOwn(options, key(arg))) throw new UsageError(`${arg} given more than once`);
      const taken = [];
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) taken.push(argv[++i]);
      if (!taken.length) throw new UsageError(`${arg} needs at least one value`);
      options[key(arg)] = taken;
      continue;
    }
    if (Object.hasOwn(values, arg)) {
      const value = argv[++i];
      if (value === undefined || value.startsWith('--')) throw new UsageError(`${arg} needs a value`);
      if (Object.hasOwn(options, key(arg))) throw new UsageError(`${arg} given more than once`);
      options[key(arg)] = values[arg] ? values[arg](value, arg) : value;
      continue;
    }
    if (arg.startsWith('-') && arg.length > 1) throw new UsageError(`unknown option ${arg}`);
    positionals.push(arg);
  }
  return { help: false, options, positionals };
}

// A 0-based page number as typed: digits only, so "-1", "1.5", "1e3", "" and
// "abc" are refused instead of becoming NaN or a page that is never checked.
export function pageIndexArg(value, flag = '--page') {
  const n = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(n)) {
    throw new UsageError(`${flag} must be a non-negative integer, got "${value}"`);
  }
  return n;
}

export function pageRangeError(path, index, count) {
  const name = basename(path);
  return count
    ? `page ${index} is out of range: "${name}" has ${count} page${count === 1 ? '' : 's'} (0-${count - 1})`
    : `page ${index} is out of range: "${name}" has no pages`;
}

// One line, then the usage line when there is one, then exit 2.
export function exitUsage(message, usage) {
  console.error(usage ? `${message}\n${usage}` : message);
  process.exit(2);
}

// parseCli for a script's main(): --help prints the usage, a UsageError exits 2.
export function parseCliOrExit(argv, spec, usage) {
  let parsed;
  try {
    parsed = parseCli(argv, spec);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    exitUsage(error.message, usage);
  }
  if (parsed.help) { console.log(usage); process.exit(0); }
  return parsed;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function unescapeXml(s) {
  if (s.indexOf('&') === -1) return s;
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent) => {
    if (ENTITIES[ent] !== undefined) return ENTITIES[ent];
    if (ent[0] === '#') {
      const code = ent[1] === 'x' || ent[1] === 'X'
        ? parseInt(ent.slice(2), 16)
        : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return m;
  });
}

// Linear tag scanner. Attribute values routinely hold megabytes of base64,
// so this walks indexes instead of running a regex over the whole document.
function* scanTags(xml) {
  let i = 0;
  const n = xml.length;
  while (i < n) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) return;
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (xml.startsWith('<?', lt) || xml.startsWith('<!', lt)) {
      const end = xml.indexOf('>', lt);
      i = end === -1 ? n : end + 1;
      continue;
    }
    let j = lt + 1;
    let quote = null;
    while (j < n) {
      const c = xml[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '>') {
        break;
      }
      j++;
    }
    if (j >= n) return;
    const raw = xml.slice(lt, j + 1);
    const closing = raw[1] === '/';
    const selfClosing = raw.endsWith('/>');
    const nameMatch = /^<\/?\s*([\w:.-]+)/.exec(raw);
    if (nameMatch) {
      yield { name: nameMatch[1], raw, closing, selfClosing, start: lt, end: j + 1 };
    }
    i = j + 1;
  }
}

export function parseAttrs(rawTag) {
  const out = {};
  const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(rawTag)) !== null) out[m[1]] = unescapeXml(m[2]);
  return out;
}

// Builds a shallow element tree: { name, attrs, children }.
export function parseXml(xml) {
  const root = { name: '#root', attrs: {}, children: [] };
  const stack = [root];
  for (const tag of scanTags(xml)) {
    const top = stack[stack.length - 1];
    if (tag.closing) {
      if (stack.length > 1 && stack[stack.length - 1].name === tag.name) stack.pop();
      continue;
    }
    const el = { name: tag.name, attrs: parseAttrs(tag.raw), children: [] };
    top.children.push(el);
    if (!tag.selfClosing) stack.push(el);
  }
  return root;
}

export function findAll(el, name, out = []) {
  for (const c of el.children) {
    if (c.name === name) out.push(c);
    findAll(c, name, out);
  }
  return out;
}

// ---------------------------------------------------------------- mxfile

export function isCompressedPage(inner) {
  // An uncompressed page carries a literal <mxGraphModel>; a compressed one
  // is a single base64 text node.
  return inner.indexOf('<mxGraphModel') === -1 && /[A-Za-z0-9+/=]{40,}/.test(inner);
}

export function decompressPage(b64) {
  const raw = inflateRawSync(Buffer.from(b64.trim(), 'base64')).toString('binary');
  return decodeURIComponent(raw);
}

export function readMxfile(path) {
  const text = readFileSync(path, 'utf8');
  let opening = null;
  const pages = [];
  let page;
  for (const tag of scanTags(text)) {
    if (tag.name === 'mxfile' && !tag.closing && opening === null) opening = tag.raw;
    if (tag.name !== 'diagram') continue;
    if (!tag.closing) page = tag;
    if (!page || (!tag.closing && !tag.selfClosing)) continue;
    const a = parseAttrs(page.raw);
    const inner = tag.selfClosing ? '' : text.slice(page.end, tag.start);
    const compressed = isCompressedPage(inner);
    pages.push({
      raw: text.slice(page.start, tag.end),
      name: a.name ?? '',
      id: a.id ?? '',
      compressed,
      get xml() {
        return compressed ? decompressPage(inner) : inner;
      },
    });
    page = undefined;
  }
  return { path, attrs: opening ? parseAttrs(opening) : {}, opening, pages, bytes: Buffer.byteLength(text) };
}

// ---------------------------------------------------------------- cells

export function parseStyle(style) {
  const out = {};
  if (!style) return out;
  for (const part of style.split(';')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq === -1) out[part] = true;
    else out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

const BARE_SHAPES = new Set([
  'ellipse', 'rhombus', 'triangle', 'hexagon', 'cylinder', 'cloud',
  'note', 'card', 'step', 'process', 'swimlane', 'shape',
]);

export function styleShape(style) {
  const s = parseStyle(style);
  if (s.shape) return String(s.shape);
  for (const k of Object.keys(s)) {
    if (s[k] === true && (k.startsWith('mxgraph.') || BARE_SHAPES.has(k))) return k;
  }
  return null;
}

// A style signature drops the volatile bits (embedded images, connection
// points) so recurring visual conventions can be counted.
export function styleSignature(style) {
  const s = parseStyle(style);
  const keys = Object.keys(s).filter((k) => k !== 'image' && k !== 'points').sort();
  return keys.map((k) => (s[k] === true ? k : `${k}=${s[k]}`)).join(';');
}

export function extractCells(pageXml) {
  const model = parseXml(pageXml);
  const cells = [];
  const wrappers = new Map();
  for (const name of ['object', 'UserObject']) {
    for (const el of findAll(model, name)) {
      for (const c of el.children) if (c.name === 'mxCell') wrappers.set(c, el);
    }
  }
  for (const el of findAll(model, 'mxCell')) {
    const w = wrappers.get(el);
    const a = el.attrs;
    const geomEl = el.children.find((c) => c.name === 'mxGeometry');
    const g = geomEl ? geomEl.attrs : null;
    const points = geomEl
      ? findAll(geomEl, 'mxPoint').filter((p) => !p.attrs.as).map((p) => ({ x: Number(p.attrs.x ?? 0), y: Number(p.attrs.y ?? 0) }))
      : [];
    const offset = geomEl ? findAll(geomEl, 'mxPoint').find((p) => p.attrs.as === 'offset') : null;
    cells.push({
      id: w ? (w.attrs.id ?? a.id) : a.id,
      value: w ? (w.attrs.label ?? '') : (a.value ?? ''),
      style: a.style ?? '',
      parent: a.parent ?? '',
      source: a.source ?? null,
      target: a.target ?? null,
      vertex: a.vertex === '1',
      edge: a.edge === '1',
      geometry: g
        ? {
            x: g.x !== undefined ? Number(g.x) : null,
            y: g.y !== undefined ? Number(g.y) : null,
            width: g.width !== undefined ? Number(g.width) : null,
            height: g.height !== undefined ? Number(g.height) : null,
            relative: g.relative === '1',
            offset: { x: Number(offset?.attrs.x ?? 0), y: Number(offset?.attrs.y ?? 0) },
          }
        : null,
      waypoints: points.length,
      points,
      wrapped: Boolean(w),
    });
  }
  return cells;
}

export function graphModelAttrs(pageXml) {
  const m = /<mxGraphModel\b([^>]*)>/.exec(pageXml);
  return m ? parseAttrs('<mxGraphModel' + m[1] + '>') : {};
}

// ---------------------------------------------------------------- images

// draw.io writes `data:image/svg+xml,<base64>` (no `;base64` marker) as well as
// the standard `data:<mime>;base64,<payload>` form. Normalize both.
export function parseDataUri(uri) {
  if (!uri || !uri.startsWith('data:')) return null;
  const comma = uri.indexOf(',');
  if (comma === -1) return null;
  let meta = uri.slice(5, comma);
  const payload = uri.slice(comma + 1);
  let base64 = true;
  if (meta.endsWith(';base64')) meta = meta.slice(0, -7);
  else if (meta.indexOf(';') !== -1) meta = meta.split(';')[0];
  const mime = meta || 'text/plain';
  let bytes;
  try {
    if (/^[A-Za-z0-9+/=\s]+$/.test(payload.slice(0, 256))) {
      bytes = Buffer.from(payload, 'base64');
    } else {
      bytes = Buffer.from(decodeURIComponent(payload), 'utf8');
      base64 = false;
    }
  } catch {
    return null;
  }
  return { mime, base64, bytes, hash: sha256(bytes), payloadLength: payload.length };
}

// Only the root <svg> element's own attributes describe the whole mark. A regex
// over the document reads whichever width comes first, which can be a child
// <rect>, a <symbol>, or `stroke-width`, since `\b` matches after a hyphen, and
// sizes the cell to something that is not the artwork (#96).
function rootSvgAttrs(bytes) {
  // The root tag sits at the top of the file; 4 KB covers every mark we ship.
  // Where it does not, read the whole document rather than guess a size.
  let m = /<svg\b([^>]*)>/i.exec(bytes.subarray(0, 4096).toString('utf8'));
  if (!m && bytes.length > 4096) m = /<svg\b([^>]*)>/i.exec(bytes.toString('utf8'));
  return m ? m[1] : null;
}

const rootAttr = (attrs, name) => {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("[^"]*"|'[^']*')`, 'i').exec(attrs);
  return m ? m[1].slice(1, -1) : null;
};

// A length a cell can be sized from: a plain number, optionally in px. A
// percentage or an em is relative to a viewport an embedded image does not have,
// and `parseFloat` would silently read "100%" as 100.
const absoluteLength = (value) => {
  const m = /^\s*([\d.]+)\s*(?:px)?\s*$/i.exec(value ?? '');
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

// viewBox first, then the root's own width/height. An embedded SVG is rendered
// into its cell as the viewport, so the viewBox and preserveAspectRatio decide
// where the ink lands and the root width/height are ignored; fitting the cell to
// the viewBox fills it with artwork instead of letterboxing it. Same precedence
// as icon-build's viewBoxOf() and the Excalidraw reader, which re-exports this
// so both engines size the same bytes identically (#96).
export function svgDimensions(bytes) {
  const attrs = rootSvgAttrs(bytes);
  if (attrs === null) return { width: null, height: null };
  const vb = rootAttr(attrs, 'viewBox');
  if (vb) {
    const n = vb.trim().split(/[\s,]+/).map(Number);
    if (n.length === 4 && n.every(Number.isFinite) && n[2] > 0 && n[3] > 0) {
      return { width: n[2], height: n[3] };
    }
  }
  const width = absoluteLength(rootAttr(attrs, 'width'));
  const height = absoluteLength(rootAttr(attrs, 'height'));
  if (width && height) return { width, height };
  return { width: null, height: null };
}

export function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47) return { width: null, height: null };
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

export function imageDimensions(mime, bytes) {
  if (mime.includes('svg')) return svgDimensions(bytes);
  if (mime.includes('png')) return pngDimensions(bytes);
  return { width: null, height: null };
}

export const ICON_FOOTPRINT = 78; // the AWS palette's service-icon footprint; keeps packs interchangeable
export const MIN_SIDE_SHARE = 1 / 3;
export const MAX_SIDE_SHARE = 2;

// The cell a mark is drawn in: its own aspect, fitted to `size` on the longest
// side. Fitting by the longest side alone turns a wide lockup into a hairline -
// Metaflow's 6:1 wordmark came out 78x13, its text a couple of pixels tall, and
// eight more marks came out too short to read beside their square neighbours (#76).
//
// So the short side has a floor of a third of the footprint, and the long side a
// ceiling of twice it. Both are proportions of the size asked for, not fixed
// pixels, so `--size 40` is still honoured rather than inflated to a default.
//
// The two bounds meet at 6:1. Up to that the floor is reached; past it the
// ceiling wins and the mark stays a little under the floor, because growing an
// extreme lockup until its text is legible would make it wider than the diagram
// column it sits in. Of the marks that ship, seven reach the floor and two -
// Pydantic AI and Infisical, a shade wider than 6:1 - land a pixel below it.
export function fitCell(width, height, size = ICON_FOOTPRINT) {
  if (!(width > 0 && height > 0)) return { width: size, height: size };
  const longest = Math.max(width, height);
  const shortest = Math.min(width, height);
  let scale = size / longest;
  if (shortest * scale < size * MIN_SIDE_SHARE) scale = (size * MIN_SIDE_SHARE) / shortest;
  if (longest * scale > size * MAX_SIDE_SHARE) scale = (size * MAX_SIDE_SHARE) / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// ---------------------------------------------------------------- mxlibrary

// An .mxlibrary payload is a JSON array of entries:
//   { xml | data, w, h, title, aspect }
export function readLibrary(path) {
  const text = readFileSync(path, 'utf8');
  const m = /<mxlibrary[^>]*>([\s\S]*?)<\/mxlibrary>/.exec(text);
  if (!m) throw new Error(`not an mxlibrary: ${path}`);
  const entries = JSON.parse(unescapeXml(m[1].trim()));
  return entries.map((e, index) => {
    const img = e.data ? parseDataUri(e.data) : null;
    let mime = null;
    let bytes = null;
    if (img) {
      mime = img.mime;
      bytes = img.bytes;
    } else if (e.xml) {
      // Shape-XML entries carry no bitmap; hash the shape source instead.
      mime = 'application/mxgraph-shape';
      bytes = Buffer.from(e.xml, 'utf8');
    }
    const dims = mime && bytes ? imageDimensions(mime, bytes) : { width: null, height: null };
    return {
      index,
      title: e.title ?? '',
      w: e.w ?? null,
      h: e.h ?? null,
      aspect: e.aspect ?? null,
      mime,
      dataUri: e.data ?? null,
      hash: bytes ? sha256(bytes) : null,
      byteLength: bytes ? bytes.length : 0,
      intrinsic: dims,
    };
  });
}

export function normalizeTitle(title) {
  return String(title)
    .replace(/^Arch[_ -]*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(16|32|48|64)\b/g, ' ')
    .replace(/\bAmazon\b|\bAWS\b/gi, ' ')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function titleAliases(title) {
  const set = new Set();
  const norm = normalizeTitle(title);
  if (norm) set.add(norm);
  const noSpaces = norm.replace(/\s+/g, '');
  if (noSpaces) set.add(noSpaces);
  // CamelCase split, for palette titles like "AgentCoreGateway".
  const camel = String(title)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  const camelNorm = normalizeTitle(camel);
  if (camelNorm) set.add(camelNorm);
  return [...set];
}
