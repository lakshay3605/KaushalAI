#!/usr/bin/env node
// Build the bundled .drawio icon libraries from assets/libraries/sources.json.
//
//   node build-packs.mjs --all                  build every pack + the catalog
//   node build-packs.mjs --pack azure           build one pack
//   node build-packs.mjs --verify               committed libraries match the manifest?
//   node build-packs.mjs --refresh azure-v24    re-download one source, report hash drift
//   node build-packs.mjs --check-upstream       has Simple Icons removed a mark we ship?
//   node build-packs.mjs --check-drift          have the pinned sources moved on?
//   node build-packs.mjs --downscale-png in.png out.png [--max 156]
//   node build-packs.mjs --list                 what the manifest declares
//
// Upstream archives land in a gitignored .cache/ - they are inputs, not
// shipped artwork. Vendor icons (AWS, Azure, Google) are embedded verbatim
// because those terms permit redistribution for architecture diagrams but
// forbid altering the icon shape. Only permissively licensed marks are
// recoloured, and only ever into their own brand colour. The one exception is
// size: five AWS rasters published at ~1024px ship proportionally shrunk to
// twice their drawn size, from committed files under assets/libraries/local/.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readLibrary, titleAliases, fitCell, ICON_FOOTPRINT as ICON_SIZE } from './lib/drawio-core.mjs';
import {
  sha256, download, readZip, readTgz, viewBoxOf, sizedSvg, tintUnpaintedMark, paintMark, conceptTile,
  fileSheet, dataUri, writeLibrary, prettyTitle, slugify, aliasSet, withPlurals, withShortName,
  normalise, pngSize, downscalePng, paintsOnlyWhite,
} from './lib/icon-build.mjs';
import { checkSimpleIcons, checkDrift, removalReport, driftReport } from './lib/upstream.mjs';
import { statusProblems } from './lib/lifecycle.mjs';
import { svgBytesProblem } from './lib/xml-check.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
export const LIB_DIR = join(SKILL_ROOT, 'assets', 'libraries');
export const REF_DIR = join(SKILL_ROOT, 'references');
export const CACHE_DIR = join(SKILL_ROOT, '.cache');
export const MANIFEST_FILE = join(LIB_DIR, 'sources.json');
export const CATALOG_FILE = join(REF_DIR, 'icon-catalog.json');

// Renders where the builder chose the colour, so the catalog row records it.
const PAINTED = new Set(['tinted', 'tile-bright']);

export const loadManifest = () => JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));

// ------------------------------------------------------------------ sources

function npmTarballUrl(pkg, version) {
  const short = pkg.includes('/') ? pkg.split('/')[1] : pkg;
  return `https://registry.npmjs.org/${pkg}/-/${short}-${version}.tgz`;
}

// One archive per source, read once and kept in memory for the whole run.
async function openSource(key, manifest, cache, { refresh = false } = {}) {
  if (cache.has(key) && !refresh) return cache.get(key);
  const src = manifest.sources[key];
  if (!src) throw new Error(`sources.json declares no source "${key}"`);

  let files = new Map();
  let hash = null;

  if (src.type === 'npm') {
    const url = npmTarballUrl(src.package, src.version);
    const got = await download(url, CACHE_DIR, { refresh });
    hash = got.sha256;
    for (const e of readTgz(got.buf)) files.set(e.name, e.data);
  } else if (src.type === 'zip') {
    const got = await download(src.url, CACHE_DIR, { refresh });
    hash = got.sha256;
    if (src.sha256 && src.sha256 !== hash) {
      throw new Error(
        `${key}: upstream bytes changed.\n  manifest sha256 ${src.sha256}\n  download sha256 ${hash}\n`
        + '  Re-pin deliberately with --refresh once you have reviewed the new set.',
      );
    }
    for (const e of readZip(got.buf)) files.set(e.name, e.read());
  } else if (src.type === 'local-files') {
    // Artwork with no upstream archive to rebuild from, committed as files and
    // pinned by a digest over every name and byte, exactly like an archive.
    const dir = join(LIB_DIR, src.dir);
    for (const name of readdirSync(dir).sort()) files.set(name, readFileSync(join(dir, name)));
    hash = localFilesDigest(files);
    if (src.sha256 && src.sha256 !== hash) {
      throw new Error(
        `${key}: committed files changed.\n  manifest sha256 ${src.sha256}\n  files sha256    ${hash}\n`
        + '  Re-pin deliberately once you have reviewed them.',
      );
    }
  } else {
    throw new Error(`${key}: unknown source type "${src.type}"`);
  }

  const opened = { key, src, files, sha256: hash };
  cache.set(key, opened);
  return opened;
}

export const localFilesDigest = (files) => sha256(Buffer.concat(
  [...files].flatMap(([name, buf]) => [Buffer.from(`${name}\0${buf.length}\0`), buf]),
));

