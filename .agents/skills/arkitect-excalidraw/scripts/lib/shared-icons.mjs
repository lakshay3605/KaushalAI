// Reuse the committed artwork; never trace, fetch, or copy it into another store.
// The Draw.io reader verifies each payload against its catalog digest.
import { loadCatalog, dataUriFor, resolve, match } from '../../../arkitect-drawio/scripts/find-icon.mjs';
import { decodeDataUrl } from './excalidraw-core.mjs';
import { transparency } from '../make-icon.mjs';

const PREFIX = 'drawio:';
let byRef;
let entries;

function iconsByRef() {
  return byRef ??= new Map(loadCatalog().icons.map((icon) => [PREFIX + icon.id, icon]));
}

export function sharedCatalog() {
  return entries ??= loadCatalog().icons.filter((icon) => icon.bytes === 'committed').map((icon) => ({
    ref: PREFIX + icon.id,
    name: icon.title,
    kind: 'embedded',
    provider: 'drawio',
    library: icon.pack,
    aliases: icon.aliases,
    detail: {
      pack: icon.pack, source: icon.source, licence: icon.licence,
      mime: icon.mime, size: { width: icon.width, height: icon.height },
      sha256: icon.sha256,
      representation: 'embedded original artwork; logo paths are not editable',
    },
  }));
}

export function sharedScore(entry, query) {
  const icon = iconsByRef().get(entry.ref);
  return icon ? match(icon, query, { catalog: loadCatalog() }).strength : 0;
}

export function sharedUnattended(query, candidates = sharedCatalog()) {
  // Include on-demand entries in the judgement: removing an unavailable exact
  // match must not promote a different product. Only committed bytes may draw.
  const result = resolve(query);
  if (!result.confident) return { entry: null, reason: result.reason };
  const entry = candidates.find((e) => e.ref === PREFIX + result.icon.id);
  return entry ? { entry, reason: null }
    : { entry: null, reason: 'the matching shared icon has no committed artwork' };
}

export function resolveSharedRef(ref) {
  // Exact canonical IDs only. No numeric indices, normalization, paths, or search.
  const icon = iconsByRef().get(ref);
  if (!icon || icon.bytes !== 'committed') return null;
  const decoded = decodeDataUrl(dataUriFor(icon));
  if (!decoded || decoded.mime !== icon.mime || decoded.sha256 !== icon.sha256) {
    throw new Error(`shared icon payload mismatch: ${icon.id}`);
  }
  if (!(icon.width > 0 && icon.height > 0 && Number.isFinite(icon.width) && Number.isFinite(icon.height))) {
    throw new Error(`shared icon dimensions invalid: ${icon.id}`);
  }
  const trans = transparency(decoded.mime, decoded.bytes);
  return {
    source: ref, name: icon.title, kind: 'embedded',
    provenance: { pack: icon.pack, source: icon.source, licence: icon.licence, sha256: icon.sha256 },
    entry: { mime: decoded.mime, bytes: decoded.bytes, width: icon.width, height: icon.height,
      transparent: trans.alpha, transparencyNote: trans.note },
  };
}
