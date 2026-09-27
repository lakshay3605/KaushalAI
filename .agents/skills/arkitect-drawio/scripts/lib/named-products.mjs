// A plain box whose label names products with a bundled mark draws them as
// text, and the report said nothing: on a field test a box read "Sources:
// PostgreSQL, MySQL, Snowflake" while the agent reported that the sources had
// no icon (#240). Both builders run each product-like part of a plain box's
// label through their own unattended resolver and list what it would draw.
// A note is prose and is never asked; a generic word is not a product (#231).

import { onlyGenericWords } from './generic-words.mjs';

const SPLIT = /[,/+()[\]{}&;|:\n]|\s+(?:and|or)\s+/i;
const MAX_WORDS = 4;

// "Sources: PostgreSQL, MySQL" -> ["Sources", "PostgreSQL", "MySQL"]
export function labelParts(label) {
  const seen = new Set();
  return String(label ?? '').split(SPLIT)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 1 && p.split(' ').length <= MAX_WORDS && !onlyGenericWords(p))
    .filter((p) => !seen.has(p.toLowerCase()) && seen.add(p.toLowerCase()));
}

// A box that names one product, as its whole label or as a whole line of it,
// also gets `replace`, the node to paste over it: the report alone was listed
// and then ignored, and agents take what a tool hands them (#287, #231). A
// label like "Orders DB" over "(Postgres)" is the common form. The id and
// label stay, so its edges still bind and the caption reads as before.
const BOX_ONLY = new Set(['kind', 'width', 'height', 'icon']);

const lineOf = (label, text) => String(label).split('\n')
  .some((l) => l.trim().replace(/^\((.*)\)$/, '$1').trim().toLowerCase() === text.toLowerCase());

// resolveOne(text) returns the ref it would draw unattended, or null.
export function namedProducts(boxes, resolveOne) {
  const found = [];
  for (const box of boxes) {
    const named = labelParts(box.label).map((text) => ({ text, icon: resolveOne(text) })).filter((n) => n.icon);
    const kept = Object.fromEntries(Object.entries(box).filter(([k]) => !BOX_ONLY.has(k)));
    for (const { text, icon } of named) {
      const one = named.length === 1 && lineOf(box.label, text);
      found.push({ node: box.id, text, icon, ...(one ? { replace: { ...kept, kind: 'icon', icon } } : {}) });
    }
  }
  return found;
}
