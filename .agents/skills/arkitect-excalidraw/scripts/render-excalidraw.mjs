#!/usr/bin/env node
// Render a .excalidraw scene to SVG, or to PNG with a local Edge, Chrome or
// Chromium, so the diagram can actually be looked at without opening the app.
//
//   node render-excalidraw.mjs scene.excalidraw                          scene.svg beside it
//   node render-excalidraw.mjs scene.excalidraw --out preview.svg --style clean
//   node render-excalidraw.mjs scene.excalidraw --out preview.png --width 2200
//   node render-excalidraw.mjs scene.excalidraw --out-dir .analysis/renders   scene.png
//
// --style rough (default) reproduces the hand-drawn stroke; --style clean draws
// exact geometry, which is the better choice when the question is whether the
// layout collides. Neither is pixel-identical to Excalidraw's own export: the
// hand-drawn fonts are not installed here and fills are flat. Open the scene in
// the local container when exact appearance matters.

import { writeFileSync, statSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { readScene, elementBox, bbox, LINE_HEIGHT } from './lib/excalidraw-core.mjs';
import { locateBrowser, rasteriseSvg, workRootFor } from './lib/browser.mjs';
import { roughPath, roughRect, roughDiamond, roughEllipse, roundedRectPath, adaptiveRadius } from './lib/rough.mjs';

const FONT_STACK = {
  1: "Excalifont, Virgil, 'Segoe Print', 'Comic Sans MS', cursive",
  2: "Nunito, Helvetica, Arial, sans-serif",
  3: "'Cascadia Code', 'Comic Shanns', Consolas, 'Courier New', monospace",
  5: "Excalifont, Virgil, 'Segoe Print', 'Comic Sans MS', cursive",
  6: "Nunito, Helvetica, Arial, sans-serif",
  7: "'Lilita One', Impact, sans-serif",
  8: "'Comic Shanns', 'Comic Sans MS', cursive",
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// A scene file is user-supplied and may be hostile: anything interpolated into
// the SVG has to be checked, or a colour of `#000" onload="...` writes its own
// attribute and `#000"><script>` writes its own element. These are checked
// against a grammar rather than escaped, because an escaped nonsense colour is
// inert but still nonsense, and every field here has a sane default (#150).
const COLOUR = /^(?:#[0-9a-f]{3,8}|transparent|none|[a-z]{3,20}|(?:rgb|rgba|hsl|hsla)\([\d.,%\s/-]+\))$/i;
const colour = (value, fallback) => (COLOUR.test(String(value ?? '')) ? String(value) : fallback);
const num = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
// Excalidraw stores embedded artwork as a base64 image data URL. Anything else
// - a remote URL, a javascript: scheme, an SVG carrying script - is not drawn.
const DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml)(?:;[\w-]+=[\w-]+)*;base64,[A-Za-z0-9+/=\s]*$/;

const f = (n) => Math.round(num(n, 0) * 100) / 100;

function dashArray(el) {
  const w = strokeWidth(el);
  if (el.strokeStyle === 'dashed') return `${f(8 * w)} ${f(8 * w)}`;
  if (el.strokeStyle === 'dotted') return `${f(1.5 * w)} ${f(6 * w)}`;
  return null;
}

// Hachure and cross-hatch become SVG patterns, one per colour/style pair.
function fillRef(el, patterns) {
  const bg = colour(el.backgroundColor, 'transparent');
  if (bg === 'transparent' || bg === 'none') return 'none';
  if (el.fillStyle === 'solid' || !el.fillStyle) return bg;
  // The id is generated, never taken from the scene: a fill style or colour is
  // free to contain a quote, and this ends up in both an id and a url(#...).
  const key = `${el.fillStyle === 'cross-hatch' ? 'cross-hatch' : 'hachure'}-${bg}`;
  if (!patterns.has(key)) {
    const lines = el.fillStyle === 'cross-hatch'
      ? '<path d="M0 0 L8 8 M8 0 L0 8" />'
      : '<path d="M-2 8 L8 -2 M0 10 L10 0" />';
    const id = `fill-${patterns.size}`;
    patterns.set(key, { id, markup: `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">`
      + `<g stroke="${bg}" stroke-width="1.6" fill="none">${lines}</g></pattern>` });
  }
  return `url(#${patterns.get(key).id})`;
}

const stroke = (el) => colour(el.strokeColor, '#1e1e1e');
const strokeWidth = (el) => {
  const w = num(el.strokeWidth, 1);
  return w > 0 ? w : 1;
};

function strokeAttrs(el) {
  const dash = dashArray(el);
  return `stroke="${stroke(el)}" stroke-width="${f(strokeWidth(el))}" `
    + 'stroke-linecap="round" stroke-linejoin="round" fill="none"'
    + (dash ? ` stroke-dasharray="${dash}"` : '');
}

function arrowhead(kind, x, y, angle, el) {
  if (!kind) return '';
  const size = 12 + strokeWidth(el) * 2;
  const a1 = angle + Math.PI - 0.45;
  const a2 = angle + Math.PI + 0.45;
  const p1 = [x + size * Math.cos(a1), y + size * Math.sin(a1)];
  const p2 = [x + size * Math.cos(a2), y + size * Math.sin(a2)];
  const common = `stroke="${stroke(el)}" stroke-width="${f(strokeWidth(el))}" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === 'triangle' || kind === 'triangle_outline') {
    return `<path d="M ${f(x)} ${f(y)} L ${f(p1[0])} ${f(p1[1])} L ${f(p2[0])} ${f(p2[1])} Z" `
      + `${common} fill="${kind === 'triangle' ? stroke(el) : 'none'}" />`;
  }
  if (kind === 'dot' || kind === 'circle' || kind === 'circle_outline') {
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(size / 2.6)}" ${common} `
      + `fill="${kind === 'circle_outline' ? 'none' : stroke(el)}" />`;
  }
  if (kind === 'bar') {
    const b1 = [x + size * 0.6 * Math.cos(angle + Math.PI / 2), y + size * 0.6 * Math.sin(angle + Math.PI / 2)];
    const b2 = [x + size * 0.6 * Math.cos(angle - Math.PI / 2), y + size * 0.6 * Math.sin(angle - Math.PI / 2)];
    return `<path d="M ${f(b1[0])} ${f(b1[1])} L ${f(b2[0])} ${f(b2[1])}" ${common} fill="none" />`;
  }
  if (kind === 'diamond' || kind === 'diamond_outline') {
    const back = [x + size * Math.cos(angle + Math.PI), y + size * Math.sin(angle + Math.PI)];
    const mid = [(x + back[0]) / 2, (y + back[1]) / 2];
    const s1 = [mid[0] + (size / 2.2) * Math.cos(angle + Math.PI / 2), mid[1] + (size / 2.2) * Math.sin(angle + Math.PI / 2)];
    const s2 = [mid[0] + (size / 2.2) * Math.cos(angle - Math.PI / 2), mid[1] + (size / 2.2) * Math.sin(angle - Math.PI / 2)];
    return `<path d="M ${f(x)} ${f(y)} L ${f(s1[0])} ${f(s1[1])} L ${f(back[0])} ${f(back[1])} L ${f(s2[0])} ${f(s2[1])} Z" `
      + `${common} fill="${kind === 'diamond' ? stroke(el) : 'none'}" />`;
  }
  // default "arrow": two barbs
  return `<path d="M ${f(p1[0])} ${f(p1[1])} L ${f(x)} ${f(y)} L ${f(p2[0])} ${f(p2[1])}" ${common} fill="none" />`;
}

function renderText(el, knockout = null) {
  const family = FONT_STACK[el.fontFamily] ?? FONT_STACK[1];
  const fontSize = num(el.fontSize, 20);
  const lineHeight = fontSize * num(el.lineHeight ?? LINE_HEIGHT[el.fontFamily], 1.25);
  const lines = String(el.text ?? '').split('\n');
  const anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start';
  const x = num(el.x, 0);
  const width = num(el.width, 0);
  const ax = el.textAlign === 'center' ? x + width / 2 : el.textAlign === 'right' ? x + width : x;
  // Excalidraw positions the first baseline about 0.79 of a line-height down.
  const baseline = num(el.y, 0) + lineHeight * 0.79;
  const tspans = lines.map((l, i) =>
    `<tspan x="${f(ax)}" y="${f(baseline + i * lineHeight)}">${esc(l) || ' '}</tspan>`).join('');
  // Excalidraw clears the canvas behind a label bound to an arrow, so the text
  // is readable where it crosses the line. Without it the preview looks worse
  // than the real thing and invites a pointless layout fix.
  const bg = knockout
    ? `<rect x="${f(x - 4)}" y="${f(num(el.y, 0) - 2)}" width="${f(width + 8)}" height="${f(num(el.height, 0) + 4)}" `
      + `fill="${knockout}" stroke="none" />`
    : '';
  return `${bg}<text font-family="${family}" font-size="${f(fontSize)}" fill="${stroke(el)}" `
    + `text-anchor="${anchor}" style="white-space:pre">${tspans}</text>`;
}

function renderElement(el, scene, patterns) {
  if (el.isDeleted) return '';
  const opacity = num(el.opacity, 100) / 100;
  const seed = num(el.seed, 1);
  const roughness = num(el.roughness, 1);
  const rough = { seed, roughness, passes: el.strokeStyle === 'solid' ? 2 : 1 };
  const fill = fillRef(el, patterns);
  let body = '';

  switch (el.type) {
    case 'rectangle':
    case 'frame':
    case 'magicframe': {
      const r = el.roundness ? adaptiveRadius(el.width, el.height) : 0;
      const outline = r > 0
        ? roundedRectPath(el.x, el.y, el.width, el.height, r)
        : roughRect(el.x, el.y, el.width, el.height, rough);
      const fillPath = r > 0 ? outline : roughRect(el.x, el.y, el.width, el.height, { ...rough, roughness: 0, passes: 1 });
      body = (fill !== 'none' ? `<path d="${fillPath}" fill="${fill}" stroke="none" />` : '')
        + `<path d="${outline}" ${strokeAttrs(el)} />`;
      if (el.type === 'frame' && el.name) {
        body += `<text x="${f(el.x)}" y="${f(el.y - 8)}" font-family="${FONT_STACK[2]}" font-size="14" `
          + `fill="#868e96">${esc(el.name)}</text>`;
      }
      break;
    }
    case 'ellipse': {
      const d = roughness === 0
        ? `M ${f(el.x)} ${f(el.y + el.height / 2)} a ${f(el.width / 2)} ${f(el.height / 2)} 0 1 0 ${f(el.width)} 0 a ${f(el.width / 2)} ${f(el.height / 2)} 0 1 0 ${f(-el.width)} 0`
        : roughEllipse(el.x + el.width / 2, el.y + el.height / 2, el.width, el.height, { seed, roughness });
      body = (fill !== 'none' ? `<path d="${d}" fill="${fill}" stroke="none" />` : '')
        + `<path d="${d}" ${strokeAttrs(el)} />`;
      break;
    }
    case 'diamond': {
      const d = roughDiamond(el.x, el.y, el.width, el.height, rough);
      const flat = roughDiamond(el.x, el.y, el.width, el.height, { ...rough, roughness: 0, passes: 1 });
      body = (fill !== 'none' ? `<path d="${flat}" fill="${fill}" stroke="none" />` : '')
        + `<path d="${d}" ${strokeAttrs(el)} />`;
      break;
    }
    case 'line':
    case 'arrow': {
      const pts = (el.points ?? []).map(([px, py]) => [el.x + px, el.y + py]);
      if (pts.length < 2) break;
      const closed = el.type === 'line'
        && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1;
      const d = roughPath(pts, { ...rough, closed });
      body = (closed && fill !== 'none'
        ? `<path d="${roughPath(pts, { ...rough, roughness: 0, passes: 1, closed: true })}" fill="${fill}" stroke="none" />`
        : '')
        + `<path d="${d}" ${strokeAttrs(el)} />`;
      if (el.type === 'arrow') {
        const [ex, ey] = pts[pts.length - 1];
        const [bx, by] = pts[pts.length - 2];
        body += arrowhead(el.endArrowhead, ex, ey, Math.atan2(ey - by, ex - bx), el);
        const [sx, sy] = pts[0];
        const [nx, ny] = pts[1];
        body += arrowhead(el.startArrowhead, sx, sy, Math.atan2(sy - ny, sx - nx), el);
      }
      break;
    }
    case 'freedraw': {
      const pts = (el.points ?? []).map(([px, py]) => [el.x + px, el.y + py]);
      if (pts.length < 2) break;
      body = `<path d="${roughPath(pts, { ...rough, roughness: 0, passes: 1 })}" ${strokeAttrs(el)} />`;
      break;
    }
    case 'text': {
      const container = el.containerId ? scene.elements.find((o) => o.id === el.containerId) : null;
      body = renderText(el, container?.type === 'arrow'
        ? colour(scene.appState?.viewBackgroundColor, '#ffffff')
        : null);
      break;
    }
    case 'image': {
      const file = scene.files?.[el.fileId];
      if (file?.dataURL && DATA_IMAGE.test(String(file.dataURL))) {
        body = `<image href="${esc(file.dataURL)}" x="${f(el.x)}" y="${f(el.y)}" `
          + `width="${f(el.width)}" height="${f(el.height)}" preserveAspectRatio="xMidYMid meet" />`;
      } else {
        body = `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.width)}" height="${f(el.height)}" `
          + 'fill="none" stroke="#e03131" stroke-dasharray="4 4" />'
          + `<text x="${f(el.x + el.width / 2)}" y="${f(el.y + el.height / 2)}" text-anchor="middle" `
          + `font-size="11" fill="#e03131">${file?.dataURL ? 'unsupported image' : 'missing file'}</text>`;
      }
      break;
    }
    case 'embeddable':
    case 'iframe':
      body = `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.width)}" height="${f(el.height)}" `
        + `fill="#f1f3f5" stroke="${stroke(el)}" />`;
      break;
    default:
      return '';
  }

  const angle = num(el.angle, 0);
  const rot = angle
    ? ` transform="rotate(${f((angle * 180) / Math.PI)} ${f(num(el.x, 0) + num(el.width, 0) / 2)} ${f(num(el.y, 0) + num(el.height, 0) / 2)})"`
    : '';
  return `<g opacity="${f(opacity)}"${rot}>${body}</g>`;
}

export function sceneToSvg(scene, { padding = 40, scale = 1, style = 'rough', background = null } = {}) {
  const elements = (scene.elements ?? []).filter((el) => !el.isDeleted);
  // Excalidraw's own fonts are not installed here, so the substitute face runs
  // wider than the stored width. Inflate text boxes when sizing the viewport so
  // a caption at the edge is not sliced off; the elements themselves are
  // untouched.
  const view = bbox(elements.map((el) => (el.type === 'text'
    ? { ...el, width: (el.width ?? 0) * 1.2, height: (el.height ?? 0) * 1.1 }
    : el)));
  const width = Math.max(1, view.width + padding * 2);
  const height = Math.max(1, view.height + padding * 2);
  const patterns = new Map();

  // Frames first, then everything else in scene order, so a frame border never
  // sits on top of its own children.
  const ordered = [
    ...elements.filter((el) => el.type === 'frame' || el.type === 'magicframe'),
    ...elements.filter((el) => el.type !== 'frame' && el.type !== 'magicframe'),
  ].map((el) => (style === 'clean' ? { ...el, roughness: 0 } : el));

  const body = ordered.map((el) => renderElement(el, scene, patterns)).join('\n  ');
  const bg = colour(background ?? scene.appState?.viewBackgroundColor, '#ffffff');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${f(width * scale)}" height="${f(height * scale)}"
     viewBox="${f(view.x - padding)} ${f(view.y - padding)} ${f(width)} ${f(height)}">
  <defs>${[...patterns.values()].map((p) => p.markup).join('')}</defs>
  <rect x="${f(view.x - padding)}" y="${f(view.y - padding)}" width="${f(width)}" height="${f(height)}" fill="${bg}" />
  ${body}
</svg>
`;
}

export const RENDER_USAGE = `usage: render-excalidraw.mjs <scene.excalidraw> [--out FILE.svg|FILE.png | --out-dir DIR [--format png|svg]]
  [--style rough|clean] [--scale N] [--padding PX] [--background COLOUR] [--width PX] [--browser PATH] [--no-sandbox]
With no output flag it writes <scene>.svg beside the scene; --out-dir writes PNG unless --format svg.
A PNG needs a local Edge, Chrome or Chromium (--browser or ARKITECT_BROWSER pins one) and is --width px wide (default 2200).
--no-sandbox is opt-in, for a Linux host where Chromium cannot start its sandbox.`;

export class RenderUsageError extends Error {}

const VALUE_FLAGS = ['--out', '--out-dir', '--format', '--style', '--scale', '--padding', '--background', '--width', '--browser'];
const isDirectory = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };

// Every flag is checked before anything is drawn or written (#39). The --out
// extension decides the format; a directory belongs to --out-dir.
export function parseRenderArgs(argv) {
  const given = {};
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') return { help: true };
    if (arg === '--no-sandbox') { given.noSandbox = true; continue; }
    if (VALUE_FLAGS.includes(arg)) {
      const value = argv[++i];
      if (value === undefined || value.startsWith('--')) throw new RenderUsageError(`${arg} needs a value`);
      if (Object.hasOwn(given, arg)) throw new RenderUsageError(`${arg} given twice`);
      given[arg] = value;
      continue;
    }
    if (arg.startsWith('-') && arg.length > 1) throw new RenderUsageError(`unknown option ${arg}`);
    files.push(arg);
  }
  if (files.length !== 1) throw new RenderUsageError(files.length ? `expected one scene, got ${files.length}` : 'expected a .excalidraw scene');
  const [scene] = files;

  const numberFlag = (flag, fallback, ok, expected) => {
    const raw = given[flag];
    if (raw === undefined) return fallback;
    const n = /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : NaN;
    if (!ok(n)) throw new RenderUsageError(`${flag} expects ${expected}, got ${raw}`);
    return n;
  };
  const scale = numberFlag('--scale', 1, (n) => n > 0, 'a positive number');
  const padding = numberFlag('--padding', 40, (n) => n >= 0, 'a non-negative number');
  const width = numberFlag('--width', 2200, (n) => Number.isInteger(n) && n >= 1 && n <= 16000, 'a whole number of pixels from 1 to 16000');
  const style = given['--style'] ?? 'rough';
  if (style !== 'rough' && style !== 'clean') throw new RenderUsageError(`--style expects rough or clean, got ${style}`);
  const background = given['--background'] ?? null;
  if (background !== null && !/^[#\w(),.% -]+$/.test(background)) {
    throw new RenderUsageError(`--background expects a colour such as #ffffff or white, got ${background}`);
  }
  const format = given['--format'];
  if (format !== undefined && format !== 'png' && format !== 'svg') throw new RenderUsageError(`--format expects png or svg, got ${format}`);

  const out = given['--out'];
  const outDir = given['--out-dir'];
  if (out !== undefined && outDir !== undefined) throw new RenderUsageError('use --out FILE or --out-dir DIR, not both');
  let target;
  let kind;
  if (out !== undefined) {
    if (/[\\/]$/.test(out) || isDirectory(out)) {
      throw new RenderUsageError(`--out ${out} is a directory; use --out-dir ${out.replace(/[\\/]+$/, '')}`);
    }
    const ext = extname(out).toLowerCase();
    if (ext !== '.svg' && ext !== '.png') {
      throw new RenderUsageError(`--out must end in .svg or .png, got ${ext ? `"${ext}"` : 'no extension'}; use --out-dir DIR for a directory`);
    }
    kind = ext.slice(1);
    if (format !== undefined && format !== kind) throw new RenderUsageError(`--format ${format} contradicts --out ${out}`);
    target = out;
  } else {
    kind = format ?? (outDir !== undefined ? 'png' : 'svg');
    target = join(outDir ?? dirname(scene), `${basename(scene).replace(/\.excalidraw$/i, '')}.${kind}`);
  }
  if (kind === 'svg') {
    for (const flag of ['--width', '--browser']) {
      if (given[flag] !== undefined) throw new RenderUsageError(`${flag} only applies to PNG output`);
    }
    if (given.noSandbox) throw new RenderUsageError('--no-sandbox only applies to PNG output');
  }
  return { scene, out: target, format: kind, style, scale, padding, width, background, browser: given['--browser'], noSandbox: Boolean(given.noSandbox) };
}

