#!/usr/bin/env node
// Search the bundled icon packs and emit ready-to-paste draw.io cell styles.
// Ranking runs against references/icon-catalog.json only - image payloads are
// printed from assets/libraries/<pack>.drawio solely when --style or --data is
// requested, so a search never pulls base64 into the caller's context. A search
// does read a matched mark's library, for the cell size it recommends (#80).
//
//   node find-icon.mjs bedrock                     rank matches (metadata only)
//   node find-icon.mjs kafka --pack streaming-orchestration
//   node find-icon.mjs "cloud run" --context gcp,devops    bias toward a stack
//   node find-icon.mjs bedrock --compact           the verdict and a spec node, under 1KB
//   node find-icon.mjs --list-packs
//   node find-icon.mjs --stats
//
// --style/--cell/--data print the raw cell style, mxCell XML or data URI for one
// icon - the hand-written-XML exception, not the normal search path. Redirect
// their output to a file rather than reading it into an agent's context.
//   node find-icon.mjs --style <id> [--size 78] > style.txt
//   node find-icon.mjs --cell <id> --label "X" --x 100 --y 100 > cell.xml
//
// Some products ship as catalogue entries without bytes, because their marks
// carry no redistribution licence (see --stats for the live count). Those
// resolve to a fetch-logo command when an artwork file is pinned, and to a
// named placeholder when none is - never to a substitute icon.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { readLibrary, normalizeTitle, fitCell, ICON_FOOTPRINT } from './lib/drawio-core.mjs';
import { caveat } from './lib/lifecycle.mjs';
import { onlyGenericWords, VENDOR_PACKS, GENERIC_VENDOR, KEEP_PLACEHOLDER } from './lib/generic-words.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
const CATALOG_FILE = join(SKILL_ROOT, 'references', 'icon-catalog.json');
const LIB_DIR = join(SKILL_ROOT, 'assets', 'libraries');

let catalogCache = null;
export function loadCatalog() {
  if (!catalogCache) catalogCache = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  return catalogCache;
}

// Caption sits below the icon; matches the observed convention (184/194 icons).
export const ICON_STYLE_BASE =
  'shape=image;html=1;verticalLabelPosition=bottom;verticalAlign=top;'
  + 'labelBackgroundColor=none;imageAspect=0;aspect=fixed;fontSize=12;fontColor=#232F3E;';

// A curated pack beats the catch-all at equal strength, but an exact hit in the
// catch-all still beats a vague hit in a curated pack - otherwise "tailwindcss"
// would lose to whatever "tail" happened to match.
const CATCH_ALL_PENALTY = 10;
const CONTEXT_BONUS = 12;
const CONFIDENT_AT = 85;
const CLEAR_MARGIN = 15;

// A prefix match is only as good as what it leaves unsaid. "postgres" names
// PostgreSQL because "ql" changes nothing; "tempo" does not name Temporal,
// because "ral" makes it a different word. These remainders never change which
// product is meant.
const GENERIC_TAILS = new Set(['db', 'ql', 'sql', 'mq', 'ai', 'labs', 'proxy', 'services', 'service',
  'file', 'js', 'dotjs', 'io', 'dotio', 'hq', 'app', 'apps', 'server', 'platform', 'cloud', 'lang', 'hub']);

// How strongly a query matches one icon, and whether that match may be used
// unattended. The two are kept apart on purpose: lowering a doubtful match's
// strength would also widen the margin over it, and make some *other* wrong
// answer look confident ("delta" would become the airline).
export function match(icon, query, { packs = null, catalog = null } = {}) {
  const q = normalizeTitle(query);
  if (!q) return { strength: 0, doubt: null };
  const qTokens = q.split(' ').filter(Boolean);
  // Generated plurals are fine aliases, but on a one-word title they are a bare
  // common noun: Azure's "Cubes" must not answer to "cube" unattended.
  const generated = new Set(icon.generatedAliases ?? []);
  const oneWordTitle = !normalizeTitle(icon.title).includes(' ');
  let best = 0;
  let doubt = null;
  const consider = (strength, why = null) => {
    if (strength > best) { best = strength; doubt = why; } else if (strength === best && !why) doubt = null;
  };
  for (const alias of icon.aliases ?? []) {
    if (alias === q) consider(100, oneWordTitle && generated.has(alias) ? 'a generic word, not a product name' : null);
    else if (alias.startsWith(q)) {
      consider(85, GENERIC_TAILS.has(alias.slice(q.length).replace(/ /g, '')) ? null : 'only the start of a longer name matches');
    } else if (alias.includes(q)) consider(70);
  }
  if (String(icon.title).toLowerCase() === String(query).toLowerCase()) consider(105);
  if (best === 0) {
    // Fuzzy: how many query tokens appear anywhere in the aliases. Across ~4,800
    // icons a single token hit out of three is noise, not a candidate, so half
    // the query has to land before anything is offered at all.
    const hay = (icon.aliases ?? []).join(' ');
    const hits = qTokens.filter((t) => hay.includes(t)).length;
    const share = hits / qTokens.length;
    if (share >= 0.5) consider(Math.round(share * 60));
  }
  if (!best) return { strength: 0, doubt: null };

  const rank = catalog?.packs.find((p) => p.id === icon.pack)?.rank ?? 20;
  if (rank >= 90) best -= CATCH_ALL_PENALTY;
  if (packs?.length && packs.includes(icon.pack)) best += CONTEXT_BONUS;
  // Something the agent can actually draw outranks something it must fetch.
  if (icon.bytes === 'on-demand') best -= 2;
  return { strength: best, doubt };
}

