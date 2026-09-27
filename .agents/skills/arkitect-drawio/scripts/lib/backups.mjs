// Shared backup naming and retention for both diagram engines.

import { existsSync, copyFileSync, readdirSync, statSync, unlinkSync, constants } from 'node:fs';
import { dirname, join, basename, extname } from 'node:path';

// A backup is created exclusively and never replaces an earlier one. Two updates
// inside the same second get `-1`, `-2`, ... instead of the second copy
// overwriting the first, which is how the original used to be lost (#35). The
// counter continues from the highest one already used that second instead of
// filling a gap: retention deletes old backups (#49), and a reused low counter
// would make the newest copy sort among the oldest and be pruned at once.
// `now` exists so a test can pin the clock.
const MAX_BACKUPS_PER_SECOND = 1000;
const quoteRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function backupExisting(path, { now = new Date() } = {}) {
  if (!existsSync(path)) return null;
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
  const ext = extname(path);
  const name = `${basename(path, ext)}.backup-${stamp}`;
  const sameSecond = new RegExp(`^${quoteRe(name)}(?:-([1-9]\\d*))?${quoteRe(ext)}$`);
  let first = 0;
  for (const entry of readdirSync(dirname(path))) {
    const m = sameSecond.exec(entry);
    if (m) first = Math.max(first, Number(m[1] ?? 0) + 1);
  }
  for (let n = first; n < MAX_BACKUPS_PER_SECOND; n++) {
    const backup = join(dirname(path), `${name}${n ? `-${n}` : ''}${ext}`);
    try {
      copyFileSync(path, backup, constants.COPYFILE_EXCL);
      return backup;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error(`no free backup name for ${path}: ${MAX_BACKUPS_PER_SECOND} already exist for ${stamp}`);
}

// Retention (#49). Every rebuild leaves a backup, so a build-look-fix loop used
// to leave ten or twenty beside the user's diagram. After a successful write
// the builder keeps the newest `keep` backups of that target plus the oldest -
// usually the person's own version from before an agent started - and deletes
// the rest. Only names backupExisting writes for this exact target count
// (`<stem>.backup-YYYYMMDD-HHMMSS[-n]<ext>`); nothing else is ever touched.
// `keep: 0` keeps everything. Returns the deleted paths.
export const DEFAULT_KEEP_BACKUPS = 5;

export function pruneBackups(path, { keep = DEFAULT_KEEP_BACKUPS } = {}) {
  if (!Number.isSafeInteger(keep) || keep < 0) throw new TypeError(`keep must be a non-negative whole number, got ${keep}`);
  const dir = dirname(path);
  if (keep === 0 || !existsSync(dir)) return [];
  const ext = extname(path);
  const own = new RegExp(`^${quoteRe(basename(path, ext))}\\.backup-(\\d{8}-\\d{6})(?:-([1-9]\\d*))?${quoteRe(ext)}$`);
  const backups = readdirSync(dir)
    .map((name) => { const m = own.exec(name); return m && { name, stamp: m[1], n: Number(m[2] ?? 0) }; })
    .filter(Boolean)
    // By name, not mtime: the stamp is UTC and the collision counter counts up,
    // so `-10` is newer than `-2` although it sorts before it as text.
    .sort((a, b) => (a.stamp < b.stamp ? -1 : a.stamp > b.stamp ? 1 : a.n - b.n));
  const pruned = [];
  for (const { name } of backups.slice(1, Math.max(1, backups.length - keep))) {
    const doomed = join(dir, name);
    try {
      if (!statSync(doomed).isFile()) continue;
      unlinkSync(doomed);
      pruned.push(doomed);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return pruned;
}

// The builders back up for you. A hand edit, a script or an MCP set_page does
// not, and "call backupExisting() or copy the file yourself" is two choices and
// an import - so the same protection is one command (#179). Both engines'
// scripts/backup.mjs are three lines over this.
const USAGE = `usage: backup.mjs <file>... [--keep-backups N]

Copies each file beside itself as <stem>.backup-YYYYMMDD-HHMMSS<ext> before you
edit it, then keeps the oldest backup of that file plus the newest N (default
${DEFAULT_KEEP_BACKUPS}; 0 keeps all) and deletes the rest. Prints each backup written.`;

export function backupCli(argv) {
  const files = [];
  let keep = DEFAULT_KEEP_BACKUPS;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') { console.log(USAGE); return 0; }
    if (arg === '--keep-backups') keep = Number(argv[++i]);
    else if (arg.startsWith('-')) { console.error(`unknown option: ${arg}`); console.error(USAGE); return 2; }
    else files.push(arg);
  }
  if (!files.length) { console.error(USAGE); return 2; }
  // Like the builders: a malformed count fails before anything is copied or
  // deleted, rather than halfway through the list (#49).
  if (!Number.isSafeInteger(keep) || keep < 0) {
    console.error(`--keep-backups must be a non-negative whole number, got ${keep}`);
    return 2;
  }
  const missing = files.filter((f) => !existsSync(f));
  if (missing.length) {
    for (const f of missing) console.error(`no such file: ${f}`);
    return 1;
  }
  for (const file of files) {
    console.log(backupExisting(file));
    const pruned = pruneBackups(file, { keep });
    if (pruned.length) console.log(`pruned ${pruned.length} older backup${pruned.length > 1 ? 's' : ''}`);
  }
  return 0;
}