// Exit 0 written, 1 when the PNG could not be made (nothing replaced), 2 on a
// usage error or an unreadable scene. The dependencies stand in for the
// browser in the tests.
export function run(argv, { log = console.log, error = console.error, platform = process.platform, env = process.env, isExecutable, runner } = {}) {
  let options;
  try {
    options = parseRenderArgs(argv);
  } catch (e) {
    if (!(e instanceof RenderUsageError)) throw e;
    error(`${e.message}\n${RENDER_USAGE}`);
    return 2;
  }
  if (options.help) { log(RENDER_USAGE); return 0; }

  let scene;
  try {
    scene = readScene(options.scene);
  } catch (e) {
    error(e.code === 'ENOENT' ? `no scene at ${options.scene}` : e instanceof SyntaxError ? `${options.scene} is not valid JSON` : e.message);
    return 2;
  }

  const svg = sceneToSvg(scene, { padding: options.padding, scale: options.scale, style: options.style, background: options.background });
  const size = /<svg\b[^>]*?\swidth="([\d.]+)"[^>]*?\sheight="([\d.]+)"/.exec(svg);
  let bytes = Buffer.from(svg);
  let dims = { width: Math.ceil(Number(size[1])), height: Math.ceil(Number(size[2])) };
  let browser = null;
  if (options.format === 'png') {
    const found = locateBrowser(options.browser, { platform, env, isExecutable });
    if (!found.path) {
      error(`cannot render a PNG: ${found.error}; ${options.out} is unchanged`);
      if (!found.source) for (const p of found.tried) error(`  tried ${p}`);
      error('Install Edge, Chrome or Chromium, point --browser or ARKITECT_BROWSER at one, or render with --format svg.');
      return 1;
    }
    try {
      const shot = rasteriseSvg(svg, {
        browser: found.path, width: options.width, noSandbox: options.noSandbox, runner,
        workRoot: workRootFor(found.path, { platform, env }),
      });
      bytes = shot.bytes;
      dims = { width: shot.width, height: shot.height };
    } catch (e) {
      // Inside another sandbox or a container the browser cannot build its own,
      // and says so; that is the diagnosed failure --no-sandbox exists for (#113).
      // A refused socket() says the same words and is not the same failure: the
      // host bars the syscall, so no flag reaches a PNG there and only SVG will
      // draw anything. Sending that one to --no-sandbox costs a wasted run and
      // then says nothing at all the second time (#136).
      const denied = /socket\(\) failed/i.test(e.message);
      const nested = !denied && /Operation not permitted|no usable sandbox|namespace|zygote/i.test(e.message);
      const hint = denied ? ' The host denies the browser a socket, so no flag gets a PNG here: render with --format svg.'
        : platform !== 'linux' || options.noSandbox ? ' Render with --format svg, which needs no browser.'
          : nested ? ' The browser could not start its own sandbox, as happens inside another sandbox or a container: retry with --no-sandbox.'
            : ' On Linux, a browser that cannot start its sandbox needs --no-sandbox.';
      error(`PNG render failed with ${found.path}: ${e.message}. ${options.out} is unchanged.${hint}`);
      return 1;
    }
    browser = { path: found.path, source: found.source };
  }

  // Only now is the previous preview replaced, and atomically: a crash part-way
  // through a write never leaves a truncated file under its name.
  mkdirSync(dirname(options.out), { recursive: true });
  const temporary = `${options.out}.${process.pid}.tmp`;
  try {
    writeFileSync(temporary, bytes);
    renameSync(temporary, options.out);
  } finally {
    rmSync(temporary, { force: true });
  }

  const live = scene.elements.filter((e) => !e.isDeleted);
  const view = bbox(live);
  log(JSON.stringify({
    wrote: options.out,
    format: options.format,
    bytes: bytes.length,
    width: dims.width,
    height: dims.height,
    ...(browser ? { browser } : {}),
    elements: live.length,
    files: Object.keys(scene.files ?? {}).length,
    canvas: `${Math.round(view.width)}x${Math.round(view.height)}`,
    // An SVG is the one output nobody looks at: it is markup, so an agent reads
    // it back as text and describes the layout from the spec it just wrote.
    // Three eval runs did exactly that, each claiming a picture it never saw, so
    // the fact goes where the SVG is handed over rather than into skill prose
    // (#136). It does not call an SVG a "geometry-faithful preview" either: two
    // runs quoted that phrase back as the warrant for judging spacing from it.
    note: options.format === 'svg'
      ? 'vector markup, not a picture you can look at: nothing here shows you the diagram, so do not report on its spacing, collisions or clarity from this file. Render a PNG to judge those, or say you could not see it. Fonts are substituted and fills are flat either way.'
      : 'geometry-faithful preview; hand-drawn fonts are substituted and fills are flat',
  }, null, 2));
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('render-excalidraw.mjs')) process.exitCode = run(process.argv.slice(2));
