// Where one install's own style knowledge lives: outside the plugin, so a plugin
// update or a reinstall cannot wipe it (#89).
//
//   <home>/.arkitect/<engine>/        ARKITECT_HOME replaces <home>/.arkitect
//
// The shipped house style stays in skills/*/references/ and changes only in a
// reviewed pull request. This is what a person's own diagrams taught this
// install. Nothing in it is ever committed or sent anywhere, and nothing reads
// it except the learning, findings and apply tools and the CLI builds.

import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export const ENGINES = Object.freeze(['drawio', 'excalidraw']);

export const STORE_FILES = Object.freeze({
  record: 'source-analysis.json',   // the evidence record, built from your corpus only
  sources: 'sources.json',          // the files you designated - paths, so local only
  findings: 'findings.json',        // what that corpus says, for the apply step
  overrides: 'style-overrides.json', // what you chose to draw differently
  notes: 'style-notes.md',          // prose: only where you differ from the shipped guide
  patterns: 'patterns.md',          // prose: your own recurring layouts
  renders: 'renders',               // learn's scratch renders of your diagrams
});

// An empty ARKITECT_HOME counts as unset, so `ARKITECT_HOME= node ...` cannot
// quietly resolve the store to the working directory.
export function arkitectHome(env = process.env) {
  return env.ARKITECT_HOME ? resolve(env.ARKITECT_HOME) : join(homedir(), '.arkitect');
}

export function engineStore(engine, env = process.env) {
  if (!ENGINES.includes(engine)) throw new TypeError(`unknown engine "${engine}", expected one of ${ENGINES.join(', ')}`);
  return join(arkitectHome(env), engine);
}

export function storeFile(engine, name, env = process.env) {
  if (!Object.hasOwn(STORE_FILES, name)) throw new TypeError(`unknown store file "${name}"`);
  return join(engineStore(engine, env), STORE_FILES[name]);
}

// What a run fetches or makes - a product logo, an icon built from one, a
// library from the public catalogue - lives here too. Kept inside the plugin,
// it went with the folder a plugin update replaces (#257).
export const CACHES = Object.freeze({ drawio: ['logos'], excalidraw: ['icons', 'libraries'] });

export function cacheDir(engine, name, env = process.env) {
  if (!CACHES[engine]?.includes(name)) throw new TypeError(`unknown ${engine} cache "${name}"`);
  return join(engineStore(engine, env), name);
}

// A cache's registry read from the store and from the folder it used to live
// in, the store winning. Each entry says which folder holds it, so nothing
// cached before #257 is lost; only the store is ever written.
export function mergedRegistry(read, dirs) {
  const out = {};
  for (const dir of [...dirs].reverse()) {
    for (const [key, entry] of Object.entries(read(dir) ?? {})) out[key] = { ...entry, dir };
  }
  return out;
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
