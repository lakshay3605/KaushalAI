#!/usr/bin/env node
// What your own scenes say about the Excalidraw house style, kept as a list the
// apply step can act on (#90).
//
//   node style-findings.mjs --derive [--record <source-analysis.json>]
//   node style-findings.mjs --add <target> --observed <value> --evidence <n> --confidence high|medium|low [--note <text>]
//   node style-findings.mjs --remove <target>
//   node style-findings.mjs --list
//
// The list is <ARKITECT_HOME>/excalidraw/findings.json, beside the record
// learn-excalidraw-style builds there. One entry per target, of two kinds:
//
//   basis "record"  computed by --derive from the record's conventions. Only a
//                   convention that is exactly one style token is derived:
//                   roughness, shape and connector stroke width, font family,
//                   corner rounding, fill style, connector colour and routing,
//                   boundary stroke style and width, canvas colour. Font size is
//                   not - its tally mixes labels, captions and titles.
//   basis "agent"   a judgement made looking at the scenes - what a legend says
//                   a dashed arrow means, say - recorded with --add. It holds its
//                   target against --derive until it is removed.
//
// A target is `tokens.<name>`, `edgeKinds.<kind>.<field>` for a shipped kind, or
// `edgeKinds.<kind>` for a whole new kind. Every target and value is checked
// against the override rules, so apply-style.mjs is never offered something a
// build would ignore. Nothing here changes what a build draws. Only
// deriveFindings() is Excalidraw's own; the list and the CLI are shared with
// Draw.io, in arkitect-drawio/scripts/lib/style-workflow.mjs.

import { LAYER } from './lib/style-tokens.mjs';
import { findingsTools, derivedFinding } from '../../arkitect-drawio/scripts/lib/style-workflow.mjs';

// The grading build-knowledge.mjs gives a convention.
const level = (total, share) => (total < 6 ? 'low' : share >= 0.8 ? 'high' : share >= 0.6 ? 'medium' : 'low');

// The record writes every value as text.
const asNumber = (v) => (/^-?\d+$/.test(String(v)) ? Number(v) : v);

// Conventions that are exactly one token, and how to read the record's value.
const ONE_TO_ONE = [
  ['stroke-roughness', 'tokens.roughness', asNumber],
  ['stroke-width', 'tokens.strokeWidth', asNumber],
  ['font-family', 'tokens.fontFamily', asNumber],
  ['fill-style', 'tokens.fillStyle'],
  ['arrow-color', 'tokens.edgeColor'],
  ['arrow-stroke-width', 'tokens.edgeStrokeWidth', asNumber],
  // The tally counts `elbowed`; an arrow that is not elbowed is the builder's `points`.
  ['arrow-routing', 'tokens.edgeRouting', (v) => (v === 'true' ? 'elbow' : v === 'false' ? 'points' : v)],
  ['zone-stroke-style', 'tokens.boundaryStroke'],
  ['zone-stroke-width', 'tokens.boundaryStrokeWidth', asNumber],
  ['canvas-background', 'tokens.canvasBackground'],
];

export function deriveFindings(record) {
  const conventions = new Map((record?.conventions ?? []).map((c) => [c.id, c]));
  const derived = [];
  const skipped = [];
  const consider = (target, observed, n, total) => {
    const share = total ? n / total : 0;
    const r = derivedFinding(LAYER, { target, observed, evidence: n, share, confidence: level(total, share) });
    if (r.skipped) skipped.push(r.skipped);
    else derived.push(r.finding);
  };
  // A convention with no corpus behind it rests on a default, which is no finding.
  const evidenced = (id, target) => {
    const c = conventions.get(id);
    if (!c) skipped.push({ target, reason: `the record has no ${id} convention` });
    else if (c.confidence === 'default' || !c.evidence?.total || c.observed === null || c.observed === undefined) {
      skipped.push({ target, reason: `the record has no evidence for ${id}` });
    } else return c;
    return null;
  };

  for (const [id, target, read = (v) => v] of ONE_TO_ONE) {
    const c = evidenced(id, target);
    if (c) consider(target, read(c.observed), c.evidence.n, c.evidence.total);
  }

  // A corner is recorded as sharp or as one of Excalidraw's roundness types, and
  // every type is a rounded corner, so the types count together.
  const corners = evidenced('edges-rounded', 'tokens.rounded');
  if (corners) {
    const tally = record?.tallies?.roles?.shape?.roundness ?? corners.distribution ?? {};
    const total = Object.values(tally).reduce((n, v) => n + v, 0);
    const sharp = tally.sharp ?? 0;
    const rounded = total - sharp;
    if (total) consider('tokens.rounded', rounded >= sharp, Math.max(rounded, sharp), total);
    else skipped.push({ target: 'tokens.rounded', reason: 'the record has no roundness tally' });
  }

  return { derived, skipped };
}

export const FINDINGS = findingsTools(LAYER, { deriveFindings, learnSkill: 'learn-excalidraw-style' });

export const {
  CONFIDENCE, findingsPath, readFindings, shippedAt, parseObserved, mergeDerived, addFinding, removeFinding,
} = FINDINGS;

if (process.argv[1] && process.argv[1].endsWith('style-findings.mjs')) FINDINGS.main(process.argv.slice(2));
