// Minimal SVG reader: turns a flat vector logo into polygons that can become
// native Excalidraw `line` elements.
//
// This handles the shapes real product logos are actually built from - paths,
// rects, circles, ellipses, polygons, polylines - with `transform` and
// `viewBox` applied. It does NOT handle gradients, clip paths, masks, filters,
// stroke-to-outline conversion, `<text>`, `<use>` or embedded rasters. Those
// are exactly the cases where tracing produces something wrong, so the caller
// is expected to report what was skipped rather than ship a silent regression.

const NUM = /[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g;

function numbers(s) {
  return (String(s).match(NUM) ?? []).map(Number);
}

// ---------------------------------------------------------------- transforms

// Affine transform as [a, b, c, d, e, f]:  x' = a x + c y + e ;  y' = b x + d y + f
export const IDENTITY = [1, 0, 0, 1, 0, 0];

export function multiply(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function apply(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export function parseTransform(spec) {
  let m = IDENTITY;
  if (!spec) return m;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let match;
  while ((match = re.exec(spec)) !== null) {
    const a = numbers(match[2]);
    switch (match[1]) {
      case 'matrix': if (a.length >= 6) m = multiply(m, a.slice(0, 6)); break;
      case 'translate': m = multiply(m, [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0]); break;
      case 'scale': m = multiply(m, [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0]); break;
      case 'rotate': {
        const r = ((a[0] ?? 0) * Math.PI) / 180;
        const cos = Math.cos(r); const sin = Math.sin(r);
        const cx = a[1] ?? 0; const cy = a[2] ?? 0;
        m = multiply(m, [1, 0, 0, 1, cx, cy]);
        m = multiply(m, [cos, sin, -sin, cos, 0, 0]);
        m = multiply(m, [1, 0, 0, 1, -cx, -cy]);
        break;
      }
      case 'skewX': m = multiply(m, [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0]); break;
      case 'skewY': m = multiply(m, [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]); break;
      default: break;
    }
  }
  return m;
}

// ---------------------------------------------------------------- path data

function tokenizePath(d) {
  const out = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let m;
  while ((m = re.exec(d)) !== null) out.push({ cmd: m[1], args: numbers(m[2]) });
  return out;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

// Arc-to-cubic conversion (SVG implementation notes, F.6.5).
function arcToCubics(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [[[x1, y1], [x2, y2], [x2, y2], [x2, y2]]];
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi); const sinP = Math.sin(phi);
  const dx = (x1 - x2) / 2; const dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;
  let rxA = Math.abs(rx); let ryA = Math.abs(ry);
  const lambda = (x1p * x1p) / (rxA * rxA) + (y1p * y1p) / (ryA * ryA);
  if (lambda > 1) { const s = Math.sqrt(lambda); rxA *= s; ryA *= s; }
  const sign = largeArc === sweep ? -1 : 1;
  const num = rxA * rxA * ryA * ryA - rxA * rxA * y1p * y1p - ryA * ryA * x1p * x1p;
  const den = rxA * rxA * y1p * y1p + ryA * ryA * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rxA * y1p) / ryA;
  const cyp = (-co * ryA * x1p) / rxA;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
    let a = Math.acos(Math.min(1, Math.max(-1, dot / (len || 1))));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rxA, (y1p - cyp) / ryA);
  let dTheta = angle((x1p - cxp) / rxA, (y1p - cyp) / ryA, (-x1p - cxp) / rxA, (-y1p - cyp) / ryA);
  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  const segments = Math.ceil(Math.abs(dTheta) / (Math.PI / 2)) || 1;
  const delta = dTheta / segments;
  const alpha = (4 / 3) * Math.tan(delta / 4);
  const out = [];
  let th = theta1;
  let px = x1; let py = y1;
  for (let i = 0; i < segments; i++) {
    const th2 = th + delta;
    const pt = (t) => {
      const c = Math.cos(t); const s = Math.sin(t);
      return [cx + rxA * cosP * c - ryA * sinP * s, cy + rxA * sinP * c + ryA * cosP * s];
    };
    const d1 = (t) => {
      const c = Math.cos(t); const s = Math.sin(t);
      return [-rxA * cosP * s - ryA * sinP * c, -rxA * sinP * s + ryA * cosP * c];
    };
    const [ex, ey] = pt(th2);
    const [t1x, t1y] = d1(th);
    const [t2x, t2y] = d1(th2);
    out.push([[px, py], [px + alpha * t1x, py + alpha * t1y], [ex - alpha * t2x, ey - alpha * t2y], [ex, ey]]);
    px = ex; py = ey; th = th2;
  }
  return out;
}

// Flatten a path `d` attribute into subpaths of points.
// `steps` controls curve resolution; 12 is plenty for a 64px icon.
export function flattenPath(d, { steps = 12 } = {}) {
  const subpaths = [];
  let cur = null;
  let x = 0; let y = 0;
  let startX = 0; let startY = 0;
  let prevCubic = null;
  let prevQuad = null;

  const moveTo = (nx, ny) => {
    cur = { points: [[nx, ny]], closed: false };
    subpaths.push(cur);
    x = nx; y = ny; startX = nx; startY = ny;
  };
  const lineTo = (nx, ny) => {
    if (!cur) moveTo(x, y);
    cur.points.push([nx, ny]);
    x = nx; y = ny;
  };
  const curveTo = (c1, c2, p) => {
    if (!cur) moveTo(x, y);
    const p0 = [x, y];
    for (let i = 1; i <= steps; i++) cur.points.push(cubicPoint(p0, c1, c2, p, i / steps));
    x = p[0]; y = p[1];
  };

  for (const { cmd, args } of tokenizePath(d)) {
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ax = (v) => (rel ? x + v : v);
    const ay = (v) => (rel ? y + v : v);

    if (C === 'Z') {
      if (cur) { cur.closed = true; x = startX; y = startY; }
      prevCubic = null; prevQuad = null;
      continue;
    }
    const step = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 }[C];
    for (let i = 0; i + step <= args.length; i += step) {
      const a = args.slice(i, i + step);
      switch (C) {
        case 'M':
          if (i === 0) moveTo(ax(a[0]), ay(a[1]));
          else lineTo(ax(a[0]), ay(a[1]));
          prevCubic = null; prevQuad = null;
          break;
        case 'L': lineTo(ax(a[0]), ay(a[1])); prevCubic = null; prevQuad = null; break;
        case 'H': lineTo(ax(a[0]), y); prevCubic = null; prevQuad = null; break;
        case 'V': lineTo(x, ay(a[0])); prevCubic = null; prevQuad = null; break;
        case 'C': {
          const c1 = [ax(a[0]), ay(a[1])];
          const c2 = [ax(a[2]), ay(a[3])];
          const p = [ax(a[4]), ay(a[5])];
          curveTo(c1, c2, p); prevCubic = c2; prevQuad = null;
          break;
        }
        case 'S': {
          const c1 = prevCubic ? [2 * x - prevCubic[0], 2 * y - prevCubic[1]] : [x, y];
          const c2 = [ax(a[0]), ay(a[1])];
          const p = [ax(a[2]), ay(a[3])];
          curveTo(c1, c2, p); prevCubic = c2; prevQuad = null;
          break;
        }
        case 'Q': {
          const q = [ax(a[0]), ay(a[1])];
          const p = [ax(a[2]), ay(a[3])];
          curveTo([x + (2 / 3) * (q[0] - x), y + (2 / 3) * (q[1] - y)],
            [p[0] + (2 / 3) * (q[0] - p[0]), p[1] + (2 / 3) * (q[1] - p[1])], p);
          prevQuad = q; prevCubic = null;
          break;
        }
        case 'T': {
          const q = prevQuad ? [2 * x - prevQuad[0], 2 * y - prevQuad[1]] : [x, y];
          const p = [ax(a[0]), ay(a[1])];
          curveTo([x + (2 / 3) * (q[0] - x), y + (2 / 3) * (q[1] - y)],
            [p[0] + (2 / 3) * (q[0] - p[0]), p[1] + (2 / 3) * (q[1] - p[1])], p);
          prevQuad = q; prevCubic = null;
          break;
        }
        case 'A': {
          const p = [ax(a[5]), ay(a[6])];
          for (const seg of arcToCubics(x, y, a[0], a[1], a[2], a[3] !== 0, a[4] !== 0, p[0], p[1])) {
            curveTo(seg[1], seg[2], seg[3]);
          }
          prevCubic = null; prevQuad = null;
          break;
        }
        default: break;
      }
    }
  }
  return subpaths.filter((s) => s.points.length > 1);
}

