// Watches the pinned upstreams for the two things a pin cannot notice by itself.
//
// Simple Icons removes a brand when its owner asks. A mark removed after our pin
// would keep shipping from here, redistributing something we have been asked not
// to (#10). And the vendor sets move on without telling anyone, so the packs
// quietly fall behind (#9).
//
// A project logo committed as a local file rests on a licence read at one
// commit. The project can redraw the logo, relicense, or archive the repository
// the pin points into, and the digest over our own bytes notices none of it
// (#74, #82).
//
// Every check only reports. Moving a mark to the on-demand tier, or re-pinning a
// source, is a reviewed pull request: a new release can rename or withdraw
// services, and a human should see that before anything changes.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './icon-build.mjs';
import { RECHECK_DAYS, staleStatus } from './lifecycle.mjs';

export const REGISTRY = 'https://registry.npmjs.org';
export const GITHUB_API = 'https://api.github.com';

const LIB_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'libraries');

// Unauthenticated, the GitHub API allows 60 requests an hour; the workflow
// passes its token so one run over every repository stays well inside the limit.
async function fetchJson(url) {
  const headers = { accept: 'application/json' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token && url.startsWith(`${GITHUB_API}/`)) headers.authorization = `Bearer ${token}`;
  const res = await fetch(url, { redirect: 'follow', headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// A file that is gone is an answer; anything else that is not a 200 means the
// check could not look, and must fail rather than report clean.
async function probeUrl(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (res.status === 404 || res.status === 410) return { status: res.status };
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return { status: res.status, sha256: sha256(Buffer.from(await res.arrayBuffer())) };
}

const readCommitted = (src, file) => sha256(readFileSync(join(LIB_DIR, src.dir, file)));

// Hashed in memory, never cached: a check must not replace the archive the next
// build reads, or a drifted source would stop failing the build.
async function fetchSha256(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return sha256(Buffer.from(await res.arrayBuffer()));
}

// A file-type sheet records its glyph as "icons/docker.svg"; a brand records "docker".
export const slugOf = (upstreamId) => String(upstreamId).replace(/^icons\//, '').replace(/\.svg$/, '');

// Every Simple Icons slug this repository ships bytes for, with the ids using it.
export function shippedSimpleIcons(catalog, version) {
  const out = new Map();
  for (const icon of catalog.icons) {
    if (icon.bytes !== 'committed' || icon.source !== `simple-icons@${version}`) continue;
    const slug = slugOf(icon.upstreamId);
    if (!out.has(slug)) out.set(slug, { slug, ids: [] });
    out.get(slug).ids.push(icon.id);
  }
  return out;
}

const iconsOf = (data) => {
  const list = Array.isArray(data) ? data : data?.icons;
  if (!Array.isArray(list)) throw new Error('simple-icons data is not a list of icons');
  for (const d of list) if (!d.slug) throw new Error(`simple-icons entry "${d.title}" carries no slug`);
  return list;
};

// A slug missing from the latest release is either a rename - the brand is still
// there under another slug, which is not a licensing problem - or a removal,
// which is. A rename is recognised by the title the pin knew, or by Simple
// Icons recording that title under aliases.old.
export function compareSimpleIcons(shipped, pinnedData, latestData) {
  const pinned = iconsOf(pinnedData);
  const latest = iconsOf(latestData);
  const present = new Set(latest.map((d) => d.slug));
  const titleAtPin = new Map(pinned.map((d) => [d.slug, d.title]));
  const removed = [];
  const renamed = [];
  for (const s of shipped.values()) {
    if (present.has(s.slug)) continue;
    const title = titleAtPin.get(s.slug) ?? s.slug;
    const successor = latest.find((d) => d.title === title || (d.aliases?.old ?? []).includes(title));
    if (successor) renamed.push({ ...s, title, to: successor.slug });
    else removed.push({ ...s, title });
  }
  return { removed, renamed };
}

export async function checkSimpleIcons({ catalog, manifest, get = fetchJson }) {
  const src = manifest.sources['simple-icons'];
  const { version: latest } = await get(`${REGISTRY}/${src.package}/latest`);
  const dataAt = (version) => get(src.dataUrl.replace(`@${src.version}/`, `@${version}/`));
  const pinnedData = await dataAt(src.version);
  const latestData = latest === src.version ? pinnedData : await dataAt(latest);
  const shipped = shippedSimpleIcons(catalog, src.version);
  return { pinned: src.version, latest, shipped: shipped.size, ...compareSimpleIcons(shipped, pinnedData, latestData) };
}

// raw.githubusercontent.com/<owner>/<repo>/<sha>/<path> and
// github.com/<owner>/<repo>/blob/<sha>/<path> both pin a file to a commit.
// HEAD names the same path on the default branch, whatever it is called.
export function githubPin(url) {
  const m = String(url ?? '').match(/^https:\/\/(?:raw\.githubusercontent\.com\/([^/]+)\/([^/]+)|github\.com\/([^/]+)\/([^/]+)\/blob)\/([0-9a-f]{40})\/(.+)$/);
  if (!m) return null;
  const owner = m[1] ?? m[3];
  const repo = m[2] ?? m[4];
  const path = m[6];
  return {
    repo: `${owner}/${repo}`,
    commit: m[5],
    path,
    pinned: `https://raw.githubusercontent.com/${owner}/${repo}/${m[5]}/${path}`,
    head: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
  };
}

// A repository nobody has pushed to in a year is worth a second look: both
// wrong-product marks #79 caught came out of one (#82).
export const DORMANT_DAYS = 365;

// The repository a local-files source pins into, from its licence or its artwork.
export function sourceRepo(src, icons) {
  for (const url of [src.licenceUrl, ...icons.map((i) => i.upstreamUrl)]) {
    const pin = githubPin(url);
    if (pin) return pin.repo;
  }
  return null;
}

export const localFileIcons = (manifest, key) => manifest.packs
  .flatMap((pack) => pack.icons ?? [])
  .filter((icon) => icon.source === key);

// Three things per source, each against what was true when it was pinned:
//   artwork  the same path upstream now, compared with the pinned commit - or,
//            where the URL pins no commit, with the bytes committed here
//   licence  the licence file on the default branch, compared with the pinned one
//   repo     archived or dormant now, compared with what sources.json recorded
async function checkLocalFiles({ key, src, icons, get, probe, committed, now }) {
  const checks = [];
  for (const icon of icons.filter((i) => i.upstreamUrl)) {
    const pin = githubPin(icon.upstreamUrl);
    const current = await probe(pin ? pin.head : icon.upstreamUrl);
    const subject = icon.file;
    if (!current.sha256) { checks.push({ what: 'artwork', subject, state: 'gone', url: pin ? pin.head : icon.upstreamUrl }); continue; }
    const baseline = pin ? (await probe(pin.pinned)).sha256 : committed(src, icon.file);
    checks.push({ what: 'artwork', subject, state: current.sha256 === baseline ? 'ok' : 'changed', url: pin ? pin.head : icon.upstreamUrl });
  }

  const licence = githubPin(src.licenceUrl);
  if (licence) {
    const current = await probe(licence.head);
    const subject = licence.path;
    if (!current.sha256) checks.push({ what: 'licence', subject, state: 'gone', url: licence.head });
    else {
      const pinned = (await probe(licence.pinned)).sha256;
      checks.push({ what: 'licence', subject, state: current.sha256 === pinned ? 'ok' : 'changed', url: licence.head });
    }
  } else if (src.licenceUrl) {
    // A policy page, not a file: its markup changes all the time, so only
    // whether it still exists is worth reporting.
    const current = await probe(src.licenceUrl);
    checks.push({ what: 'licence', subject: src.licenceUrl, state: current.sha256 ? 'ok' : 'gone', url: src.licenceUrl });
  }

  const repo = sourceRepo(src, icons);
  if (repo) {
    const live = await get(`${GITHUB_API}/repos/${repo}`);
    const days = Math.floor((now - Date.parse(live.pushed_at)) / 86_400_000);
    const recorded = src.upstreamRepo ?? {};
    const state = live.full_name && live.full_name.toLowerCase() !== repo.toLowerCase() ? 'moved'
      : live.archived && !recorded.archived ? 'archived'
        : days >= DORMANT_DAYS && !recorded.archived && !recorded.dormant ? 'dormant'
          : 'ok';
    checks.push({ what: 'repo', subject: repo, state, archived: Boolean(live.archived), days, to: live.full_name });
  }

  return { key, kind: 'local-files', checks, drifted: checks.some((c) => c.state !== 'ok') };
}

// A source is watched only while something we ship comes from it. The 15.x
// Simple Icons pin backs on-demand entries whose marks were withdrawn in 16, so
// a newer release of it is not news.
export async function checkDrift({ catalog, manifest, get = fetchJson, hash = fetchSha256, probe = probeUrl,
  committed = readCommitted, now = Date.now() }) {
  const shippedFrom = new Set(catalog.icons.filter((i) => i.bytes === 'committed').map((i) => i.source));
  const rows = [];
  for (const [key, src] of Object.entries(manifest.sources)) {
    if (src.type === 'npm') {
      if (!shippedFrom.has(`${src.package}@${src.version}`)) {
        rows.push({ key, kind: 'npm', pinned: src.version, drifted: false, note: 'ships no bytes; pinned on purpose' });
        continue;
      }
      const { version } = await get(`${REGISTRY}/${src.package}/latest`);
      rows.push({ key, kind: 'npm', pinned: src.version, current: version, drifted: version !== src.version });
    } else if (src.type === 'zip') {
      if (!shippedFrom.has(key)) {
        rows.push({ key, kind: 'zip', pinned: src.sha256, drifted: false, note: 'ships no bytes' });
        continue;
      }
      const current = await hash(src.url);
      rows.push({ key, kind: 'zip', pinned: src.sha256, current, drifted: current !== src.sha256 });
    } else if (src.type === 'local-files') {
      if (!shippedFrom.has(key)) {
        rows.push({ key, kind: 'local-files', drifted: false, note: 'ships no bytes' });
        continue;
      }
      rows.push(await checkLocalFiles({ key, src, icons: localFileIcons(manifest, key), get, probe, committed, now }));
    } else {
      rows.push({ key, kind: src.type, drifted: false, note: 'no upstream to compare against' });
    }
  }
  // A product's lifecycle cannot be fetched, only re-read by a person. What the
  // check can do is say which recorded facts are old enough to have moved (#83).
  const statuses = (manifest.packs ?? []).flatMap((pack) => [...(pack.icons ?? []), ...(pack.onDemand ?? [])]
    .filter((entry) => entry.status)
    .map((entry) => ({ id: `${pack.id}/${entry.slug}`, title: entry.title, status: entry.status })));
  if (statuses.length) {
    const stale = statuses.filter((s) => staleStatus(s.status, now));
    rows.push({
      key: 'lifecycle', kind: 'lifecycle', drifted: stale.length > 0, recorded: statuses.length,
      stale: stale.map((s) => ({ id: s.id, title: s.title, state: s.status.state, checked: s.status.checked })),
    });
  }
  return rows;
}

const FOOTER = '_Opened by `.github/workflows/upstream-watch.yml`. Nothing in the repository was changed._';

export function removalReport(r) {
  const out = [];
  out.push(`Simple Icons \`${r.latest}\` no longer carries ${r.removed.length === 1 ? 'a mark' : `${r.removed.length} marks`} `
    + `this repository still ships bytes for, from the \`${r.pinned}\` pin. Simple Icons removes a brand when its `
    + 'owner asks, so until this is handled we are redistributing a mark we have been asked not to.', '');
  out.push('| slug | title at the pin | shipped as |', '|---|---|---|');
  for (const m of r.removed) out.push(`| \`${m.slug}\` | ${m.title} | ${m.ids.map((id) => `\`${id}\``).join(', ')} |`);
  out.push('', '### What to do', '');
  out.push('1. In `assets/libraries/sources.json`, move each mark from its pack\'s `icons` to its `onDemand` list, with '
    + `\`reason: "removed from Simple Icons ${r.latest} at the brand owner request"\` and the \`${r.pinned}\` URL - exactly how `
    + 'OpenAI, Slack and the other 15.x removals were handled.');
  out.push('2. `node skills/arkitect-drawio/scripts/build-packs.mjs --all`, then `write-pack-docs.mjs`, then `npm test`.');
  out.push('3. Only then consider moving the pin forward.');
  if (r.renamed.length) {
    out.push('', '### Also renamed upstream (not a licensing problem)', '');
    for (const m of r.renamed) out.push(`- \`${m.slug}\` (${m.title}) is now \`${m.to}\``);
  }
  out.push('', FOOTER, '');
  return out.join('\n');
}

const FINDING = {
  'artwork changed': 'the file at the pinned path differs from the pinned commit',
  'artwork gone': 'nothing is at the pinned path on the default branch',
  'licence changed': 'the licence file differs from the one read at the pin',
  'licence gone': 'the licence file or policy page no longer exists',
  'repo archived': 'the repository has been archived since the pin was recorded',
  'repo dormant': `no push in ${DORMANT_DAYS} days or more`,
  'repo moved': 'the repository now answers under another name',
};

export function driftReport(rows) {
  const drifted = rows.filter((row) => row.drifted);
  const archives = drifted.filter((row) => !['local-files', 'lifecycle'].includes(row.kind));
  const logos = drifted.filter((row) => row.kind === 'local-files');
  const lifecycle = drifted.find((row) => row.kind === 'lifecycle');
  const out = [];
  if (archives.length) {
    out.push(`${archives.length === 1 ? 'One pinned icon source has' : `${archives.length} pinned icon sources have`} moved on `
      + 'upstream. The packs still build from the pins, so nothing is broken - but they are falling behind.', '');
    out.push('| source | pinned | upstream now |', '|---|---|---|');
    const short = (v) => (v && /^[0-9a-f]{64}$/.test(v) ? `sha256 \`${v.slice(0, 12)}\`` : `\`${v}\``);
    for (const row of archives) out.push(`| \`${row.key}\` | ${short(row.pinned)} | ${short(row.current)} |`);
    out.push('', '### What to do', '');
    out.push('1. `node skills/arkitect-drawio/scripts/build-packs.mjs --refresh <source>` to fetch the new set.');
    out.push('2. Update the pin in `assets/libraries/sources.json`, rebuild with `--all`, and diff the slug sets: a service '
      + 'present today and absent afterwards is a regression to account for, not a cleanup.');
    out.push('3. Regenerate the contact sheets and look at them before opening the pull request.');
    out.push('');
  }
  if (logos.length) {
    if (archives.length) out.push('## Project logos', '');
    out.push(`${logos.length === 1 ? 'One committed project logo has' : `${logos.length} committed project logos have`} `
      + 'something upstream that no longer matches the pin. Each ships because of a licence read at one commit, so a '
      + 'changed or missing licence can mean we are no longer permitted to ship it.', '');
    out.push('| source | what | finding |', '|---|---|---|');
    for (const row of logos) {
      for (const c of row.checks.filter((check) => check.state !== 'ok')) {
        const detail = c.state === 'moved' ? `now \`${c.to}\``
          : c.what === 'repo' ? `last push ${c.days} days ago`
            : `[${c.subject}](${c.url})`;
        out.push(`| \`${row.key}\` | ${c.what} ${c.state} | ${FINDING[`${c.what} ${c.state}`]}: ${detail} |`);
      }
    }
    out.push('', '### What to do', '');
    out.push('1. **Licence first.** Read the licence or policy as it stands now. If it no longer covers the file, move the '
      + 'mark to its pack\'s `onDemand` list in `assets/libraries/sources.json` before anything else.');
    out.push('2. **Artwork.** Look at the upstream file. A redrawn logo is re-committed and re-pinned: new commit in '
      + '`upstreamUrl` and `licenceUrl`, new `sha256`, then `build-packs.mjs --all` and the contact sheet.');
    out.push('3. **Repository.** An archived, dormant or moved repository is a prompt, not proof. Check that the product '
      + 'still goes by this name and that no livelier repository of its own carries a newer mark (#82), then record '
      + 'what you found in the source\'s `upstreamRepo` so the next run is quiet.');
    out.push('');
  }
  if (lifecycle) {
    if (archives.length || logos.length) out.push('## Product lifecycle', '');
    const n = lifecycle.stale.length;
    out.push(`${n === 1 ? 'One product lifecycle fact was' : `${n} product lifecycle facts were`} last confirmed `
      + `${RECHECK_DAYS} days ago or more. Products get renamed, sold and shut down again, and a caveat that has `
      + 'since moved on misleads the next diagram.', '');
    out.push('| entry | recorded as | last checked |', '|---|---|---|');
    for (const s of lifecycle.stale) out.push(`| \`${s.id}\` (${s.title}) | ${s.state} | ${s.checked} |`);
    out.push('', '### What to do', '');
    out.push('Re-read what has happened to each product since, update its `status` in `assets/libraries/sources.json` '
      + '(state, date, successor), set `checked` to today, and rebuild with `build-packs.mjs --all`.', '');
  }
  out.push(FOOTER, '');
  return out.join('\n');
}
