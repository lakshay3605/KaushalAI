// Hand-drawn stroke generator for the local SVG preview.
//
// Excalidraw draws through Rough.js, so a preview drawn with straight lines
// looks nothing like the real canvas. This reimplements Rough.js's line
// algorithm - the same seeded LCG, the same displacement maths - so the preview
// carries the right character.
//
// It is an approximation, not a reimplementation of the whole renderer: fills
// are flat rather than hachured by default, and arrowheads and bound-text
// layout are this file's own. The scene in the Excalidraw container is always
// the ground truth; this exists so layout can be judged without opening it.

// Rough.js's PRNG, verbatim: a Lehmer generator over the seed carried by every
// Excalidraw element, which is why a redraw of the same scene is stable.
export class Rand {
  constructor(seed) { this.seed = seed | 0; }
  next() {
    if (this.seed) {
      this.seed = Math.imul(48271, this.seed);
      return ((2 ** 31 - 1) & this.seed) / 2 ** 31;
    }
    return Math.random();
  }
}

const DEFAULTS = { maxRandomnessOffset: 2, roughness: 1, bowing: 1, curveStepCount: 9 };

function offset(min, max, o, rand, gain = 1) {
  return o.roughness * gain * (rand.next() * (max - min) + min);
}

function offsetOpt(x, o, rand, gain = 1) {
  return offset(-x, x, o, rand, gain);
}

// Rough.js `_line`: two cubic control points displaced from the ideal line,
// with the displacement shrinking as the line gets longer.
function roughSegment(x1, y1, x2, y2, o, rand, move) {
  const lengthSq = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  const length = Math.sqrt(lengthSq);
  let gain = 1;
  if (length > 500) gain = 0.4;
  else if (length > 200) gain = -0.0016668 * length + 1.233334;

  let off = o.maxRandomnessOffset;
  if (off * off * 100 > lengthSq) off = length / 10;
  const half = off / 2;
  const diverge = 0.2 + rand.next() * 0.2;

  let midX = (o.bowing * o.maxRandomnessOffset * (y2 - y1)) / 200;
  let midY = (o.bowing * o.maxRandomnessOffset * (x1 - x2)) / 200;
  midX = offsetOpt(midX, o, rand, gain);
  midY = offsetOpt(midY, o, rand, gain);

  const r = () => offset(-off, off, o, rand, gain);
  const rh = () => offset(-half, half, o, rand, gain);

  const start = move ? [x1 + rh(), y1 + rh()] : null;
  const c1 = [midX + x1 + (x2 - x1) * diverge + r(), midY + y1 + (y2 - y1) * diverge + r()];
  const c2 = [midX + x1 + 2 * (x2 - x1) * diverge + r(), midY + y1 + 2 * (y2 - y1) * diverge + r()];
  const end = [x2 + r(), y2 + r()];
  return { start, c1, c2, end };
}

const f = (n) => Math.round(n * 100) / 100;

// One rough polyline as an SVG path `d`. `passes` is 2 for the doubled stroke
// Excalidraw uses on solid lines and 1 for dashed/dotted ones.
export function roughPath(points, { seed = 1, roughness = 1, bowing = 1, passes = 2, closed = false } = {}) {
  if (points.length < 2) return '';
  const o = { ...DEFAULTS, roughness, bowing };
  const pts = closed && (points[0][0] !== points[points.length - 1][0] || points[0][1] !== points[points.length - 1][1])
    ? [...points, points[0]]
    : points;

  if (roughness === 0) {
    return `M ${f(pts[0][0])} ${f(pts[0][1])} ` + pts.slice(1).map((p) => `L ${f(p[0])} ${f(p[1])}`).join(' ');
  }

  const rand = new Rand(seed || 1);
  const chunks = [];
  for (let pass = 0; pass < passes; pass++) {
    let d = '';
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      const s = roughSegment(x1, y1, x2, y2, o, rand, i === 1);
      if (s.start) d += `M ${f(s.start[0])} ${f(s.start[1])} `;
      d += `C ${f(s.c1[0])} ${f(s.c1[1])}, ${f(s.c2[0])} ${f(s.c2[1])}, ${f(s.end[0])} ${f(s.end[1])} `;
    }
    chunks.push(d.trim());
  }
  return chunks.join(' ');
}

export function roughRect(x, y, w, h, opts) {
  return roughPath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...opts, closed: true });
}

export function roughDiamond(x, y, w, h, opts) {
  return roughPath([[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]], { ...opts, closed: true });
}

// Rough ellipses in Rough.js are built from a perturbed point ring drawn as a
// closed curve. Sampling the ring and running it through roughPath gets close
// enough for a preview and keeps one code path.
export function roughEllipse(cx, cy, w, h, opts = {}) {
  const steps = 24;
  const rand = new Rand((opts.seed || 1) ^ 0x5f3759df);
  const jitter = (opts.roughness ?? 1) * 1.2;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([
      cx + (w / 2) * Math.cos(t) + (rand.next() - 0.5) * jitter,
      cy + (h / 2) * Math.sin(t) + (rand.next() - 0.5) * jitter,
    ]);
  }
  return smoothClosed(pts);
}

// Catmull-Rom through the ring, emitted as cubic segments.
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, `
      + `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, `
      + `${f(p2[0])} ${f(p2[1])} `;
  }
  return `${d}Z`;
}

// Rounded-rectangle outline for Excalidraw's `roundness` edges.
export function roundedRectPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M ${f(x + rr)} ${f(y)} H ${f(x + w - rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + w)} ${f(y + rr)} `
    + `V ${f(y + h - rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + w - rr)} ${f(y + h)} `
    + `H ${f(x + rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x)} ${f(y + h - rr)} `
    + `V ${f(y + rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + rr)} ${f(y)} Z`;
}

// Excalidraw's adaptive radius: a proportion of the shorter side, capped.
export function adaptiveRadius(w, h) {
  const min = Math.min(w, h);
  return min <= 96 ? min * 0.25 : 32;
}