// A raster keeps its own aspect: the library and cell sizes fit the 78px
// footprint, floored so a wide lockup is not drawn as a hairline (#76), and
// draw.io is told the aspect is fixed.
function pngArt(buf) {
  const { width, height } = pngSize(buf);
  const cell = fitCell(width, height, ICON_SIZE);
  return {
    data: `data:image/png;base64,${buf.toString('base64')}`, mime: 'image/png', width, height,
    w: cell.width, h: cell.height, aspect: 'fixed',
  };
}

const readText = (opened, path) => {
  const buf = opened.files.get(path);
  if (!buf) throw new Error(`${opened.key}: no file "${path}" in the archive`);
  return buf.toString('utf8');
};

// ------------------------------------------------------------- pack builders

// Verbatim vendor artwork. Nothing here rewrites the SVG: Microsoft and Google
// both permit redistribution for diagrams and both forbid altering the shape.
async function buildVendorZipPack(pack, manifest, cache) {
  const entries = [];
  const bySlug = new Map();
  // "other" and "general" are Azure's overflow folders; a service that also
  // appears in a named category should be credited to the named one.
  const groupRank = (g) => (/^(other|general)$/i.test(g) ? 1 : 0);
  // Google publishes "Vertex AI" and "vertexai" for the same product, so the
  // duplicate check ignores word breaks entirely.
  const dedupeKey = (slug) => slug.replace(/-/g, '');
  const firstTierWins = pack.dedupe === 'first-tier-wins';
  // Google's legacy archive sometimes uses a different name for a product the
  // current set already ships ("google_kubernetes_engine" is today's "GKE").
  // The old name survives as an alias on the current icon, not as a second one.
  const supersedes = pack.supersedes ?? {};
  const inherited = new Map();

  for (const spec of pack.sources) {
    const opened = await openSource(spec.source, manifest, cache);
    const re = new RegExp(spec.include);
    for (const [path, buf] of opened.files) {
      const m = re.exec(path.replace(/\\/g, '/'));
      if (!m) continue;
      const group = m.groups?.group ?? '';
      const file = m.groups?.file ?? basename(path).replace(/\.(svg|png)$/i, '');
      const raw = spec.titleFrom === 'gcp-dirname' ? group
        : spec.titleFrom === 'aws-filename' ? file
          : file.replace(/^\d+\s*-icon-service-/, '');
      // Amazon's file names already carry the casing people write ("AWS IoT
      // Greengrass"), which prettyTitle would flatten, and they are the captions
      // the old palette used - so every current title and id stays as it was.
      const title = spec.titleFrom === 'aws-filename'
        ? raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
        : prettyTitle(raw);
      const slug = slugify(raw);
      const art = /\.png$/i.test(path) ? pngArt(buf) : { svg: buf.toString('utf8') };
      const candidate = {
        slug, title, ...art, group, tier: spec.tier ?? null,
        source: spec.source, upstreamPath: path, rank: groupRank(group),
        payload: sha256(buf),
      };
      if (supersedes[slug]) {
        const target = dedupeKey(supersedes[slug]);
        if (!inherited.has(target)) inherited.set(target, []);
        inherited.get(target).push(title, slug);
        continue;
      }
      const key = dedupeKey(slug);
      const seen = bySlug.get(key);
      if (!seen) { bySlug.set(key, candidate); continue; }
      // Google's legacy archive repeats products the current set already
      // covers, in the old branding. The current artwork wins outright.
      if (firstTierWins) continue;
      // Same name, same artwork: one entry, credited to the better folder.
      if (seen.payload === candidate.payload) {
        if (candidate.rank < seen.rank) bySlug.set(key, candidate);
        continue;
      }
      // Same name, different artwork: two genuinely different services that
      // Microsoft happens to have named alike. Keep both, split by folder.
      const alt = `${slug}-${slugify(group)}`;
      if (!bySlug.has(dedupeKey(alt))) {
        // Both copies can sit in the same folder, where "(Compute)" beside a
        // plain "Workspaces" tells a reader nothing. Microsoft's file number is
        // the only thing that tells them apart; the id and the old caption stay (#18).
        const fileNumber = /^(\d+)-/.exec(basename(path))?.[1];
        const sameFolder = seen.group === group && fileNumber;
        bySlug.set(dedupeKey(alt), {
          ...candidate, slug: alt,
          title: sameFolder ? `${title} (${fileNumber})` : `${title} (${prettyTitle(group)})`,
          formerTitles: sameFolder ? [`${title} (${prettyTitle(group)})`] : [],
        });
      }
    }
  }

  // Vendors name services formally; architects do not. aliasExtras carries the
  // household names ("blob storage", "gke") that the formal title never yields.
  // An id a spec may already name survives upstream filing its artwork
  // differently: `renames` moves a built slug, and its title, back onto that id.
  for (const [from, to] of Object.entries(pack.renames ?? {})) {
    const c = bySlug.get(dedupeKey(from));
    if (!c) throw new Error(`${pack.id}: renames names "${from}", which the build did not produce`);
    bySlug.delete(dedupeKey(from));
    bySlug.set(dedupeKey(to.slug), { ...c, slug: to.slug, title: to.title ?? c.title });
  }

  // Microsoft's file names sometimes misspell a service ("Promethus") or run
  // its words together ("VPNClientWindows"). `titles` corrects the caption; the
  // id stays, and the upstream spelling keeps resolving as an alias (#18).
  for (const [slug, title] of Object.entries(pack.titles ?? {})) {
    const c = bySlug.get(dedupeKey(slug));
    if (!c) throw new Error(`${pack.id}: titles names "${slug}", which the build did not produce`);
    if (c.title === title) throw new Error(`${pack.id}: titles gives "${slug}" the caption it already has`);
    bySlug.set(dedupeKey(slug), { ...c, title, formerTitles: [...(c.formerTitles ?? []), c.title] });
  }

  const aliasExtras = pack.aliasExtras ?? {};
  const legacyTitles = pack.legacyTitles ?? {};
  const abbreviations = pack.abbreviations ?? {};
  const legacyAliases = (slug) => (legacyTitles[slug] ? [legacyTitles[slug], ...titleAliases(legacyTitles[slug])] : []);
  for (const c of [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const extra = [...(aliasExtras[c.slug] ?? []), ...(inherited.get(dedupeKey(c.slug)) ?? [])];
    if (/^Azure /.test(c.title)) extra.push(c.title.replace(/^Azure /, ''));
    if (/^Google /.test(c.title)) extra.push(c.title.replace(/^Google /, ''));
    if (/^Cloud /.test(c.title)) extra.push(c.title.replace(/^Cloud /, ''));
    if (/^(Amazon|AWS) /.test(c.title)) extra.push(c.title.replace(/^(Amazon|AWS) /, ''));
    // A caption from an older palette keeps resolving, so a spec written against it still draws.
    extra.push(...legacyAliases(c.slug), ...(abbreviations[c.slug] ?? []), ...(c.formerTitles ?? []));
    const given = aliasSet(c.title, c.slug, ...extra);
    const aliases = withPlurals(given);
    entries.push({
      slug: c.slug, title: c.title, svg: c.svg,
      data: c.data, mime: c.mime, width: c.width, height: c.height, w: c.w, h: c.h, aspect: c.aspect,
      aliases, generatedAliases: aliases.filter((a) => !given.includes(a)),
      source: `${c.source}`, upstreamId: c.upstreamPath, render: 'verbatim',
      group: c.group, tier: c.tier,
    });
  }

  // `duplicates` keeps an id that once named a second copy of a service. It now
  // carries the same artwork and title as the id it duplicated.
  for (const [id, of] of Object.entries(pack.duplicates ?? {})) {
    const original = entries.find((e) => e.slug === of);
    if (!original) throw new Error(`${pack.id}: duplicates points "${id}" at "${of}", which the build did not produce`);
    entries.push({ ...original, slug: id, aliases: [...new Set([...original.aliases, ...aliasSet(...legacyAliases(id))])] });
  }
  return entries.sort((a, b) => a.slug.localeCompare(b.slug));
}


async function buildBrandEntries(icons, manifest, cache) {
  const out = [];
  for (const icon of icons) {
    if (icon.file) {
      // Official artwork committed byte-for-byte in a local-files source whose
      // licence covers it (#11). A wordmark or lockup keeps its own aspect: the
      // cell fits 78px on its longest side, the way a raster's does.
      const opened = await openSource(icon.source, manifest, cache);
      // A project that publishes its logo only as a raster ships that raster (#20).
      if (/\.png$/i.test(icon.file)) {
        const buf = opened.files.get(icon.file);
        if (!buf) throw new Error(`${icon.slug}: ${icon.source} has no file "${icon.file}"`);
        out.push({
          slug: icon.slug, title: icon.title, ...pngArt(buf),
          aliases: withShortName(icon.aliases, icon.title),
          source: icon.source, upstreamId: icon.upstreamUrl ?? icon.file, render: 'verbatim',
        });
        continue;
      }
      const svg = readText(opened, icon.file);
      const [, , width, height] = viewBoxOf(svg);
      const cell = fitCell(width, height, ICON_SIZE);
      out.push({
        slug: icon.slug, title: icon.title, svg,
        aliases: withShortName(icon.aliases, icon.title),
        source: icon.source, upstreamId: icon.upstreamUrl ?? icon.file, render: 'verbatim',
        width: Math.round(width), height: Math.round(height),
        w: cell.width, h: cell.height, aspect: 'fixed',
      });
      continue;
    }
    if (icon.deviconName) {
      const opened = await openSource('devicon', manifest, cache);
      const path = `icons/${icon.deviconName}/${icon.deviconName}-${icon.deviconVariant}.svg`;
      const svgText = readText(opened, path);
      // A devicon `original` is full-colour artwork and ships verbatim, only
      // resized. A mark with no paint of its own is flagged `"paint": "tint"`
      // in sources.json and filled with its brand colour (#31): a recorded
      // decision per icon, never inferred from the variant's name.
      if (icon.paint !== undefined && icon.paint !== 'tint') {
        throw new Error(`${icon.slug}: unknown paint "${icon.paint}" (the only one is "tint")`);
      }
      let painted;
      try {
        painted = icon.paint === 'tint'
          ? tintUnpaintedMark(svgText, icon.hex)
          : { svg: sizedSvg(svgText), render: 'verbatim-colour' };
      } catch (error) {
        throw new Error(`${icon.slug} (${path}): ${error.message}`);
      }
      out.push({
        slug: icon.slug, title: icon.title, svg: painted.svg,
        aliases: withShortName(icon.aliases, icon.title),
        source: icon.source, upstreamId: path, render: painted.render,
        ...(painted.render === 'tinted' ? { hex: icon.hex } : {}),
      });
      continue;
    }
    const opened = await openSource('simple-icons', manifest, cache);
    const svgText = readText(opened, `icons/${icon.slug}.svg`);
    const { svg, render } = paintMark(svgText, icon.hex);
    out.push({
      slug: icon.slug, title: icon.title, svg,
      aliases: withShortName(icon.aliases, icon.title),
      source: icon.source, upstreamId: icon.slug, render, hex: icon.hex,
    });
  }
  return out;
}

async function buildTileEntries(tiles, manifest, cache) {
  const opened = await openSource(tiles.source, manifest, cache);
  const out = [];
  for (const [concept, glyph] of Object.entries(tiles.concepts)) {
    const path = tiles.source === 'octicons'
      ? `build/svg/${glyph}-24.svg`
      : `icons/${glyph}.svg`;
    const svg = conceptTile(readText(opened, path), {
      tileColour: tiles.tileColour, glyphColour: tiles.glyphColour, style: tiles.style,
    });
    out.push({
      slug: concept, title: prettyTitle(concept.replace(/-/g, ' ')), svg,
      aliases: aliasSet(concept, concept.replace(/-/g, ' '), glyph),
      source: `${opened.src.package}@${opened.src.version}`, upstreamId: path, render: 'tile',
    });
  }
  return out;
}

async function buildSheetEntries(icons, manifest, cache) {
  const out = [];
  for (const icon of icons) {
    const key = icon.kind === 'house' ? 'lucide' : 'simple-icons';
    const opened = await openSource(key, manifest, cache);
    const path = `icons/${icon.glyph}.svg`;
    const svg = fileSheet(readText(opened, path), {
      ext: icon.ext, band: icon.band, colour: `#${icon.hex}`, style: icon.kind === 'house' ? 'stroke' : 'fill',
    });
    out.push({
      slug: icon.ext, title: icon.title, svg,
      // Deliberately not the bare glyph name: "terraform" must reach the
      // product mark in devops, not a .tf document sheet.
      aliases: aliasSet(icon.ext, `${icon.ext} file`, `dot ${icon.ext}`, `${icon.ext} document`, icon.title),
      source: icon.source, upstreamId: path, render: 'sheet',
    });
  }
  return out;
}

// Every remaining Simple Icons mark, so a product no curated pack names is
// still reachable. Ranked last, and labelled, so a weak hit looks weak.
// Upstream alias metadata is generous: Simple Icons lists "Terraform" as an
// alias of OpenTofu, which would put a fork's mark one point behind the real
// thing. Names a curated pack already owns are stripped from the catch-all.
function claimedAliases(manifest) {
  const out = new Set();
  for (const p of manifest.packs) {
    if (p.id === 'brands') continue;
    for (const i of (p.icons ?? [])) {
      if (i.title) { out.add(normalise(i.title)); out.add(normalise(i.title).replace(/ /g, '')); }
      if (i.slug) out.add(i.slug);
      if (i.glyph) out.add(i.glyph);
    }
  }
  return out;
}

async function buildCatchAll(manifest, cache, claimed) {
  const owned = claimedAliases(manifest);
  const opened = await openSource('simple-icons', manifest, cache);
  const data = JSON.parse(readText(opened, 'data/simple-icons.json'));
  const REPL = { '+': 'plus', '.': 'dot', '&': 'and', đ: 'd', ħ: 'h', ı: 'i', ĸ: 'k', ŀ: 'l', ł: 'l', ß: 'ss', ŧ: 't', ø: 'o' };
  const toSlug = (t) => t.toLowerCase()
    .replace(/[+.&đħıĸŀłßŧø]/g, (c) => REPL[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\d]/g, '');

  const out = [];
  for (const d of data) {
    const slug = d.slug ?? toSlug(d.title);
    if (claimed.has(slug)) continue;
    const svgText = readText(opened, `icons/${slug}.svg`);
    const { svg, render } = paintMark(svgText, d.hex);
    const extra = [...(d.aliases?.aka ?? []), ...(d.aliases?.old ?? [])];
    const aliases = withShortName(aliasSet(d.title, slug, ...extra), d.title)
      .filter((a) => !owned.has(a));
    if (!aliases.length) continue; // nothing left that a curated pack does not already own
    out.push({
      slug, title: d.title, svg, aliases,
      source: `simple-icons@${opened.src.version}`, upstreamId: slug, render, hex: d.hex,
    });
  }
  return out;
}

// ------------------------------------------------------------------ assemble

async function buildPack(pack, manifest, cache, claimed) {
  let entries;
  switch (pack.builder) {
    case 'zip-tree':
      entries = await buildVendorZipPack(pack, manifest, cache);
      break;
    case 'brand-marks':
      entries = await buildBrandEntries(pack.icons, manifest, cache);
      break;
    case 'brand-marks+tiles':
      entries = [
        ...await buildBrandEntries(pack.icons, manifest, cache),
        ...await buildTileEntries(pack.tiles, manifest, cache),
      ];
      break;
    case 'tiles':
      entries = await buildTileEntries(pack.tiles, manifest, cache);
      break;
    case 'sheets':
      entries = await buildSheetEntries(pack.icons, manifest, cache);
      break;
    case 'brand-marks-all':
      entries = await buildCatchAll(manifest, cache, claimed);
      break;
    default:
      throw new Error(`${pack.id}: unknown builder "${pack.builder}"`);
  }

  refuseMalformedSvg(pack.id, entries);
  refuseWhiteMarks(pack.id, entries);
  const file = join(LIB_DIR, `${pack.id}.drawio`);
  const libEntries = entries.map((e) => ({
    data: e.data ?? dataUri(e.svg),
    w: e.w ?? ICON_SIZE,
    h: e.h ?? ICON_SIZE,
    title: e.title,
    aspect: e.aspect,
  }));
  const fileHash = writeLibrary(file, libEntries);

  const titleCount = new Map();
  for (const e of entries) titleCount.set(e.title, (titleCount.get(e.title) ?? 0) + 1);

  const icons = entries.map((e, index) => {
    const payload = e.data ?? dataUri(e.svg);
    const bytes = Buffer.from(payload.slice(payload.indexOf(',') + 1), 'base64');
    return {
      ...(titleCount.get(e.title) > 1 ? { ambiguousTitle: true } : {}),
      id: `${pack.id}/${e.slug}`,
      pack: pack.id,
      title: e.title,
      aliases: e.aliases,
      // Which aliases withPlurals invented. find-icon will not act unattended on
      // one of these when the title is a single word.
      ...(e.generatedAliases?.length ? { generatedAliases: e.generatedAliases } : {}),
      source: e.source,
      upstreamId: e.upstreamId,
      licence: licenceOf(e.source, manifest),
      render: e.render,
      // The colour the builder painted, whichever package the mark came from (#31).
      ...(PAINTED.has(e.render) ? { hex: e.hex } : {}),
      mime: e.mime ?? 'image/svg+xml',
      width: e.width ?? ICON_SIZE,
      height: e.height ?? ICON_SIZE,
      sha256: e.sha256 ?? sha256(bytes),
      bytes: 'committed',
      libraryIndex: index,
    };
  });

  return { pack, file, fileHash, icons, count: entries.length };
}

function licenceOf(source, manifest) {
  for (const [key, src] of Object.entries(manifest.sources)) {
    if (key === source) return src.licence;
    if (src.package && source === `${src.package}@${src.version}`) return src.licence;
  }
  return 'see sources.json';
}

// Only an entry with a pinned artwork file gets a fetch command. The rest have
// nothing a command can download - a press kit, a request form, no logo at all
// - and say so, so an agent branches on `artwork` instead of running a
// placeholder URL (#84).
function onDemandEntries(pack) {
  return (pack.onDemand ?? []).map((o) => ({
    id: `${pack.id}/${o.slug}`,
    pack: pack.id,
    title: o.title,
    aliases: o.aliases,
    source: o.source,
    upstreamId: o.slug,
    ...(o.upstreamUrl ? { upstreamUrl: o.upstreamUrl } : {}),
    ...(o.brandUrl ? { brandUrl: o.brandUrl } : {}),
    licence: o.licence,
    ...(o.licenceUrl ? { licenceUrl: o.licenceUrl } : {}),
    bytes: 'on-demand',
    reason: o.reason,
    ...(o.upstreamUrl
      ? { artwork: 'pinned', fetch: `node scripts/fetch-logo.mjs --url ${o.upstreamUrl} --name ${o.slug}` }
      : { artwork: 'none pinned' }),
  }));
}

export async function buildAll(only = null, { quiet = false } = {}) {
  const manifest = loadManifest();
  const cache = new Map();
  mkdirSync(CACHE_DIR, { recursive: true });

  // Curated packs claim their slugs before the catch-all runs, so a mark never
  // appears twice and `brands/docker` cannot shadow `devops/docker`.
  const claimed = new Set();
  for (const p of manifest.packs) {
    for (const i of (p.icons ?? [])) {
      if (i.slug) claimed.add(i.slug);
      // A file-type sheet is the home for .json and .yaml; the bare mark in the
      // catch-all would only ever tie with it.
      if (i.glyph && i.kind === 'brand-glyph') claimed.add(i.glyph);
    }
  }

  const targets = only ? manifest.packs.filter((p) => p.id === only) : manifest.packs;
  if (only && !targets.length) throw new Error(`sources.json declares no pack "${only}"`);

  const built = [];
  for (const pack of targets) {
    const t0 = Date.now();
    const res = await buildPack(pack, manifest, cache, claimed);
    built.push(res);
    if (!quiet) {
      console.log(`  ${pack.id.padEnd(26)} ${String(res.count).padStart(5)} icons  `
        + `${(Buffer.byteLength(readFileSync(res.file)) / 1048576).toFixed(2)} MB  ${Date.now() - t0} ms`);
    }
  }

  const sourceHashes = {};
  for (const [key, opened] of cache) sourceHashes[key] = opened.sha256;
  return { manifest, built, sourceHashes };
}

function writeCatalog(manifest, built, sourceHashes) {
  const byId = new Map(built.map((b) => [b.pack.id, b]));
  const icons = [];
  const packs = [];

  for (const pack of manifest.packs) {
    const b = byId.get(pack.id);
    if (!b) continue;
    icons.push(...b.icons, ...onDemandEntries(pack));
    packs.push({
      id: pack.id,
      title: pack.title,
      description: pack.description,
      rank: pack.rank,
      file: `${pack.id}.drawio`,
      count: b.count,
      onDemand: (pack.onDemand ?? []).length,
      onDemandPinned: (pack.onDemand ?? []).filter((o) => o.upstreamUrl).length,
      sha256: b.fileHash,
      ...(pack.note ? { note: pack.note } : {}),
    });
  }

  // A discontinued, renamed or absorbed product still resolves by its name; the
  // catalog carries the fact so a search can say so (#83). A status naming a
  // successor id that is not catalogued is refused, not left to dangle.
  const ids = new Set(icons.map((i) => i.id));
  const lifecycle = [];
  for (const pack of manifest.packs) {
    for (const entry of [...(pack.icons ?? []), ...(pack.onDemand ?? [])]) {
      if (!entry.status) continue;
      const id = `${pack.id}/${entry.slug}`;
      lifecycle.push(...statusProblems(id, entry.status));
      if (entry.status.successorId && !ids.has(entry.status.successorId)) {
        lifecycle.push(`${id}: status.successorId "${entry.status.successorId}" is not in the catalog`);
      }
      const row = icons.find((i) => i.id === id);
      if (row) row.status = entry.status;
      else lifecycle.push(`${id}: has a status but did not build`);
    }
  }
  if (lifecycle.length) throw new Error(`lifecycle status problems, nothing written:\n  ${lifecycle.join('\n  ')}`);

  // A vendor can ship one file under several names: azure/groups and
  // azure/my-customers are the same picture. Every id stays, and each names
  // the others, so two concepts are never drawn with one icon unnoticed (#77).
  const byPayload = new Map();
  for (const i of icons.filter((row) => row.bytes === 'committed')) {
    byPayload.set(i.sha256, [...(byPayload.get(i.sha256) ?? []), i]);
  }
  for (const group of byPayload.values()) {
    if (group.length < 2) continue;
    for (const i of group) i.sameArtworkAs = group.filter((other) => other !== i).map((other) => other.id);
  }

  const sources = {};
  for (const [key, src] of Object.entries(manifest.sources)) {
    sources[key] = {
      ...(src.package ? { package: `${src.package}@${src.version}` } : {}),
      ...(src.url ? { url: src.url } : {}),
      terms: src.terms,
      licence: src.licence,
      ...(src.licenceUrl ? { licenceUrl: src.licenceUrl } : {}),
      ...(src.permission ? { permission: src.permission } : {}),
      ...(sourceHashes[key] && sourceHashes[key] !== 'local' ? { archiveSha256: sourceHashes[key] } : {}),
    };
  }

  const catalog = {
    generated: new Date().toISOString(),
    version: 2,
    note: 'Metadata only. Image payloads live in assets/libraries/<pack>.drawio and are read '
      + 'by libraryIndex, so a search never pulls base64 into the caller context.',
    manifest: { file: 'assets/libraries/sources.json', sha256: sha256(readFileSync(MANIFEST_FILE)) },
    sources,
    packs,
    counts: {
      packs: packs.length,
      total: icons.length,
      committed: icons.filter((i) => i.bytes === 'committed').length,
      onDemand: icons.filter((i) => i.bytes === 'on-demand').length,
    },
    icons,
  };
  mkdirSync(REF_DIR, { recursive: true });
  writeFileSync(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  return catalog;
}

// -------------------------------------------------------------------- verify

// null for a raster; for an SVG, null only when its data URI is base64 and its
// bytes are a well-formed SVG document a browser will draw.
export function svgPayloadProblem(uri) {
  if (!/^data:image\/svg\+xml[;,]/.test(uri)) return null;
  const m = /^data:image\/svg\+xml;base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri);
  return m ? svgBytesProblem(Buffer.from(m[1], 'base64')) : 'not a base64 data URI';
}

// A payload that is not a well-formed SVG document paints nothing in Draw.io,
// yet it has a title, a size and a digest, so it passes every structural check
// (#29, #33). The whole pack is refused before a byte is written, naming every
// bad entry rather than the first.
export function refuseMalformedSvg(packId, entries) {
  const bad = entries.flatMap((e) => {
    const problem = svgPayloadProblem(e.data ?? dataUri(e.svg));
    return problem ? [`${packId}/${e.slug}: ${problem}`] : [];
  });
  if (bad.length) {
    throw new Error(`${packId}: ${bad.length} malformed SVG payload${bad.length === 1 ? '' : 's'}, nothing written:\n  ${bad.join('\n  ')}`);
  }
}

const svgTextOf = (uri) => {
  const m = /^data:image\/svg\+xml;base64,(.*)$/.exec(uri);
  return m ? Buffer.from(m[1], 'base64').toString('utf8') : null;
};

// A project that publishes light and dark logos can hand over the wrong half,
// and its file names are no guide: mem0's white-ink file passed every check
// above and drew an empty tile (#85). Refused the same way, every entry named.
export function refuseWhiteMarks(packId, entries) {
  const bad = entries.flatMap((e) => {
    const svg = svgTextOf(e.data ?? dataUri(e.svg));
    return svg && paintsOnlyWhite(svg) ? [`${packId}/${e.slug}${e.upstreamId ? ` (${e.upstreamId})` : ''}`] : [];
  });
  if (bad.length) {
    throw new Error(`${packId}: every paint is white in ${bad.length} mark${bad.length === 1 ? '' : 's'}, so `
      + `${bad.length === 1 ? 'it' : 'they'} will not draw on a light canvas. Ship the light-background variant. `
      + `Nothing written:\n  ${bad.join('\n  ')}`);
  }
}

// Rebuilds every pack in memory and compares the result with what is committed.
// A mismatch means the libraries and the manifest have drifted apart.
export async function verify() {
  const manifest = loadManifest();
  const checks = [];
  const ok = (name, pass, detail) => checks.push({ name, pass, detail: detail ?? '' });

  const catalogExists = existsSync(CATALOG_FILE);
  ok('catalog present', catalogExists, CATALOG_FILE);
  if (!catalogExists) return checks;

  const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
  ok('catalog built from this manifest',
    catalog.manifest?.sha256 === sha256(readFileSync(MANIFEST_FILE)),
    catalog.manifest?.sha256?.slice(0, 12) ?? 'missing');

  for (const p of catalog.packs) {
    const file = join(LIB_DIR, p.file);
    if (!existsSync(file)) { ok(`${p.id}: library present`, false, p.file); continue; }
    const actual = sha256(readFileSync(file));
    ok(`${p.id}: library matches catalog sha256`, actual === p.sha256, actual.slice(0, 12));
    const entries = readLibrary(file);
    ok(`${p.id}: ${p.count} entries`, entries.length === p.count, String(entries.length));
    const catIcons = catalog.icons.filter((i) => i.pack === p.id && i.bytes === 'committed');
    const aligned = catIcons.every((i) => entries[i.libraryIndex]?.title === i.title);
    ok(`${p.id}: catalog indices line up with the library`, aligned);
    const malformed = entries.flatMap((e) => {
      const problem = e.dataUri ? svgPayloadProblem(e.dataUri) : null;
      return problem ? [`${e.index} ${e.title}: ${problem}`] : [];
    });
    ok(`${p.id}: every SVG payload is well-formed`, malformed.length === 0,
      malformed.length ? `${malformed.length} malformed - ${malformed.slice(0, 3).join('; ')}` : '');
    const white = entries.filter((e) => {
      const svg = e.dataUri && svgTextOf(e.dataUri);
      return svg && paintsOnlyWhite(svg);
    });
    ok(`${p.id}: no mark paints only white`, white.length === 0,
      white.length ? `${white.length} - ${white.slice(0, 3).map((e) => `${e.index} ${e.title}`).join('; ')}` : '');
  }

  const ids = catalog.icons.map((i) => i.id);
  ok('every catalog id is unique', new Set(ids).size === ids.length,
    `${ids.length - new Set(ids).size} duplicates`);
  const noBytes = catalog.icons.filter((i) => i.bytes === 'on-demand');
  ok('no on-demand entry carries a library index',
    noBytes.every((i) => i.libraryIndex === undefined), `${noBytes.length} on-demand`);

  return checks;
}

// ----------------------------------------------------------------------- cli

async function main(argv) {
  const mode = argv[0] ?? '--list';

  if (mode === '--list') {
    const m = loadManifest();
    console.log(`${m.packs.length} packs declared in ${MANIFEST_FILE}\n`);
    for (const p of m.packs) {
      const n = (p.icons?.length ?? 0) + Object.keys(p.tiles?.concepts ?? {}).length;
      console.log(`  ${p.id.padEnd(26)} rank ${String(p.rank).padStart(2)}  `
        + `${p.builder.padEnd(18)} ${n ? `${n} listed` : 'whole source'}`
        + `${p.onDemand?.length ? `  (+${p.onDemand.length} on-demand)` : ''}`);
    }
    return;
  }

  if (mode === '--verify') {
    const checks = await verify();
    let failed = 0;
    for (const c of checks) {
      if (!c.pass) failed++;
      console.log(`${c.pass ? 'ok  ' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
    }
    console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
    process.exit(failed ? 1 : 0);
  }

  if (mode === '--refresh') {
    const key = argv[1];
    if (!key) { console.error('usage: build-packs.mjs --refresh <source key>'); process.exit(2); }
    const manifest = loadManifest();
    const src = manifest.sources[key];
    if (!src) { console.error(`no source "${key}" in sources.json`); process.exit(1); }
    const url = src.type === 'npm' ? npmTarballUrl(src.package, src.version) : src.url;
    const got = await download(url, CACHE_DIR, { refresh: true });
    console.log(`${key}\n  url    ${url}\n  sha256 ${got.sha256}`);
    if (src.sha256 && src.sha256 !== got.sha256) {
      console.log(`  DRIFT  manifest pins ${src.sha256}`);
      console.log('  The upstream changed. Review the new set, then update sources.json deliberately.');
      process.exit(1);
    }
    console.log('  matches the manifest pin');
    return;
  }

  // One-off: shrink a vendor raster to twice the size it is drawn at, keeping its
  // aspect. How the AgentCore feature marks in local/aws-agentcore were made from
  // the ~1024px PNGs Amazon published (#7).
  if (mode === '--downscale-png') {
    const [input, output] = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--max');
    const max = Number(argv.includes('--max') ? argv[argv.indexOf('--max') + 1] : ICON_SIZE * 2);
    if (!input || !output || !(max > 0)) {
      console.error('usage: build-packs.mjs --downscale-png <in.png> <out.png> [--max 156]');
      process.exit(2);
    }
    const before = readFileSync(input);
    const after = downscalePng(before, max);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, after);
    const { width, height } = pngSize(after);
    console.log(`${basename(output)}  ${(before.length / 1024).toFixed(0)} KB -> ${(after.length / 1024).toFixed(1)} KB  (${width}x${height})`);
    return;
  }

  // Exit 0: checked, nothing found. 1: findings, written to --report if given.
  // 2: the check itself failed - distinct, so a network error never opens an issue.
  if (mode === '--check-upstream' || mode === '--check-drift') {
    const reportFile = argv.includes('--report') ? argv[argv.indexOf('--report') + 1] : null;
    let findings;
    let report;
    try {
      const manifest = loadManifest();
      const catalog = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
      if (mode === '--check-upstream') {
        const r = await checkSimpleIcons({ catalog, manifest });
        console.log(`simple-icons  pinned ${r.pinned}, latest ${r.latest}, ${r.shipped} slugs shipped`);
        console.log(`  removed upstream  ${r.removed.length}${r.removed.length ? `  ${r.removed.map((m) => m.slug).join(', ')}` : ''}`);
        console.log(`  renamed upstream  ${r.renamed.length}${r.renamed.length ? `  ${r.renamed.map((m) => `${m.slug}->${m.to}`).join(', ')}` : ''}`);
        findings = r.removed.length > 0;
        report = removalReport(r);
      } else {
        const rows = await checkDrift({ catalog, manifest });
        for (const row of rows) {
          const state = row.note ? 'skip ' : row.drifted ? 'DRIFT' : 'ok   ';
          const detail = row.note
            ?? (row.kind === 'lifecycle' ? `${row.recorded} product statuses, ${row.stale.length} due for a re-check` : null)
            ?? (row.checks ? row.checks.map((c) => (c.state === 'ok' ? c.what : `${c.what} ${c.state.toUpperCase()}`)).join(', ')
              : `pinned ${String(row.pinned).slice(0, 12)}  upstream ${String(row.current).slice(0, 12)}`);
          console.log(`  ${state}  ${row.key.padEnd(20)} ${detail}`);
        }
        findings = rows.some((row) => row.drifted);
        report = driftReport(rows);
      }
    } catch (err) {
      console.error(`upstream check failed: ${err.message}`);
      process.exit(2);
    }
    if (findings && reportFile) writeFileSync(reportFile, report);
    process.exit(findings ? 1 : 0);
  }

  if (mode === '--all' || mode === '--pack') {
    const only = mode === '--pack' ? argv[1] : null;
    if (mode === '--pack' && !only) { console.error('usage: build-packs.mjs --pack <id>'); process.exit(2); }
    console.log(only ? `building ${only}` : 'building all packs');
    const { manifest, built, sourceHashes } = await buildAll(only);

    if (only) {
      console.log('\nBuilt one pack; the catalog is only rewritten by --all.');
      return;
    }
    const catalog = writeCatalog(manifest, built, sourceHashes);
    console.log(`\ncatalog: ${catalog.counts.total} entries `
      + `(${catalog.counts.committed} committed, ${catalog.counts.onDemand} on-demand) `
      + `across ${catalog.counts.packs} packs`);
    console.log(`         -> ${CATALOG_FILE}`);
    return;
  }

  console.error('usage: build-packs.mjs [--list|--all|--pack <id>|--verify|--refresh <source>|'
    + '--check-upstream [--report <file>]|--check-drift [--report <file>]|--downscale-png <in> <out> [--max N]]');
  process.exit(2);
}

if (process.argv[1] && process.argv[1].endsWith('build-packs.mjs')) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`\nbuild failed: ${err.message}`);
    process.exit(1);
  });
}
