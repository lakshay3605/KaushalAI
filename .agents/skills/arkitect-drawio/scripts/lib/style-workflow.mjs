// Findings and the apply step, shared by both engines (#89, #90).
//
//   style-findings.mjs  what a person's own diagrams say about the house style,
//                       kept in <ARKITECT_HOME>/<engine>/findings.json
//   apply-style.mjs     which of those findings this install draws with, written
//                       to <ARKITECT_HOME>/<engine>/style-overrides.json
//
// Each engine's two scripts are thin: they name the engine's style layer and say
// how its record turns into findings. Everything else - one entry per target, an
// agent finding holding its target, which findings are offered, how an accepted
// one is written and what is reported - behaves the same for Draw.io and
// Excalidraw, because it is this code.

import { existsSync, unlinkSync } from 'node:fs';
import { readJson } from './read-json.mjs';
import { parseCliOrExit, exitUsage, UsageError } from './drawio-core.mjs';
import { storeFile, writeJson } from './store.mjs';

export const CONFIDENCE = Object.freeze(['high', 'medium', 'low']);

// A value as typed: JSON where it parses (14, 0, true, {"stroke": ...}), else the
// text itself (#CC0000, trigger, 8 8).
export function parseObserved(text) {
  try { return JSON.parse(text); } catch { return text; }
}

// One record-based finding, or the reason the corpus value cannot be one.
export function derivedFinding(layer, { target, observed, evidence, share, confidence }) {
  const problems = layer.targetErrors(target, observed);
  if (problems.length) return { skipped: { target, reason: `the corpus value is outside what a build accepts: ${problems[0]}` } };
  const shipped = layer.shippedAt(target);
  return {
    finding: {
      target,
      // A colour differing only in case is the same colour.
      observed: layer.sameValue(observed, shipped) ? shipped : observed,
      shipped,
      basis: 'record',
      evidence,
      share: Math.round(share * 1000) / 1000,
      confidence,
    },
  };
}

function fail(errors, extra = {}) {
  console.error(JSON.stringify({ ok: false, ...extra, errors }, null, 2));
  process.exit(1);
}

// ---------------------------------------------------------------- findings

