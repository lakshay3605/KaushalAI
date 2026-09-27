// Building blocks for assembling .drawio icon libraries from pinned upstreams.
//
// Everything here is dependency-free on purpose: the plugin ships with no
// node_modules, so the zip and tar readers, the SVG surgery and the mxlibrary
// writer are all implemented locally. Nothing in this module reaches the
// network except `download`, and that only for URLs named in sources.json.

import { createHash } from 'node:crypto';
import { gunzipSync, inflateRawSync, inflateSync, deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------- download

// Fetched bytes are cached by URL so a rebuild is offline and deterministic.
// The cache is gitignored: it holds upstream archives, not shipped artwork.
export async function download(url, cacheDir, { refresh = false } = {}) {
  const key = `${sha256(Buffer.from(url)).slice(0, 16)}-${url.split('/').pop().split('?')[0] || 'download'}`;
  const path = join(cacheDir, key);
  if (!refresh && existsSync(path)) {
    const buf = readFileSync(path);
    return { buf, sha256: sha256(buf), path, cached: true };
  }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
  return { buf, sha256: sha256(buf), path, cached: false };
}

// -------------------------------------------------------------------- zip

const ZIP_EOCD = 0x06054b50;
const ZIP_CDIR = 0x02014b50;
const ZIP_LOCAL = 0x04034b50;

// Minimal central-directory reader. Deflate and store only, which is all the
// vendor archives use; anything else fails loudly rather than silently.
export function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) === ZIP_EOCD) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('no end-of-central-directory record: not a zip');

  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdOffset === 0xffffffff) throw new Error('zip64 archives are not supported');

  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== ZIP_CDIR) throw new Error(`corrupt central directory at entry ${i}`);
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (!name.endsWith('/')) entries.push({ name, method, compressedSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  for (const e of entries) {
    e.read = () => {
      const q = e.localOffset;
      if (buf.readUInt32LE(q) !== ZIP_LOCAL) throw new Error(`corrupt local header for ${e.name}`);
      const start = q + 30 + buf.readUInt16LE(q + 26) + buf.readUInt16LE(q + 28);
      const raw = buf.subarray(start, start + e.compressedSize);
      if (e.method === 0) return Buffer.from(raw);
      if (e.method === 8) return inflateRawSync(raw);
      throw new Error(`unsupported zip compression method ${e.method} for ${e.name}`);
    };
  }
  return entries;
}

// -------------------------------------------------------------------- tar

// npm tarballs are gzipped ustar. One archive per package beats thousands of
// per-file CDN requests, and the whole thing hashes against dist.integrity.
export function readTgz(buf) {
  const tar = gunzipSync(buf);
  const out = [];
  let offset = 0;
  let longName = null;

  const str = (start, len) => {
    const s = tar.subarray(start, start + len);
    const nul = s.indexOf(0);
    return s.toString('utf8', 0, nul === -1 ? len : nul).trim();
  };

  while (offset + 512 <= tar.length) {
    if (tar[offset] === 0) break; // two zero blocks terminate the archive
    const size = parseInt(str(offset + 124, 12) || '0', 8) || 0;
    const type = String.fromCharCode(tar[offset + 156] || 0x30);
    const prefix = str(offset + 345, 155);
    let name = str(offset, 100);
    if (prefix) name = `${prefix}/${name}`;
    const dataStart = offset + 512;
    const data = tar.subarray(dataStart, dataStart + size);

    if (type === 'L') {
      longName = data.toString('utf8').replace(/\0+$/, '');
    } else if (type === 'x' || type === 'g') {
      const pax = /(?:^|\n)\d+ path=([^\n]+)/.exec(data.toString('utf8'));
      if (pax) longName = pax[1];
    // An old archive writes a zero byte for a regular file, which the type
    // decode above already turns into '0'.
    } else if (type === '0') {
      out.push({ name: longName ?? name, data: Buffer.from(data) });
      longName = null;
    } else {
      longName = null;
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  // npm wraps everything in a single `package/` directory.
  return out.map((e) => ({ ...e, name: e.name.replace(/^package\//, '') }));
}

// -------------------------------------------------------------------- svg

export function splitSvg(text) {
  const m = /<svg\b([^>]*)>/i.exec(text);
  if (!m) throw new Error('not an SVG document');
  const close = text.lastIndexOf('</svg>');
  return {
    attrs: m[1],
    inner: text.slice(m.index + m[0].length, close === -1 ? text.length : close),
  };
}

export const attrOf = (attrs, name) => {
  const m = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs);
  return m ? m[1] : null;
};

export function viewBoxOf(svgText) {
  const { attrs } = splitSvg(svgText);
  const vb = attrOf(attrs, 'viewBox');
  if (vb) {
    const n = vb.trim().split(/[\s,]+/).map(Number);
    if (n.length === 4 && n.every(Number.isFinite)) return n;
  }
  const w = parseFloat(attrOf(attrs, 'width') ?? '');
  const h = parseFloat(attrOf(attrs, 'height') ?? '');
  if (Number.isFinite(w) && Number.isFinite(h)) return [0, 0, w, h];
  return [0, 0, 24, 24];
}

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * srgb(((n >> 16) & 255) / 255)
    + 0.7152 * srgb(((n >> 8) & 255) / 255)
    + 0.0722 * srgb((n & 255) / 255);
}

// Keeps the brand hue but drops it to a weight that reads on white paper.
export function darken(hex, factor) {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((c) => Math.max(0, Math.min(255, Math.round(c * factor))));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg"';

// Normalises only the canvas size of third-party artwork. The root is rebuilt
// for that, but every namespace it declares comes along: gRPC and Memcached
// paint through xlink:href, and an undeclared prefix makes the whole SVG
// unparseable - it never renders (#29).
export function sizedSvg(svgText, { size = 64, fill = null } = {}) {
  const { attrs, inner } = splitSvg(svgText);
  const [x, y, w, h] = viewBoxOf(svgText);
  const namespaces = [...attrs.matchAll(/\sxmlns:[\w.-]+\s*=\s*"[^"]*"/g)].map((m) => m[0]).join('');
  return `${SVG_OPEN}${namespaces} width="${size}" height="${size}" viewBox="${x} ${y} ${w} ${h}"`
    + `${fill ? ` fill="${fill}"` : ''}>${inner}</svg>`;
}

// Paint that an inherited root fill would not override, or would change the
// meaning of: an explicit fill or stroke, a colour or style, currentColor, or a
// paint server, image, mask or filter.
const OWN_PAINT = /\s(?:fill|stroke|color|style)\s*=|currentColor|<(?:style|linearGradient|radialGradient|pattern|image|mask|filter)\b/i;

// A mark published with no paint of its own - devicon's gRPC `plain` variant is
// one path with no fill, which a browser draws black - filled with its brand
// colour through the root, the way Simple Icons marks are (#31). Unlike
// paintMark it keeps every namespace and the original viewBox. Artwork that
// already carries paint is refused rather than guessed at, because an inherited
// fill would leave that paint as it was and still report the mark as tinted.
export function tintUnpaintedMark(svgText, hex, { size = 64 } = {}) {
  if (!/^[0-9A-Fa-f]{6}$/.test(hex ?? '')) throw new Error(`a tint needs a six-digit hex colour, got "${hex}"`);
  const { attrs, inner } = splitSvg(svgText);
  const own = OWN_PAINT.exec(attrs) ?? OWN_PAINT.exec(inner);
  if (own) throw new Error(`cannot tint artwork that already carries paint (${own[0].trim()})`);
  return { svg: sizedSvg(svgText, { size, fill: `#${hex}` }), render: 'tinted' };
}

// A monochrome mark (Simple Icons) painted in its own brand colour. Bright
// marks - JavaScript yellow, DuckDB yellow - would wash out on a white canvas,
// so those get the treatment their owners use themselves: the brand colour as
// a filled tile with the glyph knocked out of it.
export function paintMark(svgText, hex, { size = 64, tileThreshold = 0.7 } = {}) {
  const { inner } = splitSvg(svgText);
  const [x, y, w, h] = viewBoxOf(svgText);
  const bright = luminance(hex) > tileThreshold;
  if (!bright) {
    return {
      svg: `${SVG_OPEN} width="${size}" height="${size}" viewBox="${x} ${y} ${w} ${h}" fill="#${hex}">${inner}</svg>`,
      render: 'tinted',
    };
  }
  const pad = size * 0.17;
  const box = size - pad * 2;
  const scale = box / Math.max(w, h);
  const tx = pad - x * scale + (box - w * scale) / 2;
  const ty = pad - y * scale + (box - h * scale) / 2;
  return {
    svg: `${SVG_OPEN} width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
      + `<rect width="${size}" height="${size}" rx="${(size * 0.17).toFixed(1)}" fill="#${hex}"/>`
      + `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" fill="#1B1F23">${inner}</g></svg>`,
    render: 'tile-bright',
  };
}

const DRAWN = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath', 'use']);
const NEAR_WHITE = 240;

function rgbOf(value) {
  const v = value.toLowerCase();
  if (v === 'white') return [255, 255, 255];
  let m = /^#([0-9a-f]{3})[0-9a-f]?$/.exec(v);
  if (m) return [...m[1]].map((h) => parseInt(h + h, 16));
  m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(v);
  if (m) return m[1].match(/../g).map((h) => parseInt(h, 16));
  m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/.exec(v);
  return m ? m.slice(1, 4).map((c) => (c.endsWith('%') ? parseFloat(c) * 2.55 : parseFloat(c))) : null;
}

// A style declaration wins over the presentation attribute, as in a browser.
function paintOf(attrs, name) {
  const style = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(attrs);
  const css = style && new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, 'i').exec(style[1] ?? style[2]);
  if (css) return css[1].replace(/!important/i, '').trim();
  return new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attrs)?.slice(1).find((v) => v !== undefined)?.trim() ?? null;
}

// Every colour a mark paints with: fills and strokes as each drawn element
// inherits them (an element with no fill anywhere above it draws black),
// gradient stops, and whatever a <style> sheet declares. Clip paths and masks
// draw nothing themselves, a gradient reference is counted through its stops,
// and an embedded image or currentColor stays in the list as a colour that is
// not white.
function paintsOf(svgText) {
  const found = [];
  for (const m of svgText.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const d of m[1].matchAll(/(?:^|[;{\s])(?:fill|stroke|stop-color)\s*:\s*([^;}]+)/gi)) found.push(d[1].trim());
  }
  const markup = svgText.replace(/<!--[\s\S]*?-->/g, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const stack = [{ fill: 'black', stroke: 'none', hidden: false }];
  for (const [, closing, qname, attrs, selfClosing] of markup.matchAll(/<(\/?)([\w:.-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    if (closing) { if (stack.length > 1) stack.pop(); continue; }
    const name = qname.split(':').pop();
    const parent = stack[stack.length - 1];
    const own = { hidden: parent.hidden || name === 'clipPath' || name === 'mask' };
    for (const key of ['fill', 'stroke']) {
      const value = paintOf(attrs, key);
      own[key] = value && !/^inherit$/i.test(value) ? value : parent[key];
    }
    if (!own.hidden) {
      if (name === 'stop') found.push(paintOf(attrs, 'stop-color') ?? 'black');
      else if (name === 'image') found.push('image');
      else if (DRAWN.has(name)) {
        if (name !== 'line') found.push(own.fill);
        found.push(own.stroke);
      }
    }
    if (!selfClosing) stack.push(own);
  }
  return found.filter((p) => !/^(none|transparent)$|^url\(/i.test(p));
}

// True when every colour a mark paints with is white or nearly so: artwork
// made for a dark background, which draws nothing on a light canvas (#85).
export function paintsOnlyWhite(svgText) {
  const paints = paintsOf(svgText);
  return paints.length > 0 && paints.every((p) => rgbOf(p)?.every((c) => c >= NEAR_WHITE));
}

// A concept glyph on a solid rounded tile, so `agents/memory` carries the same
// visual weight in a diagram as an AWS service icon.
export function conceptTile(glyphSvg, { tileColour, glyphColour = '#FFFFFF', style = 'stroke', size = 64 }) {
  const { inner } = splitSvg(glyphSvg);
  const [x, y, w, h] = viewBoxOf(glyphSvg);
  const pad = size * 0.21;
  const box = size - pad * 2;
  const scale = box / Math.max(w, h);
  const tx = pad - x * scale + (box - w * scale) / 2;
  const ty = pad - y * scale + (box - h * scale) / 2;
  // Lucide strokes are authored at 2px in a 24px box; scaling the group scales
  // the stroke with it, so the pre-scale width is solved back from the target.
  const paint = style === 'stroke'
    ? `fill="none" stroke="${glyphColour}" stroke-width="${(2.6 / scale).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${glyphColour}" stroke="none"`;
  return `${SVG_OPEN} width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
    + `<rect width="${size}" height="${size}" rx="${(size * 0.17).toFixed(1)}" fill="${tileColour}"/>`
    + `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" ${paint}>${inner}</g></svg>`;
}

const xmlText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The band text is sized to fit its 35px of usable width (~0.62em per bold
// capital), capped at 9px. Below 8px a long extension turns into a smear at
// diagram zoom (#14), so the manifest gives it a shorter `band` label instead;
// the slug, title and aliases keep the full extension.
export const MIN_BAND_FONT = 8;
export const bandFontSize = (label) => Math.min(9, 35 / (0.62 * label.length));

// A page with a folded corner, the tool's own mark, and the extension on a
// coloured band - so `file-types/python` never reads as `languages-runtimes/python`.
export function fileSheet(glyphSvg, { ext, band, colour, style = 'fill', size = 64 }) {
  const { inner } = splitSvg(glyphSvg);
  const [x, y, w, h] = viewBoxOf(glyphSvg);
  const box = 22;
  const scale = box / Math.max(w, h);
  const tx = 32.5 - (w * scale) / 2 - x * scale;
  const ty = 26 - (h * scale) / 2 - y * scale;

  // A bright brand colour is fine as a band but vanishes as a glyph on white.
  const glyphColour = luminance(colour) > 0.62 ? darken(colour, 0.62) : colour;
  const paint = style === 'stroke'
    ? `fill="none" stroke="${glyphColour}" stroke-width="${(2.4 / scale).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${glyphColour}" stroke="none"`;

  if (band !== undefined && !String(band).trim()) throw new Error(`file sheet "${ext}": "band" is empty`);
  const label = String(band ?? ext).toUpperCase();
  const fontSize = bandFontSize(label);
  if (fontSize < MIN_BAND_FONT) {
    throw new Error(`file sheet "${ext}": band text "${label}" would render at ${fontSize.toFixed(2)}px, `
      + `under ${MIN_BAND_FONT}px - give it a shorter "band" in sources.json`);
  }

  return `${SVG_OPEN} width="${size}" height="${size}" viewBox="0 0 64 64">`
    + '<path d="M13 3h26.5L52 15.5V57a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" '
    + 'fill="#FFFFFF" stroke="#C3CBD4" stroke-width="1.6" stroke-linejoin="round"/>'
    + '<path d="M39.5 3L52 15.5H42.5a3 3 0 0 1-3-3z" fill="#E3E9EF" stroke="#C3CBD4" '
    + 'stroke-width="1.6" stroke-linejoin="round"/>'
    + `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" ${paint}>${inner}</g>`
    + `<rect x="13" y="42.5" width="39" height="13" rx="2.5" fill="${colour}"/>`
    + `<text x="32.5" y="${(42.5 + 6.5 + fontSize * 0.36).toFixed(2)}" text-anchor="middle" `
    + 'font-family="Segoe UI, Helvetica, Arial, sans-serif" font-weight="700" '
    + `font-size="${fontSize.toFixed(2)}" fill="#FFFFFF">${xmlText(label)}</text></svg>`;
}

// ------------------------------------------------------------- mxlibrary

export const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

// draw.io reads an .mxlibrary as a JSON array inside one XML element, so the
// JSON is written first and only the three XML-significant characters escaped.
export function writeLibrary(path, entries) {
  const payload = entries.map((e) => ({
    data: e.data,
    w: e.w ?? 78,
    h: e.h ?? 78,
    title: e.title,
    ...(e.aspect ? { aspect: e.aspect } : {}),
  }));
  const json = JSON.stringify(payload)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `<mxlibrary>${json}</mxlibrary>`);
  return sha256(readFileSync(path));
}

// ----------------------------------------------------------------- titles

const SMALL_WORDS = new Set(['a', 'and', 'as', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

const TOKEN_CASE = new Map(Object.entries({
  ai: 'AI', api: 'API', apis: 'APIs', automl: 'AutoML', bigquery: 'BigQuery', cdn: 'CDN',
  ci: 'CI', cx: 'CX', db: 'DB', dns: 'DNS', ekm: 'EKM', gce: 'GCE', gke: 'GKE', gpu: 'GPU',
  hpc: 'HPC', hsm: 'HSM', ids: 'IDS', iot: 'IoT', ip: 'IP', kuberun: 'KubeRun', llm: 'LLM',
  mcp: 'MCP', ml: 'ML', nat: 'NAT', nlp: 'NLP', os: 'OS', powershell: 'PowerShell',
  prem: 'Prem', pubsub: 'Pub/Sub', qna: 'QnA', rag: 'RAG', sdk: 'SDK', sql: 'SQL',
  sso: 'SSO', ssd: 'SSD', ssl: 'SSL', tls: 'TLS', tpu: 'TPU',
  vertexai: 'Vertex AI', vm: 'VM', vmware: 'VMware', vpc: 'VPC', vpn: 'VPN',
}));

// Turns an upstream file or directory name into something a human would type.
export function prettyTitle(raw) {
  const words = String(raw).replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  return words.map((word, i) => word.split('-').map((part, j) => {
    const lower = part.toLowerCase();
    if (TOKEN_CASE.has(lower)) return TOKEN_CASE.get(lower);
    if ((i > 0 || j > 0) && SMALL_WORDS.has(lower)) return lower;
    if (/^\(/.test(part)) return `(${part.slice(1).charAt(0).toUpperCase()}${part.slice(2)}`;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(' ')).join(' ').replace(/\s+/g, ' ').trim();
}

export const slugify = (s) => String(s).toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const normalise = (s) => String(s).toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

// Cloud vendors name services in the plural - "Data Factories", "Key Vaults",
// "Event Hubs" - and nobody types it that way. Both forms become aliases.
const singular = (w) => {
  // Short words are acronyms far more often than plurals: DNS is not "DN"s.
  if (w.length < 5) return null;
  if (/[^aeiou]ies$/.test(w)) return `${w.slice(0, -3)}y`;
  if (/(ss|ch|sh|x|z)es$/.test(w)) return w.slice(0, -2);
  if (/[^s]s$/.test(w)) return w.slice(0, -1);
  return null;
};

export function withPlurals(aliases) {
  const out = new Set(aliases);
  for (const a of aliases) {
    // "...64" is a leftover palette size suffix; "...64s" helps nobody.
    if (!a || /\d$/.test(a)) continue;
    const words = a.split(' ');
    const last = words[words.length - 1];
    const one = singular(last);
    const variants = [];
    if (one) variants.push([...words.slice(0, -1), one].join(' '));
    else if (!/s$/.test(last)) variants.push([...words.slice(0, -1), `${last}s`].join(' '));
    for (const v of variants) { out.add(v); out.add(v.replace(/ /g, '')); }
  }
  return [...out].filter(Boolean);
}

// Nobody searches for "Apache Kafka" or "Microsoft SQL Server" in full. The
// bare product name is added as an alias wherever a title leads with the
// foundation or vendor that owns it.
const VENDOR_PREFIX = /^(Apache|Google|Microsoft|Amazon|AWS|Oracle|Eclipse|GNU|Red Hat|The|Adobe|IBM|Cloudera|Elastic) /i;

export function withShortName(aliases, title) {
  if (!title || !VENDOR_PREFIX.test(title)) return aliases;
  const short = title.replace(VENDOR_PREFIX, '').trim();
  // "Apache" alone, or a one-word remainder that is itself the vendor, is noise.
  if (short.length < 2) return aliases;
  return [...new Set([...aliases, ...aliasSet(short)])];
}

// Search aliases: the readable form, the squashed form, and the raw slug.
export function aliasSet(...values) {
  const out = new Set();
  for (const v of values) {
    if (!v) continue;
    const n = normalise(v);
    if (n) { out.add(n); out.add(n.replace(/ /g, '')); }
  }
  return [...out].filter(Boolean);
}

// -------------------------------------------------------------------- png

// Just enough PNG for one job: shrinking a vendor raster to the size it is drawn
// at. 8-bit, non-interlaced greyscale or RGB, with or without alpha. Palettes
// and 16-bit images fail loudly rather than decoding wrong.
const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const PNG_CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };
const PNG_COLOUR = { 1: 0, 3: 2, 2: 4, 4: 6 };

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

export function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

export function pngSize(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('not a PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function decodePng(buf) {
  pngSize(buf);
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), depth: data[8], colour: data[9], interlace: data[12] };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const channels = PNG_CHANNELS[header?.colour];
  if (!header || header.depth !== 8 || header.interlace !== 0 || !channels) {
    throw new Error(`unsupported PNG layout ${JSON.stringify(header)}`);
  }
  const { width, height } = header;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const up = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? row[x - channels] : 0;
      const above = up ? up[x] : 0;
      const corner = up && x >= channels ? up[x - channels] : 0;
      row[x] = (line[x] + predict(filter, left, above, corner)) & 0xff;
    }
  }
  return { width, height, channels, pixels };
}

function predict(filter, left, above, corner) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return above;
  if (filter === 3) return (left + above) >> 1;
  if (filter === 4) {
    const p = left + above - corner;
    const pa = Math.abs(p - left); const pb = Math.abs(p - above); const pc = Math.abs(p - corner);
    return pa <= pb && pa <= pc ? left : pb <= pc ? above : corner;
  }
  throw new Error(`invalid PNG row filter ${filter}`);
}

// Each row gets whichever of the five filters leaves the smallest residuals -
// the heuristic libpng uses - before one deflate pass at maximum compression.
export function encodePng({ width, height, channels, pixels }) {
  const colour = PNG_COLOUR[channels];
  if (colour === undefined) throw new Error(`cannot encode ${channels} channels`);
  const stride = width * channels;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const up = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    let best = null;
    let bestCost = Infinity;
    for (let filter = 0; filter <= 4; filter++) {
      const line = Buffer.alloc(stride + 1);
      line[0] = filter;
      let cost = 0;
      for (let x = 0; x < stride; x++) {
        const left = x >= channels ? row[x - channels] : 0;
        const above = up ? up[x] : 0;
        const corner = up && x >= channels ? up[x - channels] : 0;
        const v = (row[x] - predict(filter, left, above, corner)) & 0xff;
        line[x + 1] = v;
        cost += v < 128 ? v : 256 - v;
      }
      if (cost < bestCost) { bestCost = cost; best = line; }
    }
    rows.push(best);
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'latin1');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = colour;
  return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Area-average resampling: every output pixel is the coverage-weighted mean of
// the source pixels under it, so a proportional shrink neither crops, distorts
// nor aliases. Colour is averaged by alpha so a transparent edge cannot darken.
// Never enlarges - a raster already at or below `max` comes back untouched.
export function downscalePng(buf, max) {
  const src = decodePng(buf);
  const scale = max / Math.max(src.width, src.height);
  if (scale >= 1) return buf;
  const width = Math.max(1, Math.round(src.width * scale));
  const height = Math.max(1, Math.round(src.height * scale));
  const { channels } = src;
  const hasAlpha = channels === 2 || channels === 4;
  const colourChannels = hasAlpha ? channels - 1 : channels;
  const out = Buffer.alloc(width * height * channels);
  const fx = src.width / width;
  const fy = src.height / height;
  const acc = new Float64Array(colourChannels);
  for (let y = 0; y < height; y++) {
    const y0 = y * fy; const y1 = y0 + fy;
    for (let x = 0; x < width; x++) {
      const x0 = x * fx; const x1 = x0 + fx;
      acc.fill(0);
      let area = 0; let opacity = 0;
      for (let sy = Math.floor(y0); sy < Math.min(src.height, Math.ceil(y1)); sy++) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        if (wy <= 0) continue;
        for (let sx = Math.floor(x0); sx < Math.min(src.width, Math.ceil(x1)); sx++) {
          const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);
          if (wx <= 0) continue;
          const weight = wx * wy;
          const i = (sy * src.width + sx) * channels;
          const a = hasAlpha ? src.pixels[i + channels - 1] / 255 : 1;
          for (let c = 0; c < colourChannels; c++) acc[c] += src.pixels[i + c] * a * weight;
          opacity += a * weight;
          area += weight;
        }
      }
      const o = (y * width + x) * channels;
      for (let c = 0; c < colourChannels; c++) out[o + c] = opacity ? Math.min(255, Math.round(acc[c] / opacity)) : 0;
      if (hasAlpha) out[o + channels - 1] = Math.round((opacity / area) * 255);
    }
  }
  return encodePng({ width, height, channels, pixels: out });
}