// ---------------------------------------------------------------- svg document

function attrs(tag) {
  const out = {};
  const re = /([\w:-]+)\s*=\s*"([^"]*)"|([\w:-]+)\s*=\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(tag)) !== null) out[m[1] ?? m[3]] = (m[2] ?? m[4]).replace(/&amp;/g, '&');
  return out;
}

function styleOf(a) {
  const out = { ...a };
  if (a.style) {
    for (const decl of a.style.split(';')) {
      const [k, v] = decl.split(':').map((s) => (s ?? '').trim());
      if (k) out[k] = v;
    }
  }
  return out;
}

function ellipsePoints(cx, cy, rx, ry, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return pts;
}

// Parse an SVG into flat, transformed subpaths with their resolved paint.
// Returns { viewBox, shapes: [{ points, closed, fill, stroke, strokeWidth }], skipped: [...] }
export function parseSvg(svgText) {
  const src = String(svgText);
  const rootMatch = /<svg\b[^>]*>/i.exec(src);
  const root = rootMatch ? attrs(rootMatch[0]) : {};
  const vb = root.viewBox ? numbers(root.viewBox) : null;
  const viewBox = vb && vb.length === 4
    ? { x: vb[0], y: vb[1], width: vb[2], height: vb[3] }
    : { x: 0, y: 0, width: Number(numbers(root.width ?? '0')[0]) || 100, height: Number(numbers(root.height ?? '0')[0]) || 100 };

  const skipped = new Set();
  for (const tag of ['linearGradient', 'radialGradient', 'clipPath', 'mask', 'filter', 'text', 'use', 'image', 'pattern']) {
    if (new RegExp(`<${tag}\\b`, 'i').test(src)) skipped.add(tag);
  }

  // Group transforms: walk the tag stream keeping a transform stack.
  const shapes = [];
  let sourceIndex = 0;
  const stack = [IDENTITY];
  const inherited = [{}];
  const tagRe = /<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    const raw = m[0];
    const name = m[1].toLowerCase();
    const closing = raw.startsWith('</');
    const selfClosing = raw.endsWith('/>');

    if (closing) {
      if (name === 'g' || name === 'svg') { if (stack.length > 1) stack.pop(); if (inherited.length > 1) inherited.pop(); }
      continue;
    }

    const a = styleOf(attrs(raw));
    const local = parseTransform(a.transform);
    const ctm = multiply(stack[stack.length - 1], local);
    const paintIn = inherited[inherited.length - 1];
    const paint = {
      fill: a.fill ?? paintIn.fill,
      stroke: a.stroke ?? paintIn.stroke,
      strokeWidth: a['stroke-width'] ?? paintIn.strokeWidth,
      opacity: a.opacity ?? paintIn.opacity,
    };

    if ((name === 'g' || name === 'svg') && !selfClosing) { stack.push(ctm); inherited.push(paint); continue; }
    if (name === 'defs') { skipped.add('defs'); continue; }

    let subpaths = null;
    if (name === 'path' && a.d) subpaths = flattenPath(a.d);
    else if (name === 'rect') {
      const x = Number(a.x ?? 0); const y = Number(a.y ?? 0);
      const w = Number(a.width ?? 0); const h = Number(a.height ?? 0);
      if (w > 0 && h > 0) subpaths = [{ points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true }];
    } else if (name === 'circle') {
      const r = Number(a.r ?? 0);
      if (r > 0) subpaths = [{ points: ellipsePoints(Number(a.cx ?? 0), Number(a.cy ?? 0), r, r), closed: true }];
    } else if (name === 'ellipse') {
      const rx = Number(a.rx ?? 0); const ry = Number(a.ry ?? 0);
      if (rx > 0 && ry > 0) subpaths = [{ points: ellipsePoints(Number(a.cx ?? 0), Number(a.cy ?? 0), rx, ry), closed: true }];
    } else if (name === 'polygon' || name === 'polyline') {
      const n = numbers(a.points ?? '');
      const pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
      if (pts.length > 1) subpaths = [{ points: pts, closed: name === 'polygon' }];
    } else if (name === 'line') {
      subpaths = [{ points: [[Number(a.x1 ?? 0), Number(a.y1 ?? 0)], [Number(a.x2 ?? 0), Number(a.y2 ?? 0)]], closed: false }];
    }

    if (!subpaths) continue;
    for (const sp of subpaths) {
      shapes.push({
        // Subpaths of one element share a source index: an inner ring is a hole
        // punched in its parent, not a separate filled blob.
        source: sourceIndex,
        points: sp.points.map(([px, py]) => apply(ctm, px, py)),
        closed: sp.closed,
        fill: normalizePaint(paint.fill, '#000000'),
        stroke: normalizePaint(paint.stroke, null),
        strokeWidth: Number(paint.strokeWidth ?? 1) || 1,
        fillRule: a['fill-rule'] ?? a.fillRule ?? 'nonzero',
      });
    }
    sourceIndex++;
  }

  return { viewBox, shapes: markHoles(shapes), skipped: [...skipped] };
}

