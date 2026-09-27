// How an orthogonal Draw.io edge runs, estimated from its two ports and any
// waypoints. validate-drawio.mjs checks a route with this, and the builder
// plans one with it (#237), so both mean the same line. The Excalidraw builder
// finds its detours with the same search (#124).
//
// A port is { x, y, vertical }: vertical when it leaves or enters through the
// top or bottom of its box.

// Two ports with nothing between them: Draw.io's orthogonal router draws a
// straight line when they align, an L when one is vertical and the other not,
// and otherwise a Z whose middle leg sits halfway across.
export function route(p, q) {
  if (Math.abs(p.x - q.x) < 1 || Math.abs(p.y - q.y) < 1) return [[p, q]];
  if (p.vertical !== q.vertical) {
    const corner = p.vertical ? { x: p.x, y: q.y } : { x: q.x, y: p.y };
    return [[p, corner], [corner, q]];
  }
  if (p.vertical) {
    const my = (p.y + q.y) / 2;
    return [[p, { x: p.x, y: my }], [{ x: p.x, y: my }, { x: q.x, y: my }], [{ x: q.x, y: my }, q]];
  }
  const mx = (p.x + q.x) / 2;
  return [[p, { x: mx, y: p.y }], [{ x: mx, y: p.y }, { x: mx, y: q.y }], [{ x: mx, y: q.y }, q]];
}

// Through waypoints the line runs point to point, turning at each; two points
// that do not share an axis are joined by an L.
export function routeThrough(p, points, q) {
  if (!points?.length) return route(p, q);
  const all = [p, ...points, q];
  const segments = [];
  for (let i = 0; i < all.length - 1; i++) {
    const a = all[i]; const b = all[i + 1];
    if (Math.abs(a.x - b.x) < 1 || Math.abs(a.y - b.y) < 1) segments.push([a, b]);
    else {
      const corner = i === 0 && a.vertical ? { x: a.x, y: b.y } : { x: b.x, y: a.y };
      segments.push([a, corner], [corner, b]);
    }
  }
  return segments.filter(([a, b]) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.5);
}

export const crosses = ([p, q], r) => Math.max(p.x, q.x) > r.x + 1 && Math.min(p.x, q.x) < r.x + r.width - 1
  && Math.max(p.y, q.y) > r.y + 1 && Math.min(p.y, q.y) < r.y + r.height - 1;

export const lengthOf = (segments) => segments.reduce((n, [p, q]) => n + Math.abs(q.x - p.x) + Math.abs(q.y - p.y), 0);

// A point `d` along the route.
export function pointAt(segments, d) {
  let left = d;
  for (const [p, q] of segments) {
    const len = Math.abs(q.x - p.x) + Math.abs(q.y - p.y);
    if (left <= len) return { x: p.x + Math.sign(q.x - p.x) * left, y: p.y + Math.sign(q.y - p.y) * left };
    left -= len;
  }
  return segments.at(-1)[1];
}

// A caption hangs below its icon, centred, one line per `<br>`.
export function captionBox(g, lines, size) {
  const width = Math.max(...lines.map((l) => l.length)) * size * 0.55;
  return { x: g.x + g.width / 2 - width / 2, y: g.y + g.height + 2, width, height: lines.length * size * 1.25 };
}

// The middle of each free stretch between `boxes` along `axis` ('x' or 'y'),
// and one lane `margin` past either end. Found from the drawing, not the grid,
// so a node set between columns still leaves a way round it.
export function lanes(boxes, axis, margin) {
  const size = axis === 'x' ? 'width' : 'height';
  const spans = boxes.map((b) => [b[axis], b[axis] + b[size]]).sort((m, n) => m[0] - n[0]);
  if (!spans.length) return [];
  const out = [spans[0][0] - margin];
  let end = spans[0][1];
  for (const [s, e] of spans.slice(1)) {
    if (s > end + 2) out.push((end + s) / 2);
    end = Math.max(end, e);
  }
  out.push(end + margin);
  return out;
}

// Lanes between lo and hi, and the nearest one outside on each side.
export function near(values, lo, hi) {
  const v = [...new Set(values.map(Math.round))].sort((m, n) => m - n);
  const below = v.filter((x) => x < lo).at(-1);
  const above = v.find((x) => x > hi);
  return v.filter((x) => x >= lo && x <= hi).concat(below ?? [], above ?? []);
}

// Waypoints that take a route from port `ex` to port `en` round whatever
// `clear(segments)` refuses: vertical runs on the `xs` lanes, horizontal ones
// on the `ys`. Fewest points first, then the shortest. Each detour's first
// point lies out from its exit side and its last out from its entry side, so it
// never doubles back through either end. Null when no lane gets through.
export function detour(ex, en, exitSide, entrySide, clear, xs, ys) {
  const tries = [];
  if (!ex.vertical && !en.vertical) {
    for (const x of xs) tries.push([{ x, y: ex.y }, { x, y: en.y }]);
    for (const x1 of xs) for (const x2 of xs) for (const y of ys) {
      tries.push([{ x: x1, y: ex.y }, { x: x1, y }, { x: x2, y }, { x: x2, y: en.y }]);
    }
  } else if (ex.vertical && en.vertical) {
    for (const y of ys) tries.push([{ x: ex.x, y }, { x: en.x, y }]);
    for (const y1 of ys) for (const y2 of ys) for (const x of xs) {
      tries.push([{ x: ex.x, y: y1 }, { x, y: y1 }, { x, y: y2 }, { x: en.x, y: y2 }]);
    }
  }
  const outside = (pt, port, side) => (side === 'right' ? pt.x > port.x : side === 'left' ? pt.x < port.x
    : side === 'bottom' ? pt.y > port.y : pt.y < port.y);
  const best = tries
    .filter((pts) => outside(pts[0], ex, exitSide) && outside(pts.at(-1), en, entrySide))
    .map((pts) => pts.filter((pt, n) => n === 0 || pt.x !== pts[n - 1].x || pt.y !== pts[n - 1].y))
    .map((pts) => ({ pts, segs: routeThrough(ex, pts, en) }))
    .filter((t) => clear(t.segs))
    .sort((m, n) => m.pts.length - n.pts.length || lengthOf(m.segs) - lengthOf(n.segs))[0];
  return best ? best.pts.map((pt) => ({ x: Math.round(pt.x), y: Math.round(pt.y) })) : null;
}
