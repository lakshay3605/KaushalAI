// The per-install style override layer, shared by both engines (#89, #90).
//
// Each engine describes its own house style - named tokens, connector kinds and
// the rule every value must meet - in its scripts/lib/style-tokens.mjs and hands
// that description to styleLayer(). What an override may hold, how a bad one is
// ignored, where it lives, what a build reports about it and how a finding
// addresses one value are the same for Draw.io and Excalidraw, so they are
// written once, here.
//
// An override lives outside the plugin in <ARKITECT_HOME>/<engine>/style-overrides.json.
// It names tokens and edge kinds, never raw style strings or element JSON, and
// every value is checked, so a bad file cannot produce a malformed diagram.
// buildDiagram() never reads it; only an engine's CLI build does.

import { existsSync } from 'node:fs';
import { readJson } from './read-json.mjs';
import { storeFile } from './store.mjs';

export const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------- rules

const show = (v) => (JSON.stringify(v) ?? String(v)).slice(0, 40);
const listed = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

export const COLOUR = { check: (v) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v), expects: 'a #RRGGBB colour' };
export const whole = (lo, hi) => ({ check: (v) => Number.isInteger(v) && v >= lo && v <= hi, expects: `a whole number from ${lo} to ${hi}` });
export const oneOf = (values) => {
  const shown = values.map((v) => JSON.stringify(v));
  return {
    check: (v) => values.includes(v),
    expects: shown.length === 2 ? `${shown[0]} or ${shown[1]}` : `one of ${shown.slice(0, -1).join(', ')} or ${shown.at(-1)}`,
  };
};
export const MEANING = {
  // Written into a legend, escaped there; kept to one short line.
  check: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 60 && !/[\u0000-\u001f\u007f]/.test(v),
  expects: 'one line of 1 to 60 characters',
};

export const EDGE_KIND_NAME = /^[a-z][a-z0-9-]{0,23}$/;

const isObject = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

// ---------------------------------------------------------------- targets

// A target names one overridable value: `tokens.<name>`, `edgeKinds.<kind>.<field>`
// for a shipped kind, or `edgeKinds.<kind>` for a whole new kind. Findings and
// the apply step address values this way.
export function parseTarget(target) {
  const parts = String(target ?? '').split('.');
  if (parts[0] === 'tokens' && parts.length === 2) return { type: 'token', name: parts[1] };
  if (parts[0] === 'edgeKinds' && parts.length === 3) return { type: 'edgeField', kind: parts[1], field: parts[2] };
  if (parts[0] === 'edgeKinds' && parts.length === 2) return { type: 'edgeKind', kind: parts[1] };
  return null;
}

// The value a target has in a resolved style, or null for a kind it lacks.
export function valueAt(style, target) {
  const t = parseTarget(target);
  if (!t) return null;
  if (t.type === 'token') return style.tokens[t.name] ?? null;
  const kind = Object.hasOwn(style.edgeKinds, t.kind) ? style.edgeKinds[t.kind] : null;
  if (t.type === 'edgeField') return kind ? kind[t.field] ?? null : null;
  return kind;
}

// Colours compare without regard to case; kinds compare field by field.
export function sameValue(a, b) {
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase();
  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((k) => sameValue(a[k], b[k]));
  }
  return a === b;
}

// Where the style came from and what it changed. A build report carries each
// active edge kind's meaning, so a kind is chosen by what it means on this
// install; --print-style adds every token and kind in full.
export function styleSummary(style, { full = false } = {}) {
  return {
    source: style.source,
    reason: style.reason,
    file: style.file,
    overridden: style.overridden,
    errors: style.errors,
    ...(full
      ? { tokens: style.tokens, edgeKinds: style.edgeKinds }
      : { edgeKinds: Object.fromEntries(Object.entries(style.edgeKinds).map(([kind, e]) => [kind, e.meaning])) }),
  };
}

// ---------------------------------------------------------------- one engine

