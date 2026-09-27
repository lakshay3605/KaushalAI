#!/usr/bin/env node
// What your own diagrams say about the Draw.io house style, kept as a list the
// apply step can act on (#89).
//
//   node style-findings.mjs --derive [--record <source-analysis.json>]
//   node style-findings.mjs --add <target> --observed <value> --evidence <n> --confidence high|medium|low [--note <text>]
//   node style-findings.mjs --remove <target>
//   node style-findings.mjs --list
//
// The list is <ARKITECT_HOME>/drawio/findings.json, beside the record
// learn-drawio-style builds there. One entry per target, of two kinds:
//
//   basis "record"  computed by --derive from the record's tallies. Only what a
//                   tally settles without guessing is derived: body and heading
//                   font size, text colour and corner rounding.
//   basis "agent"   a judgement made looking at the diagrams - what a legend says
//                   a dashed line means, say - recorded with --add. It holds its
//                   target against --derive until it is removed.
//
// A target is `tokens.<name>`, `edgeKinds.<kind>.<field>` for a shipped kind, or
// `edgeKinds.<kind>` for a whole new kind. Every target and value is checked
// against the override rules, so apply-style.mjs is never offered something a
// build would ignore. Nothing here changes what a build draws. Only
// deriveFindings() is Draw.io's own; the list and the CLI are shared with
// Excalidraw, in lib/style-workflow.mjs.

import { LAYER } from './lib/style-tokens.mjs';
import { findingsTools, derivedFinding } from './lib/style-workflow.mjs';

// The grading build-knowledge.mjs gives a convention.
const level = (n, share) => (n >= 40 && share >= 0.7 ? 'high' : n >= 15 && share >= 0.5 ? 'medium' : 'low');

// The record-based findings. Tallies are ranked most common first; a share is
// taken over the tally as recorded.
export function deriveFindings(record) {
  const tokens = record?.tokens ?? {};
  const derived = [];
  const skipped = [];
  const sum = (list) => list.reduce((n, e) => n + e.count, 0);
  const consider = (target, observed, n, share) => {
    const r = derivedFinding(LAYER, { target, observed, evidence: n, share, confidence: level(n, share) });
    if (r.skipped) skipped.push(r.skipped);
    else derived.push(r.finding);
  };

  const sizes = (tokens.fontSize ?? []).map((e) => ({ value: Number(e.value), count: e.count })).filter((e) => Number.isInteger(e.value));
  const sizeTotal = record?.conventions?.find((c) => c.id === 'type-scale')?.evidence?.total ?? sum(sizes);
  if (sizes.length) {
    const [body] = sizes;
    consider('tokens.fontBody', body.value, body.count, sizeTotal ? body.count / sizeTotal : 0);
    // A heading is weighed against the sizes that are not body text, or it could
    // never outweigh the captions it sits above.
    const heading = sizes.find((e) => e.value > body.value);
    if (heading) consider('tokens.fontHeading', heading.value, heading.count, heading.count / Math.max(1, sizeTotal - body.count));
    else skipped.push({ target: 'tokens.fontHeading', reason: 'the record has no font size larger than the body size' });
  } else {
    skipped.push({ target: 'tokens.fontBody', reason: 'the record has no font size tally' },
      { target: 'tokens.fontHeading', reason: 'the record has no font size tally' });
  }

  // White is text on a filled shape, and the rest say nothing about a colour.
  const notText = new Set(['#ffffff', 'none', 'default', 'inherit']);
  const colours = (tokens.fontColor ?? []).filter((e) => !notText.has(String(e.value).toLowerCase()));
  if (colours.length) consider('tokens.text', colours[0].value, colours[0].count, colours[0].count / sum(colours));
  else skipped.push({ target: 'tokens.text', reason: 'the record has no explicit text colour' });

  const rounded = (tokens.rounded ?? []).map((e) => ({ value: Number(e.value), count: e.count })).filter((e) => e.value === 0 || e.value === 1);
  if (rounded.length) consider('tokens.rounded', rounded[0].value, rounded[0].count, rounded[0].count / sum(rounded));
  else skipped.push({ target: 'tokens.rounded', reason: 'the record has no rounded tally - it predates #89; re-run learn-drawio-style' });

  return { derived, skipped };
}

export const FINDINGS = findingsTools(LAYER, { deriveFindings, learnSkill: 'learn-drawio-style' });

export const {
  CONFIDENCE, findingsPath, readFindings, shippedAt, parseObserved, mergeDerived, addFinding, removeFinding,
} = FINDINGS;

if (process.argv[1] && process.argv[1].endsWith('style-findings.mjs')) FINDINGS.main(process.argv.slice(2));
