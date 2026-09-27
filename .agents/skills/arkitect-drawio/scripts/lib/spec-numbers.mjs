// Numeric spec fields, checked by both engines' validateSpec before anything is
// laid out (#115). Without this a string or a missing coordinate became NaN, and
// a negative size was written into the file as given.
//
// A field left out, or set to null, takes the builder's default. A field that is
// present must be a real number the rule accepts: "3" is a string, not a 3.

const rule = (want, test) => ({ want, test });

export const FINITE = rule('a finite number', Number.isFinite);
export const POSITIVE = rule('a number greater than 0', (v) => Number.isFinite(v) && v > 0);
export const NON_NEGATIVE = rule('a number of at least 0', (v) => Number.isFinite(v) && v >= 0);
// A boundary spans at least one grid cell; less and its box turns inside out.
export const SPAN = rule('a number of at least 1', (v) => Number.isFinite(v) && v >= 1);

const show = (v) => (typeof v === 'number' ? String(v) : JSON.stringify(v) ?? String(v));

// Every field of `item` that breaks its rule, as "<field>.<key>: expected ..., got ...".
export function numberProblems(field, item, rules) {
  const problems = [];
  for (const [key, { want, test }] of Object.entries(rules)) {
    const v = item[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'number' || !test(v)) problems.push(`${field}.${key}: expected ${want}, got ${show(v)}`);
  }
  return problems;
}

// A field left out takes the builder's default because the default is what the
// spread finds; a field set to null used to overwrite that default with null,
// which is the opposite of what it is documented to mean, and drew a column
// pitch of 0 or a node of no width (#153). Both spreads take this instead.
export function defaulted(source) {
  const out = {};
  for (const [key, value] of Object.entries(source ?? {})) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

// A finite col and a finite pitch still multiply past what a double can hold,
// and what came out was pageWidth="Infinity", a non-finite coordinate, or - in
// JSON, which has no Infinity - a null where a number belongs. The grid is
// checked once against the pitch actually in force, naming the field that did
// it, before anything is drawn (#153).
export function gridProblems(spec, { colX, rowY }) {
  const problems = [];
  const at = (field, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    for (const [key, base, to] of [['col', null, colX], ['row', null, rowY],
      ['cols', 'col', colX], ['rows', 'row', rowY]]) {
      const value = item[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      const from = base === null ? 0 : (typeof item[base] === 'number' ? item[base] : 0);
      if (!Number.isFinite(to(from + value))) {
        problems.push(`${field}.${key}: ${show(value)} is past what this layout's grid can reach`);
      }
    }
  };
  for (const list of ['boundaries', 'nodes']) {
    const items = Array.isArray(spec?.[list]) ? spec[list] : [];
    items.forEach((item, i) => at(`${list}[${i}]`, item));
  }
  return problems;
}

// The last word before a file is written: no coordinate or dimension that came
// out of the layout may be non-finite, whatever produced it. Returns the ids
// that are wrong, so a caller can name them (#153).
export function nonFiniteBoxes(boxes) {
  const bad = [];
  for (const { id, ...box } of boxes) {
    const wrong = Object.entries(box)
      .filter(([, v]) => v !== undefined && !Number.isFinite(v))
      .map(([k]) => k);
    if (wrong.length) bad.push(`${id}: ${wrong.join(', ')} did not come out as a number`);
  }
  return bad;
}