// Ray casting. Used only to decide nesting, so a point on the boundary either
// way is harmless.
export function pointInPolygon([px, py], points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  return inside;
}

// Shoelace. The sign is the ring's orientation, which is what the nonzero fill
// rule is actually about.
export function signedArea(points) {
  let a = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  }
  return a / 2;
}

// Candidate points inside a ring: the centroid, then edge midpoints nudged
// towards it. A concave ring - most logo silhouettes - does not contain its own
// centroid, so one candidate is never enough.
function interiorCandidates(points) {
  const cx = points.reduce((n, p) => n + p[0], 0) / points.length;
  const cy = points.reduce((n, p) => n + p[1], 0) / points.length;
  const out = [[cx, cy]];
  const step = Math.max(1, Math.floor(points.length / 32));
  for (let i = 1; i < points.length; i += step) {
    const mx = (points[i - 1][0] + points[i][0]) / 2;
    const my = (points[i - 1][1] + points[i][1]) / 2;
    for (const t of [0.03, 0.12, 0.35, 0.6]) out.push([mx + (cx - mx) * t, my + (cy - my) * t]);
  }
  return out.filter((p) => pointInPolygon(p, points));
}

export function interiorPoint(points) {
  return interiorCandidates(points)[0]
    ?? [points.reduce((n, p) => n + p[0], 0) / points.length,
      points.reduce((n, p) => n + p[1], 0) / points.length];
}