export function score(icon, query, opts = {}) {
  return match(icon, query, opts).strength;
}

export function search(query, { limit = 8, catalog = loadCatalog(), packs = null, pack = null } = {}) {
  const pool = pack ? catalog.icons.filter((i) => i.pack === pack) : catalog.icons;
  const ranked = pool
    .map((icon) => {
      const m = match(icon, query, { packs, catalog });
      return { icon, s: m.strength, doubt: m.doubt };
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || String(a.icon.id).localeCompare(String(b.icon.id)));

  // Group by title so an ambiguous hit always shows its alternatives rather
  // than silently picking one.
  const seen = new Map();
  for (const r of ranked) {
    const key = `${r.icon.pack}::${r.icon.title}`;
    if (!seen.has(key)) seen.set(key, { title: r.icon.title, pack: r.icon.pack, best: r.s, doubt: r.doubt, variants: [] });
    seen.get(key).variants.push(r.icon);
  }
  return [...seen.values()].sort((a, b) => b.best - a.best).slice(0, limit);
}

// "Redis cache" names Redis. ElastiCache carries it as an alias, so the whole
// query drew AWS's mark with no AWS stack named (#283), and "postgres database"
// offered Azure's and RDS first. When everything after a product's name is a
// generic word, the product's name decides, unless the spec names the stack
// whose mark the whole query found. A vendor's own name for its service keeps
// its mark: "azure functions", "elastic container service", "activity log".
// The head never settles a tie the whole query found (#75), and never reaches
// a vendor's mark the spec did not ask for: "billing service" is not GCP's.
export function resolve(query, opts = {}) {
  const whole = resolveWhole(query, opts);
  const head = productHead(query);
  const open = whole.confident ? borrowsAName(whole.icon, head, query, opts)
    : whole.reason === 'weak match' || whole.reason === 'no match';
  if (!head || !open) return whole;
  const named = resolveWhole(head, opts);
  if (!named.confident || (VENDOR_PACKS.has(named.icon.pack) && !opts.packs?.includes(named.icon.pack))) return whole;
  return { ...named, query, head };
}

const VENDOR_NAMES = { aws: /\b(aws|amazon)\b/i, azure: /\b(azure|microsoft)\b/i, gcp: /\b(google|gcp)\b/i };
const squash = (s) => normalizeTitle(s).replace(/ /g, '');

// Did a vendor mark answer to another product's name? Not when the spec names
// the stack, the query names the vendor, or the head is part of the mark's title.
function borrowsAName(icon, head, query, opts) {
  return VENDOR_PACKS.has(icon.pack) && !opts.packs?.includes(icon.pack)
    && !VENDOR_NAMES[icon.pack].test(query) && !squash(icon.title).includes(squash(head));
}

// "Redis cache" -> "redis"; null when nothing generic trails, or nothing else is left.
export function productHead(query) {
  const words = String(query ?? '').trim().split(/\s+/);
  let n = words.length;
  while (n > 0 && onlyGenericWords(words[n - 1])) n -= 1;
  return n > 0 && n < words.length ? words.slice(0, n).join(' ') : null;
}

// A resolution is only safe to use unattended when the leader is strong, clearly
// ahead, and matched by its name rather than by a fragment or a common noun.
// Anything else comes back flagged, with the alternatives.
function resolveWhole(query, opts = {}) {
  const groups = search(query, opts);
  if (!groups.length) return { query, confident: false, reason: 'no match', groups: [] };
  const [top, next] = groups;
  const margin = next ? top.best - next.best : Infinity;
  // A stack the spec named settles a tie the scores cannot. Two packs can ship
  // marks with exactly the same title - Azure and primitives both call one
  // "Monitor" - and both then score 105, so the margin is 0 and nothing is
  // drawn. CONTEXT_BONUS is below CLEAR_MARGIN, so naming the stack could not
  // decide it either. When the whole of the leader's margin is that bonus and
  // the runner-up sits outside the named packs, the spec has already said which
  // one it means (#75). A runner-up inside those packs still decides nothing.
  const decidedByContext = Boolean(next && opts.packs?.length
    && opts.packs.includes(top.pack) && !opts.packs.includes(next.pack)
    && margin >= CONTEXT_BONUS);
  // A generic word never draws a cloud vendor's own mark unattended, unless
  // the spec names that vendor's stack (#231).
  const vendorForGeneric = VENDOR_PACKS.has(top.pack) && onlyGenericWords(query)
    && !opts.packs?.includes(top.pack);
  const confident = top.best >= CONFIDENT_AT
    && !top.doubt
    && !vendorForGeneric
    && (margin >= CLEAR_MARGIN || groups.length === 1 || decidedByContext)
    && top.variants.length === 1;
  const reason = confident ? null
    : top.best < CONFIDENT_AT ? 'weak match'
      : top.doubt ? top.doubt
        : vendorForGeneric ? GENERIC_VENDOR
          : top.variants.length > 1 ? 'several icons share this title'
            : 'runner-up is too close';
  return { query, confident, reason, icon: top.variants[0], groups };
}

const libCache = new Map();
function libraryFor(pack, catalog = loadCatalog()) {
  if (libCache.has(pack)) return libCache.get(pack);
  const meta = catalog.packs.find((p) => p.id === pack);
  if (!meta) throw new Error(`no pack "${pack}" in the catalog`);
  const entries = readLibrary(join(LIB_DIR, meta.file));
  libCache.set(pack, entries);
  return entries;
}

// What to do about a mark that ships no bytes, in one line an agent can act on.
export function onDemandNext(icon) {
  if (icon.fetch) return `Fetch it first:  ${icon.fetch}`;
  const slug = icon.id.slice(icon.id.indexOf('/') + 1);
  return `No artwork file is pinned${icon.brandUrl ? ` (brand page: ${icon.brandUrl})` : ''}, so there is `
    + 'nothing to fetch. Draw a named placeholder, or, with the vendor\'s own file and permission to use it, '
    + `run node scripts/fetch-logo.mjs --file <path> --name ${slug}`;
}

export function dataUriFor(icon) {
  if (icon.bytes === 'on-demand') {
    throw new Error(
      `${icon.id} ships no bytes: ${icon.reason}.\n`
      + `  ${onDemandNext(icon)}\n`
      + '  Do not substitute a different product\'s mark.',
    );
  }
  const entries = libraryFor(icon.pack);
  const entry = entries[icon.libraryIndex];
  if (!entry || entry.hash !== icon.sha256) {
    throw new Error(`catalog/library mismatch at ${icon.pack}[${icon.libraryIndex}] (${icon.title})`);
  }
  return entry.dataUri;
}

// A draw.io style is semicolon-delimited, so a standard `data:<mime>;base64,`
// URI would be split in half by the style parser. draw.io's own files use the
// comma-only form instead - `data:image/svg+xml,<base64>` - and that is what
// has to go into a cell style.
export function styleSafeDataUri(icon) {
  return dataUriFor(icon).replace(/^data:([^;,]+);base64,/, 'data:$1,');
}

export function styleFor(icon) {
  return `${ICON_STYLE_BASE}image=${styleSafeDataUri(icon)};`;
}

// An icon is fitted, never stretched: the requested size - by default the
// observed 78px service-icon footprint - sets the scale and the other side
// follows the image. A wide lockup is then grown until its short side clears a
// third of that size, and held to twice it, so its text reads rather than
// thinning to a hairline (#76). Cell styles set imageAspect=0, so a square cell
// would squash a raster like the 156x147 AgentCore Identity mark.
//
// At the size its library cell was built for, a shipped mark gets that cell.
// The catalog keeps the artwork's size rounded to integers, which can fit a
// pixel away from the cell build-packs fitted from the real size: Restate's
// 34.46x30.52 artwork is 34x31 in the catalog, 78x71 fitted, in a 78x69 cell (#80).
export function recommendedSize(icon, requested) {
  const size = requested ?? ICON_FOOTPRINT;
  const cell = libraryCell(icon);
  if (cell && size === ICON_FOOTPRINT) return { width: cell.w, height: cell.h };
  return fitCell(icon.width ?? ICON_FOOTPRINT, icon.height ?? ICON_FOOTPRINT, size);
}

// The cell a committed mark ships in; null for a mark with no bytes, for an
// object that is not a catalog row, and for a library that no longer matches.
function libraryCell(icon) {
  if (icon.bytes !== 'committed' || !Number.isInteger(icon.libraryIndex)) return null;
  const entry = libraryFor(icon.pack)[icon.libraryIndex];
  return entry?.hash === icon.sha256 && entry.w > 0 && entry.h > 0 ? entry : null;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Exact catalog ids only: no normalisation, no fuzzy matching, no library
// index. `<pack>/<slug>` is what a search prints as the thing to put in a spec,
// so it has to select that row and nothing else - passing it through text
// search sent 752 of the 4,843 ids to another product's mark (#95). Indexed
// per catalog object the way the Excalidraw side indexes shared refs.
const idIndex = new WeakMap();
export function byExactId(catalog, id) {
  if (typeof id !== 'string' || !catalog?.icons) return null;
  let map = idIndex.get(catalog);
  if (!map) {
    map = new Map(catalog.icons.map((i) => [i.id, i]));
    idIndex.set(catalog, map);
  }
  return map.get(id) ?? null;
}

function byId(catalog, id) {
  return byExactId(catalog, id)
    ?? catalog.icons.find((i) => String(i.libraryIndex) === String(id));
}

// The mark stays the right mark for its name, so a resolution stays confident;
// the answer carries the caveat, and the successor when the catalog has one (#83).
export function lifecycleOf(icon, catalog = loadCatalog()) {
  if (!icon?.status) return null;
  const s = icon.status;
  const next = s.successorId ? byExactId(catalog, s.successorId) : null;
  return {
    state: s.state,
    ...(s.on ? { on: s.on } : {}),
    caveat: caveat(icon.title, s),
    ...(s.successor ? { successor: next ? { name: s.successor, id: next.id, bytes: next.bytes } : { name: s.successor } } : {}),
    checked: s.checked,
  };
}

function describe(icon, catalog) {
  const dim = recommendedSize(icon, null);
  const lifecycle = lifecycleOf(icon, catalog);
  const base = {
    id: icon.id,
    pack: icon.pack,
    source: icon.source,
    licence: icon.licence,
    ...(lifecycle ? { lifecycle } : {}),
  };
  if (icon.bytes === 'on-demand') {
    return {
      ...base, bytes: 'on-demand', reason: icon.reason, artwork: icon.artwork,
      ...(icon.fetch ? { fetch: icon.fetch } : { next: onDemandNext(icon) }),
      ...(icon.brandUrl ? { brandUrl: icon.brandUrl } : {}),
    };
  }
  return {
    ...base,
    libraryIndex: icon.libraryIndex,
    mime: icon.mime,
    recommended: `${dim.width}x${dim.height}`,
    sha256: String(icon.sha256).slice(0, 16),
    ...(icon.sameArtworkAs ? { sameArtworkAs: icon.sameArtworkAs } : {}),
    ...(catalog.packs.find((p) => p.id === icon.pack)?.rank >= 90 ? { note: 'catch-all pack - confirm this is the right product' } : {}),
  };
}

// The answer an agent acts on, in well under 1KB (#117): the verdict, a spec
// node when there is one, the caveats that change what gets drawn, and a few
// ids to choose between when there is not. Uncertainty is kept, never settled
// by taking the first hit; the full output is one flag away.
export const COMPACT_CHOICES = 4;
export function compactAnswer(r, catalog = loadCatalog()) {
  const notes = (icon) => {
    const life = lifecycleOf(icon, catalog);
    return {
      ...(life ? { lifecycle: life.caveat, ...(life.successor?.id ? { successor: life.successor.id } : {}) } : {}),
      ...(icon.bytes === 'on-demand' ? { onDemand: onDemandNext(icon) } : {}),
    };
  };
  if (!r.groups.length) {
    return { query: r.query, confident: false, found: 0,
      next: 'No pack has it. Try --list-packs or the formal name; else draw a labelled box and say so. Never another product’s mark.' };
  }
  if (r.confident) {
    return { query: r.query, confident: true, resolved: r.icon.id, title: r.groups[0].title, ...notes(r.icon),
      node: { kind: 'icon', icon: r.icon.id } };
  }
  const all = r.groups.flatMap((g) => g.variants.map((v) => ({ v, g })));
  const pick = (list) => list.slice(0, COMPACT_CHOICES).map(({ v, g }) => ({
    id: v.id, title: g.title, strength: g.best,
    ...(v.bytes === 'on-demand' ? { onDemand: true } : {}),
    ...(v.status ? { lifecycle: v.status.state } : {}),
  }));
  // A generic word matched a vendor's mark: those marks are the wrong answer,
  // so they are not offered. The node keeps the name and draws a labelled box
  // the report lists (#231).
  if (r.reason === GENERIC_VENDOR) {
    const neutral = pick(all.filter(({ v }) => !VENDOR_PACKS.has(v.pack)));
    return { query: r.query, confident: false, needsAChoice: r.reason, node: { kind: 'icon', icon: r.query },
      ...(neutral.length ? { choices: neutral } : {}), next: KEEP_PLACEHOLDER };
  }
  const choices = pick(all);
  return { query: r.query, confident: false, needsAChoice: r.reason, choices,
    ...(all.length > choices.length ? { more: all.length - choices.length } : {}),
    next: 'Pick one id deliberately, or narrow with --pack / --context; drop --compact for detail.' };
}

function main(argv) {
  const catalog = loadCatalog();
  const flag = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };

  if (argv[0] === '--stats') {
    console.log(JSON.stringify({ counts: catalog.counts, generated: catalog.generated, manifest: catalog.manifest }, null, 2));
    return;
  }

  if (argv[0] === '--list-packs') {
    console.log(JSON.stringify({
      packs: catalog.packs.map((p) => ({
        id: p.id, title: p.title, icons: p.count, onDemand: p.onDemand, onDemandPinned: p.onDemandPinned,
        rank: p.rank, about: p.description,
      })),
      onDemand: 'catalogued without bytes; onDemandPinned of them have an artwork file fetch-logo can download, '
        + 'the rest have nothing to fetch and draw as a named placeholder',
      resolutionOrder: 'lower rank wins at equal match strength; rank 90 is the catch-all',
      usage: 'node find-icon.mjs <query> [--pack <id>] [--context <id,id>]',
    }, null, 2));
    return;
  }

  if (argv[0] === '--style' || argv[0] === '--data' || argv[0] === '--cell') {
    const icon = byId(catalog, argv[1]);
    if (!icon) { console.error(`no icon with id ${argv[1]}`); process.exit(1); }
    const size = flag('--size') ? Number(flag('--size')) : null;
    const dim = recommendedSize(icon, size);
    if (argv[0] === '--data') { process.stdout.write(dataUriFor(icon)); return; }
    if (argv[0] === '--style') { process.stdout.write(styleFor(icon)); return; }
    const label = flag('--label') ?? icon.title;
    const x = flag('--x') ?? 0;
    const y = flag('--y') ?? 0;
    const id = flag('--id') ?? `icon-${icon.id.replace(/\W+/g, '-')}`;
    process.stdout.write(
      `<mxCell id="${esc(id)}" value="${esc(label)}" style="${esc(styleFor(icon))}" vertex="1" parent="1">\n`
      + `  <mxGeometry x="${x}" y="${y}" width="${dim.width}" height="${dim.height}" as="geometry" />\n`
      + '</mxCell>');
    return;
  }

  const packs = (flag('--context') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const pack = flag('--pack');
  const skip = new Set(['--context', '--pack', '--size', '--label', '--x', '--y', '--id']);
  const query = argv.filter((a, i) => !a.startsWith('--') && !skip.has(argv[i - 1])).join(' ');

  if (!query) {
    console.error('usage: find-icon.mjs <product name> [--pack <id>] [--context <id,id>] [--compact]');
    console.error('       find-icon.mjs --list-packs | --style <id> | --cell <id> | --stats');
    process.exit(2);
  }

  const r = resolve(query, { catalog, packs, pack });
  if (argv.includes('--compact')) {
    console.log(JSON.stringify(compactAnswer(r, catalog)));
    return;
  }
  if (!r.groups.length) {
    console.log(JSON.stringify({
      query, matches: [], confident: false,
      advice: 'No pack has this icon. Check --list-packs, try the product\'s formal name, or draw a '
        + 'plain labelled box and say so in the report. Never substitute a different product\'s mark.',
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    query,
    confident: r.confident,
    ...(r.confident ? { resolved: r.icon.id } : { needsAChoice: r.reason }),
    matches: r.groups.map((g) => ({
      title: g.title,
      pack: g.pack,
      strength: g.best,
      ambiguous: g.variants.length > 1,
      variants: g.variants.map((v) => describe(v, catalog)),
    })),
    next: r.confident
      ? `spec node: { "kind": "icon", "icon": "${r.icon.id}" }`
      : 'Pick one id deliberately, or narrow with --pack / --context.',
  }, null, 2));
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