// `deriveFindings(record)` returns { derived, skipped } for the engine's record;
// `learnSkill` is what builds that record.
export function findingsTools(layer, { deriveFindings, learnSkill }) {
  const { SCHEMA_VERSION, ENGINE, label } = layer;
  const USAGE = 'usage: style-findings.mjs --derive [--record <file>] | --list | --remove <target>\n'
    + '       style-findings.mjs --add <target> --observed <value> --evidence <n> --confidence high|medium|low [--note <text>]';

  const findingsPath = (env = process.env) => storeFile(ENGINE, 'findings', env);

  const emptyFindings = () => ({ schemaVersion: SCHEMA_VERSION, engine: ENGINE, recordVersion: null, derived: null, findings: [] });

  function readFindings(path = findingsPath()) {
    if (!existsSync(path)) return emptyFindings();
    let file;
    try {
      file = readJson(path);
    } catch {
      throw new Error(`${path} is not valid JSON`);
    }
    if (file?.schemaVersion !== SCHEMA_VERSION || file.engine !== ENGINE || !Array.isArray(file.findings)) {
      throw new Error(`${path} is not a findings file for ${label} (schemaVersion ${SCHEMA_VERSION})`);
    }
    return file;
  }

  // Replace the record-based entries, keeping every agent entry and the targets
  // those hold.
  function mergeDerived(file, record, { now = new Date() } = {}) {
    const { derived, skipped } = deriveFindings(record);
    const agent = file.findings.filter((f) => f.basis !== 'record');
    const held = new Set(agent.map((f) => f.target));
    const fresh = derived.filter((f) => !held.has(f.target));
    return {
      file: { ...file, recordVersion: record?.version ?? null, derived: now.toISOString(), findings: [...fresh, ...agent] },
      derived: fresh,
      heldByAgent: derived.filter((f) => held.has(f.target)).map((f) => f.target),
      skipped,
    };
  }

  // An agent-judged finding. A whole object on a shipped kind is split into one
  // entry per field, so each can be accepted on its own.
  function addFinding(file, { target, observed, evidence, confidence, note }, { now = new Date() } = {}) {
    const t = layer.parseTarget(target);
    const splitsKind = t?.type === 'edgeKind' && Object.hasOwn(layer.EDGE_KINDS, t.kind)
      && observed && typeof observed === 'object' && !Array.isArray(observed);
    const entries = splitsKind
      ? Object.entries(observed).map(([field, value]) => ({ target: `edgeKinds.${t.kind}.${field}`, observed: value }))
      : [{ target, observed }];
    const errors = splitsKind && !entries.length ? [`${target}: the object names no field`] : [];
    for (const e of entries) errors.push(...layer.targetErrors(e.target, e.observed));
    if (!Number.isSafeInteger(evidence) || evidence < 1) errors.push('--evidence: expected how many times it was seen, a whole number of at least 1');
    if (!CONFIDENCE.includes(confidence)) errors.push('--confidence: expected high, medium or low');
    if (note !== undefined && (typeof note !== 'string' || note.length > 200 || /[\u0000-\u001f\u007f]/.test(note))) {
      errors.push('--note: expected one line of at most 200 characters');
    }
    if (errors.length) return { file, added: [], errors };
    const added = entries.map((e) => ({
      target: e.target, observed: e.observed, shipped: layer.shippedAt(e.target), basis: 'agent',
      evidence, confidence, ...(note ? { note } : {}), added: now.toISOString(),
    }));
    const replaced = new Set(added.map((e) => e.target));
    return { file: { ...file, findings: [...file.findings.filter((f) => !replaced.has(f.target)), ...added] }, added, errors: [] };
  }

  // A target, and for a whole kind every field entry under it.
  function removeFinding(file, target) {
    const hits = (f) => f.target === target || f.target.startsWith(`${target}.`);
    return { file: { ...file, findings: file.findings.filter((f) => !hits(f)) }, removed: file.findings.filter(hits).map((f) => f.target) };
  }

  function wholeArg(value, flag) {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new UsageError(`${flag} expects a whole number, got "${value}"`);
    return Number(value);
  }

  function main(argv) {
    const { options, positionals } = parseCliOrExit(argv, {
      values: {
        '--add': null, '--observed': null, '--evidence': wholeArg, '--confidence': null, '--note': null,
        '--remove': null, '--record': null,
      },
      switches: ['--derive', '--list'],
    }, USAGE);
    if (positionals.length) exitUsage(`unexpected argument "${positionals[0]}"`, USAGE);
    const modes = ['derive', 'list', 'add', 'remove'].filter((m) => options[m] !== undefined);
    if (modes.length !== 1) {
      exitUsage(modes.length ? `choose one of --${modes.join(', --')}` : 'expected --derive, --add, --remove or --list', USAGE);
    }
    const [mode] = modes;
    if (mode !== 'add' && ['observed', 'evidence', 'confidence', 'note'].some((k) => options[k] !== undefined)) {
      exitUsage('--observed, --evidence, --confidence and --note go with --add', USAGE);
    }
    if (mode !== 'derive' && options.record !== undefined) exitUsage('--record goes with --derive', USAGE);

    const path = findingsPath();
    let file;
    try { file = readFindings(path); } catch (error) { fail([error.message]); }

    if (mode === 'list') {
      console.log(JSON.stringify({ findings: path, ...file }, null, 2));
      return;
    }

    if (mode === 'derive') {
      const recordPath = options.record ?? storeFile(ENGINE, 'record');
      if (!existsSync(recordPath)) fail([`no record at ${recordPath}; build one with ${learnSkill} (build-knowledge.mjs) first`]);
      let record;
      try { record = readJson(recordPath); } catch { fail([`${recordPath} is not valid JSON`]); }
      const result = mergeDerived(file, record);
      writeJson(path, result.file);
      console.log(JSON.stringify({
        wrote: path,
        record: recordPath,
        recordVersion: result.file.recordVersion,
        derived: result.derived.map(({ target, observed, shipped, evidence, confidence }) => ({
          target, observed, shipped, agreesWithHouseStyle: layer.sameValue(observed, shipped), evidence, confidence,
        })),
        heldByAgent: result.heldByAgent,
        skipped: result.skipped,
      }, null, 2));
      return;
    }

    if (mode === 'add') {
      if ([options.observed, options.evidence, options.confidence].some((v) => v === undefined)) {
        exitUsage('--add needs --observed, --evidence and --confidence', USAGE);
      }
      const result = addFinding(file, {
        target: options.add, observed: parseObserved(options.observed),
        evidence: options.evidence, confidence: options.confidence, note: options.note,
      });
      if (result.errors.length) fail(result.errors);
      writeJson(path, result.file);
      console.log(JSON.stringify({ wrote: path, added: result.added }, null, 2));
      return;
    }

    const result = removeFinding(file, options.remove);
    if (!result.removed.length) fail([`no finding for ${options.remove}`]);
    writeJson(path, result.file);
    console.log(JSON.stringify({ wrote: path, removed: result.removed }, null, 2));
  }

  return Object.freeze({
    CONFIDENCE, findingsPath, readFindings, shippedAt: layer.shippedAt, parseObserved,
    mergeDerived, addFinding, removeFinding, main,
  });
}