// An SVG fills a shape with holes by drawing the outer ring and the inner rings
// in one path element and letting the fill rule cut them out. Excalidraw has no
// fill rule, so the rule is evaluated here and each ring is marked filled or
// hole; the caller paints a hole in the canvas colour.
//
// nonzero (the SVG default): a region is filled when the winding number is not
// zero, so an inner ring wound the same way as its container stays filled and
// only an opposite ring cuts through. Counting nesting depth alone gets this
// wrong - it turns a re-added detail, like the spokes inside a wheel, into a
// white gap.
function markHoles(shapes) {
  const bySource = new Map();
  for (const s of shapes) {
    if (!bySource.has(s.source)) bySource.set(s.source, []);
    bySource.get(s.source).push(s);
  }
  for (const group of bySource.values()) {
    if (group.length < 2) { for (const s of group) { s.hole = false; s.depth = 0; } continue; }
    const rings = group.map((s) => {
      const area = signedArea(s.points);
      return { s, area, dir: area >= 0 ? 1 : -1, candidates: interiorCandidates(s.points) };
    });
    for (const r of rings) {
      // The question is whether *this* ring's own band is painted, so the probe
      // has to sit inside it and outside anything nested within it. Probing the
      // centre of a wheel would report on the hub instead of the rim.
      const smaller = rings.filter((o) => o !== r && Math.abs(o.area) < Math.abs(r.area));
      const probe = r.candidates.find((p) => !smaller.some((o) => pointInPolygon(p, o.s.points)))
        ?? r.candidates[0]
        ?? interiorPoint(r.s.points);

      let winding = 0;
      let depth = 0;
      for (const other of rings) {
        if (other.s.points.length < 3) continue;
        if (!pointInPolygon(probe, other.s.points)) continue;
        winding += other.dir;
        if (other !== r) depth++;
      }
      const filled = r.s.fillRule === 'evenodd'
        ? (depth + 1) % 2 === 1
        : winding !== 0;
      r.s.hole = !filled;
      r.s.depth = depth;
    }
  }
  return shapes;
}

// `none`, a url(#gradient) reference and `currentColor` all mean "not a plain
// colour". Gradients degrade to the fallback and the caller warns about them.
export function normalizePaint(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (v === 'none' || v === 'transparent') return null;
  if (v.startsWith('url(')) return fallback;
  if (v === 'currentcolor') return fallback;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{8}$/.test(v)) return v.slice(0, 7);
  const rgb = /^rgba?\(([^)]+)\)$/.exec(v);
  if (rgb) {
    const n = numbers(rgb[1]);
    if (n.length >= 3) {
      const hex = n.slice(0, 3).map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
      return `#${hex}`;
    }
  }
  return NAMED[v] ?? fallback;
}

const NAMED = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff',
  yellow: '#ffff00', orange: '#ffa500', purple: '#800080', grey: '#808080', gray: '#808080',
  silver: '#c0c0c0', navy: '#000080', teal: '#008080', olive: '#808000', maroon: '#800000',
  lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', magenta: '#ff00ff', fuchsia: '#ff00ff',
};

// Drop points that sit on top of each other, then cap the point count. Excalidraw
// stays responsive with modest polylines; a 400-point traced curve does not.
export function simplify(points, { tolerance = 0.35, max = 90 } = {}) {
  const out = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > tolerance) out.push(p);
  }
  if (out.length <= max) return out;
  const stride = out.length / max;
  const thinned = [];
  for (let i = 0; i < max; i++) thinned.push(out[Math.floor(i * stride)]);
  thinned.push(out[out.length - 1]);
  return thinned;
}