// engine        'drawio' or 'excalidraw', the store it reads and writes
// label         how a message names the engine
// tokens        the shipped values; every key a build reads
// tokenRules    the tokens an override may set, each with its rule. A shipped
//               token without one is fixed by the builder.
// edgeKindsFor  the shipped connector kinds, drawn from a set of tokens
// edgeFieldRules  the fields of a kind, each with its rule, in the order a new
//               kind is written
// crossCheck    problems between tokens, which only mean something for a whole file
export function styleLayer({ engine, label, tokens: T, tokenRules, edgeKindsFor, edgeFieldRules, crossCheck = () => [] }) {
  const EDGE_KINDS = Object.freeze(edgeKindsFor(T));
  const FIELDS = Object.keys(edgeFieldRules);
  const TOP_KEYS = new Set(['schemaVersion', 'engine', 'updated', 'tokens', 'edgeKinds']);

  // Every problem with one field of an edge kind, or with a whole new kind.
  function edgeKindErrors(name, entry, field = `edgeKinds.${name}`) {
    if (!EDGE_KIND_NAME.test(name)) return [`${field}: a kind name is lower-case letters, digits and hyphens, starting with a letter`];
    if (!isObject(entry)) return [`${field}: expected an object`];
    const errors = [];
    for (const [key, value] of Object.entries(entry)) {
      const rule = Object.hasOwn(edgeFieldRules, key) ? edgeFieldRules[key] : null;
      if (!rule) errors.push(`${field}.${key}: not an edge kind field (${FIELDS.join(', ')})`);
      // A meaning is free text from a legend: named, never echoed.
      else if (!rule.check(value)) errors.push(`${field}.${key}: expected ${rule.expects}${key === 'meaning' ? '' : `, got ${show(value)}`}`);
    }
    if (!Object.hasOwn(EDGE_KINDS, name)) {
      const missing = FIELDS.filter((k) => !Object.hasOwn(entry, k));
      if (missing.length) errors.push(`${field}: a new kind needs all of ${listed(FIELDS)}; missing ${missing.join(', ')}`);
    }
    return errors;
  }

  // Every problem with an override, each naming its field. `crossChecks` also
  // checks the tokens against each other.
  function validateOverrides(raw, { crossChecks = true } = {}) {
    if (!isObject(raw)) return ['expected a JSON object'];
    const errors = [];
    for (const key of Object.keys(raw)) {
      if (!TOP_KEYS.has(key)) errors.push(`${key}: not a field an override carries (schemaVersion, engine, updated, tokens, edgeKinds)`);
    }
    if (raw.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion: expected ${SCHEMA_VERSION}, got ${show(raw.schemaVersion)}`);
    if (raw.engine !== engine) errors.push(`engine: expected "${engine}", got ${show(raw.engine)}`);
    if (raw.updated !== undefined && typeof raw.updated !== 'string') errors.push('updated: expected a timestamp string');

    if (raw.tokens !== undefined) {
      if (!isObject(raw.tokens)) errors.push('tokens: expected an object');
      else {
        for (const [name, value] of Object.entries(raw.tokens)) {
          const rule = Object.hasOwn(tokenRules, name) ? tokenRules[name] : null;
          if (!rule) errors.push(Object.hasOwn(T, name) ? `tokens.${name}: fixed by the builder; an override cannot change it` : `tokens.${name}: not a style token`);
          else if (!rule.check(value)) errors.push(`tokens.${name}: expected ${rule.expects}, got ${show(value)}`);
        }
      }
    }
    if (raw.edgeKinds !== undefined) {
      if (!isObject(raw.edgeKinds)) errors.push('edgeKinds: expected an object');
      else for (const [name, entry] of Object.entries(raw.edgeKinds)) errors.push(...edgeKindErrors(name, entry));
    }

    if (crossChecks && !errors.length) errors.push(...crossCheck({ ...T, ...(raw.tokens ?? {}) }));
    return errors;
  }

  // The style a build uses. An invalid override is ignored as a whole - never
  // half applied - and its problems are carried in `errors` for the report.
  function resolveStyle(raw = null, { file = null, reason = null, errors: loadErrors = [] } = {}) {
    const defaults = (why, errors = []) => ({
      source: 'defaults', reason: why, file, tokens: { ...T }, edgeKinds: edgeKindsFor(T), overridden: [], errors,
    });
    if (loadErrors.length) return defaults('override ignored: it has problems', loadErrors);
    if (raw === null || raw === undefined) return defaults(reason ?? 'no override');
    const errors = validateOverrides(raw);
    if (errors.length) return defaults('override ignored: it has problems', errors);

    const tokens = { ...T, ...(raw.tokens ?? {}) };
    const edgeKinds = edgeKindsFor(tokens);
    const overridden = Object.keys(raw.tokens ?? {}).map((name) => `tokens.${name}`);
    for (const [name, entry] of Object.entries(raw.edgeKinds ?? {})) {
      if (Object.hasOwn(edgeKinds, name)) {
        for (const key of Object.keys(entry)) overridden.push(`edgeKinds.${name}.${key}`);
        edgeKinds[name] = { ...edgeKinds[name], ...entry };
      } else {
        overridden.push(`edgeKinds.${name}`);
        edgeKinds[name] = Object.fromEntries(FIELDS.map((key) => [key, entry[key]]));
      }
    }
    return { source: 'override', reason: 'override applied', file, tokens, edgeKinds, overridden, errors: [] };
  }

  const overridesPath = (env = process.env) => storeFile(engine, 'overrides', env);

  // What the CLI build uses: the install's override if there is one, unless the
  // shipped house style was asked for with --defaults.
  function loadStyle({ env = process.env, defaults = false } = {}) {
    if (defaults) return resolveStyle(null, { reason: '--defaults' });
    const file = overridesPath(env);
    if (!existsSync(file)) return resolveStyle(null, { reason: 'no override' });
    let raw;
    try {
      raw = readJson(file);
    } catch (error) {
      return resolveStyle(null, { file, errors: [error instanceof SyntaxError ? 'the file is not valid JSON' : `cannot read it: ${error.code ?? error.message}`] });
    }
    return resolveStyle(raw, { file });
  }

  // An override with problems is ignored as a whole and the build goes ahead in
  // the house style. Said once on stderr, so it is not only buried in the report.
  function loadStyleOrWarn(defaults) {
    const style = loadStyle({ defaults });
    if (style.errors.length) {
      console.error(`warning: ignoring ${style.file} (${style.errors.length} problem${style.errors.length === 1 ? '' : 's'}); `
        + 'drawing with the house style. The report lists them under style.errors; re-run apply-style.mjs, or --reset it.');
    }
    return style;
  }

  // Problems with one value for one target, checked alone.
  function targetErrors(target, value) {
    const t = parseTarget(target);
    if (!t) return [`${target}: not a target; use tokens.<name>, edgeKinds.<kind>.<field> or edgeKinds.<kind>`];
    const base = { schemaVersion: SCHEMA_VERSION, engine };
    if (t.type === 'token') return validateOverrides({ ...base, tokens: { [t.name]: value } }, { crossChecks: false });
    if (t.type === 'edgeField') {
      if (!Object.hasOwn(EDGE_KINDS, t.kind)) {
        return [`${target}: "${t.kind}" is not a shipped kind; record a new kind as one object on edgeKinds.${t.kind}`];
      }
      return validateOverrides({ ...base, edgeKinds: { [t.kind]: { [t.field]: value } } }, { crossChecks: false });
    }
    if (Object.hasOwn(EDGE_KINDS, t.kind)) {
      return [`${target}: "${t.kind}" is a shipped kind; record each changed field as edgeKinds.${t.kind}.<field>`];
    }
    return validateOverrides({ ...base, edgeKinds: { [t.kind]: value } }, { crossChecks: false });
  }

  // The house style's value at a target, or null for a kind it does not ship.
  function shippedAt(target) {
    const t = parseTarget(target);
    if (!t) return null;
    if (t.type === 'token') return Object.hasOwn(T, t.name) ? T[t.name] : null;
    const kind = Object.hasOwn(EDGE_KINDS, t.kind) ? EDGE_KINDS[t.kind] : null;
    if (t.type === 'edgeField') return kind && Object.hasOwn(kind, t.field) ? kind[t.field] : null;
    return kind;
  }

  return Object.freeze({
    SCHEMA_VERSION,
    ENGINE: engine,
    label,
    T,
    EDGE_KINDS,
    edgeKindsFor,
    TOKEN_RULES: tokenRules,
    EDGE_FIELD_RULES: edgeFieldRules,
    validateOverrides,
    resolveStyle,
    overridesPath,
    loadStyle,
    loadStyleOrWarn,
    parseTarget,
    targetErrors,
    valueAt,
    shippedAt,
    sameValue,
    styleSummary,
    DEFAULT_STYLE: Object.freeze(resolveStyle()),
  });
}