// ---------------------------------------------------------------- apply

const RANK = { high: 0, medium: 1, low: 2 };

export function applyTools(layer, findingsTool) {
  const { SCHEMA_VERSION, ENGINE, T, edgeKindsFor } = layer;
  const USAGE = 'usage: apply-style.mjs --list | --accept <id>[,<id>...] | --reset';

  // Findings whose observed value differs from what a build draws now: the
  // override's value where it sets the target, the house style's where it does
  // not. A finding that already matches is no candidate, however strong its
  // evidence - there is nothing to apply. Strongest first, low confidence flagged
  // but still offered: the person decides.
  function listCandidates(findings, style) {
    const candidates = [];
    const alreadyInEffect = [];
    const invalid = [];
    for (const f of findings) {
      const problems = layer.targetErrors(f.target, f.observed);
      if (problems.length) { invalid.push({ target: f.target, errors: problems }); continue; }
      const current = layer.valueAt(style, f.target);
      if (layer.sameValue(f.observed, current)) { alreadyInEffect.push(f.target); continue; }
      candidates.push({
        id: f.target,
        shipped: layer.shippedAt(f.target),
        current,
        proposed: f.observed,
        confidence: f.confidence,
        lowConfidence: f.confidence === 'low',
        evidence: f.evidence,
        basis: f.basis,
        ...(f.note ? { note: f.note } : {}),
      });
    }
    candidates.sort((a, b) => (RANK[a.confidence] ?? 3) - (RANK[b.confidence] ?? 3)
      || b.evidence - a.evidence || a.id.localeCompare(b.id));
    return { candidates, alreadyInEffect, invalid };
  }

  // The override after accepting some candidates. Whatever now equals the house
  // style is dropped, so the file only ever says where this install differs.
  function applyAccepted(raw, accepted) {
    const tokens = { ...(raw?.tokens ?? {}) };
    const edgeKinds = Object.fromEntries(Object.entries(raw?.edgeKinds ?? {}).map(([kind, entry]) => [kind, { ...entry }]));
    for (const c of accepted) {
      const t = layer.parseTarget(c.id);
      if (t.type === 'token') tokens[t.name] = c.proposed;
      else if (t.type === 'edgeField') (edgeKinds[t.kind] ??= {})[t.field] = c.proposed;
      else edgeKinds[t.kind] = { ...c.proposed };
    }
    for (const [name, value] of Object.entries(tokens)) if (layer.sameValue(value, T[name])) delete tokens[name];
    // A shipped kind's colour or width can follow the tokens, so compare against those.
    const base = edgeKindsFor({ ...T, ...tokens });
    for (const [kind, entry] of Object.entries(edgeKinds)) {
      if (!Object.hasOwn(base, kind)) continue;
      for (const [field, value] of Object.entries(entry)) if (layer.sameValue(value, base[kind][field])) delete entry[field];
      if (!Object.keys(entry).length) delete edgeKinds[kind];
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      engine: ENGINE,
      ...(Object.keys(tokens).length ? { tokens } : {}),
      ...(Object.keys(edgeKinds).length ? { edgeKinds } : {}),
    };
  }

  function readOverride(path = layer.overridesPath()) {
    if (!existsSync(path)) return { raw: null, errors: [] };
    try {
      const raw = readJson(path);
      return { raw, errors: layer.validateOverrides(raw) };
    } catch (error) {
      return { raw: null, errors: [error instanceof SyntaxError ? 'the file is not valid JSON' : `cannot read it: ${error.code ?? error.message}`] };
    }
  }

  function main(argv) {
    const { options, positionals } = parseCliOrExit(argv, { values: { '--accept': null }, switches: ['--list', '--reset'] }, USAGE);
    if (positionals.length) exitUsage(`unexpected argument "${positionals[0]}"`, USAGE);
    const modes = ['list', 'accept', 'reset'].filter((m) => options[m] !== undefined);
    if (modes.length !== 1) exitUsage(modes.length ? `choose one of --${modes.join(', --')}` : 'expected --list, --accept or --reset', USAGE);

    const file = layer.overridesPath();
    const current = readOverride(file);

    if (options.reset) {
      if (!existsSync(file)) {
        console.log(JSON.stringify({ removed: null, note: 'no override: this install already draws the house style' }, null, 2));
        return;
      }
      unlinkSync(file);
      console.log(JSON.stringify({
        removed: file,
        ...(current.errors.length
          ? { note: 'the removed file had problems, so it was not in effect' }
          : { nowHouseStyle: layer.resolveStyle(current.raw).overridden }),
      }, null, 2));
      return;
    }

    const findings = findingsTool.findingsPath();
    let record;
    try { record = findingsTool.readFindings(findings); } catch (error) { fail([error.message], { wrote: null }); }
    const before = current.errors.length ? layer.resolveStyle() : layer.resolveStyle(current.raw, { file: current.raw ? file : null });
    const { candidates, alreadyInEffect, invalid } = listCandidates(record.findings, before);

    if (options.list) {
      console.log(JSON.stringify({
        findings,
        overrides: file,
        overrideInEffect: before.source === 'override',
        ...(current.errors.length ? { overrideProblems: current.errors } : {}),
        recordVersion: record.recordVersion,
        candidates,
        alreadyInEffect,
        invalid,
      }, null, 2));
      return;
    }

    // A broken override is never quietly replaced: fix it or reset it first.
    if (current.errors.length) fail([`${file} has problems and is not in effect; fix it or run --reset first`, ...current.errors], { wrote: null });
    const ids = [...new Set(options.accept.split(',').map((s) => s.trim()).filter(Boolean))];
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const unknown = ids.filter((id) => !byId.has(id));
    if (!ids.length || unknown.length) {
      exitUsage(`${ids.length ? `not a current candidate: ${unknown.join(', ')}` : '--accept names no candidate'}; run --list for the candidates`, USAGE);
    }

    const next = applyAccepted(current.raw, ids.map((id) => byId.get(id)));
    const problems = layer.validateOverrides(next);
    if (problems.length) fail(problems, { wrote: null });
    const after = layer.resolveStyle(next, { file });
    const empty = !next.tokens && !next.edgeKinds;
    const existed = existsSync(file);
    if (empty) { if (existed) unlinkSync(file); }
    else writeJson(file, { schemaVersion: next.schemaVersion, engine: next.engine, updated: new Date().toISOString(), ...next });

    console.log(JSON.stringify({
      ok: true,
      wrote: empty ? null : file,
      removed: empty && existed ? file : null,
      changed: ids.map((id) => ({
        target: id,
        from: layer.valueAt(before, id),
        fromSource: before.overridden.includes(id) ? 'your override' : 'house style',
        to: layer.valueAt(after, id),
      })),
      overridden: after.overridden,
    }, null, 2));
  }

  return Object.freeze({ listCandidates, applyAccepted, readOverride, main });
}
