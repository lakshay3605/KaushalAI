#!/usr/bin/env node
// Local Draw.io Desktop export. Node 20+, no runtime dependencies or uploads.
// Observed: Draw.io Desktop 29.0.3, Windows x64: --page-index is 1-based;
// both 0 and 1 export the first page (as recorded by render-drawio.ps1).
// Draw.io Desktop 24.7.17, Linux arm64: 0-based; 0 and 1 differ, while 2
// clamps to the last page of a two-page file. These are build observations,
// not platform rules: split pages and omit the unstable flag by default.
import { accessSync, constants, statSync, readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync, copyFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readMxfile } from './lib/drawio-core.mjs';
import { posix, win32, resolve, basename, extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function render(options, { platform = process.platform, env = process.env,
  isExecutable = executable, runner = spawnSync, log = console.log, displayUp = displayReachable } = {}) {
  const source = resolve(options.file);
  let mx;
  try { mx = readMxfile(source); }
  catch (error) { throw new Error(`No such diagram or unreadable input: ${source} (${error.code})`); }
  // Retain support for a standalone graph model (no mxfile wrapper).
  if (!mx.opening && !mx.pages.length) {
    // XML declarations belong only at document level, never inside <diagram>.
    // Strip leading declarations/comments only; keep the graph bytes untouched.
    const text = readFileSync(source, 'utf8').replace(/^(?:\s*(?:<\?xml\s[\s\S]*?\?>|<!--[\s\S]*?-->))*\s*/, '');
    if (/^<mxGraphModel(?=[\s/>])/.test(text)) mx.pages.push({ raw: `<diagram>${text}</diagram>` });
  }
  const count = mx.pages.length;
  if (!count || !Number.isSafeInteger(options.pageIndex) || options.pageIndex < 0 || options.pageIndex >= count) {
    throw new Error(`Page index ${options.pageIndex} is out of range: "${basename(source)}" has ${count} page${count === 1 ? '' : 's'} (0-${count - 1}).`);
  }
  const exe = discoverDrawio(options.drawioExe, { platform, env, isExecutable });
  const xvfb = platform === 'linux' && !displayUp(env.DISPLAY)
    ? pathCandidates('xvfb-run', platform, env).find(isExecutable) : undefined;
  if (xvfb) {
    log(env.DISPLAY ? `DISPLAY ${env.DISPLAY} has no X server here; using xvfb-run -a for local Draw.io export.`
      : 'No DISPLAY; using xvfb-run -a for local Draw.io export.');
  }
  const outDir = resolve(options.outDir);
  mkdirSync(outDir, { recursive: true });

  const indexes = options.all ? Array.from({ length: count }, (_, i) => i) : [options.pageIndex];
  const pages = [];
  for (const index of indexes) {
    const output = join(outDir, `${basename(source, extname(source))}.p${index}.${options.format}`);
    const temporary = options.pageIndexPassthrough ? null : mkdtempSync(join(tmpdir(), 'arkitect-drawio-'));
    try {
      const input = temporary ? join(temporary, 'page.drawio') : source;
      if (temporary) writeFileSync(input, (mx.opening ?? '<mxfile>') + mx.pages[index].raw + '</mxfile>', { mode: 0o600 });
      const args = ['-x', '-f', options.format,
        ...(options.pageIndexPassthrough ? ['--page-index', options.all ? String(index) : (options.rawPageIndex ?? String(index))] : []),
        '--width', String(options.width),
        // Desktop's border defaults to 0, which crops the PNG flush to the
        // drawing, so the legend and the last caption touch its edge (#249).
        ...(options.padding ? ['-b', String(options.padding)] : []),
        '-o', output, input];
      // Linux 24.7.17 misreads --disable-gpu before -x as the input file.
      if (options.disableGpu) args.push('--disable-gpu');
      if (options.noSandbox) args.push('--no-sandbox');
      // Remove stale output only after making a collision-safe sibling backup.
      // A fresh nonempty file, not stderr/exit status or mtime, proves export.
      const backup = backupOutput(output);
      let result;
      try { result = runner(xvfb ?? exe, xvfb ? ['-a', exe, ...args] : args, { env, encoding: 'utf8', shell: false }); }
      catch (error) { result = { error }; }
      let size = 0;
      try { const stat = statSync(output); if (stat.isFile()) size = stat.size; } catch {}
      const ok = size > 0;
      if (!ok && backup) copyFileSync(backup, output);
      // A fresh nonempty export is still the only success signal; stderr is
      // read only on failure, so the log can say why instead of just FAILED.
      const why = ok ? '' : exportFailure(result);
      const reason = why ? ` (${why})` : '';
      log(`${ok ? `rendered page ${index}` : `page ${index} FAILED`} -> ${output} (${size} bytes)${reason}`);
      pages.push({ index, output, size, ok, backup, status: result.status });
    } finally {
      if (temporary) rmSync(temporary, { recursive: true, force: true });
    }
  }
  return { ok: pages.every(p => p.ok), pages };
}


// DISPLAY names a local X server by number. One whose socket is not there - a
// sandbox or container that hides /tmp/.X11-unix, WSLg's :0 inside such a
// sandbox, a stale SSH variable - makes Draw.io exit with "Missing X server",
// so it counts as no display. A remote host:N display is trusted.
export function displayReachable(display, { exists = existsSync } = {}) {
  if (!display) return false;
  const local = /^(?:unix)?:(\d+)(?:\.\d+)?$/.exec(display);
  return local ? exists(`/tmp/.X11-unix/X${local[1]}`) : true;
}

// Why an export produced nothing, in one line: the spawn error, or how the
// process ended and the first thing Draw.io printed that is not D-Bus chatter.
export function exportFailure(result) {
  if (result?.error) return result.error.message;
  const said = String(result?.stderr ?? '').split('\n')
    .map((line) => line.replace(/^\[[^\]]*\]\s*/, '').trim())
    .find((line) => line && !/dbus|StartTransientUnit/i.test(line));
  const ended = result?.signal ? `killed by ${result.signal}`
    : Number.isInteger(result?.status) && result.status !== 0 ? `exit ${result.status}` : '';
  return [ended, said?.slice(0, 200)].filter(Boolean).join(': ');
}

function backupOutput(output) {
  if (!existsSync(output)) return undefined;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  for (let n = 0; ; n++) {
    const backup = `${output}.backup-${stamp}${n ? `-${n}` : ''}`;
    try { copyFileSync(output, backup, constants.COPYFILE_EXCL); }
    catch (error) { if (error.code === 'EEXIST') continue; throw error; }
    unlinkSync(output);
    return backup;
  }
}

function executable(path) {
  try { accessSync(path, process.platform === 'win32' ? constants.F_OK : constants.X_OK); return statSync(path).isFile(); }
  catch { return false; }
}

function pathCandidates(name, platform, env) {
  const windows = platform === 'win32';
  const paths = (env.PATH ?? env.Path ?? '').split(windows ? ';' : ':').filter(Boolean);
  return paths.map(dir => (windows ? win32 : posix).join(dir.replace(/^"|"$/g, ''), name + (windows ? '.exe' : '')));
}

const INSTALL_LOCATIONS = ['/opt/drawio/drawio', '/usr/bin/drawio', '/Applications/draw.io.app/Contents/MacOS/draw.io',
  'C:\\Program Files\\draw.io\\draw.io.exe', 'C:\\Program Files (x86)\\draw.io\\draw.io.exe'];

// Where Draw.io Desktop is and how it was found: `path`, the `source` that won
// (--drawio-exe, DRAWIO_EXE, PATH or an install location), every path `tried`
// in order, and which candidates came from PATH (`onPath`). With no usable
// binary `path` is null and `error` says why. `doctor` reports this, so it can
// never disagree with `render` (#46).
export function locateDrawio(override, { platform = process.platform, env = process.env, isExecutable = executable } = {}) {
  // An explicit override is a pin, not a hint. Page indexing differs between
  // builds, so DRAWIO_EXE / --drawio-exe is how you select the build you mean.
  // Falling through to a different binary would silently render with the wrong
  // build, so an unusable override must fail naming it rather than degrade.
  const explicit = override ?? env.DRAWIO_EXE;
  if (explicit) {
    const source = override ? '--drawio-exe' : 'DRAWIO_EXE';
    return isExecutable(explicit)
      ? { path: explicit, source, tried: [explicit], onPath: [] }
      : { path: null, source, tried: [explicit], onPath: [], error: `Draw.io Desktop ${source} ${explicit} is not executable.` };
  }
  const onPath = [...new Set(pathCandidates('drawio', platform, env))];
  const tried = [];
  for (const candidate of new Set([...onPath, ...INSTALL_LOCATIONS])) {
    tried.push(candidate);
    if (isExecutable(candidate)) return { path: candidate, source: onPath.includes(candidate) ? 'PATH' : 'install location', tried, onPath };
  }
  return { path: null, source: null, tried, onPath,
    error: `Draw.io Desktop not found. Tried:\n${tried.map(p => `  ${p}`).join('\n')}\nInstall Draw.io Desktop or set --drawio-exe / DRAWIO_EXE.` };
}

export function discoverDrawio(override, deps) {
  const found = locateDrawio(override, deps);
  if (!found.path) throw new Error(found.error);
  return found.path;
}

export const USAGE = `usage: render-drawio.mjs <file> [--page-index N] [--all]
  [--width N] [--padding N] [--out-dir DIR] [--format png|jpg|svg|pdf|vsdx|xml|html]
  [--drawio-exe PATH] [--disable-gpu] [--no-sandbox] [--page-index-passthrough]
Page indexes are zero-based; defaults: page 0, width 2200, padding 20, directory ., PNG.
--padding 0 crops flush to the drawing, as Desktop does on its own.
Default export splits pages without decoding/re-encoding their contents.
Debug --page-index-passthrough sends the original file and raw index to Desktop.
Electron flags are opt-in; --no-sandbox disables Chromium sandbox protection.`;

export function parseArgs(args) {
  const options = { file: undefined, pageIndex: 0, all: false, width: 2200, padding: 20,
    outDir: '.', format: 'png', drawioExe: undefined, disableGpu: false, noSandbox: false, pageIndexPassthrough: false };
  const values = { '--page-index': 'pageIndex', '--width': 'width', '--padding': 'padding', '--out-dir': 'outDir', '--format': 'format', '--drawio-exe': 'drawioExe' };
  const switches = { '--all': 'all', '--disable-gpu': 'disableGpu', '--no-sandbox': 'noSandbox', '--page-index-passthrough': 'pageIndexPassthrough' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (Object.hasOwn(switches, arg)) { options[switches[arg]] = true; continue; }
    if (Object.hasOwn(values, arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Expected value for ${arg}`);
      if (arg === '--width' || arg === '--page-index' || arg === '--padding') {
        const n = Number(value);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < (arg === '--width' ? 1 : 0)) {
          throw new Error(`${arg} must be a ${arg === '--width' ? 'positive' : 'non-negative'} integer`);
        }
        options[values[arg]] = n;
        if (arg === '--page-index') options.rawPageIndex = value;
      } else options[values[arg]] = value;
    } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (options.file) throw new Error(`Expected one file\n${USAGE}`);
    else options.file = arg;
  }
  if (!options.file) throw new Error(USAGE);
  if (!['png', 'jpg', 'jpeg', 'svg', 'pdf', 'vsdx', 'xml', 'html'].includes(options.format)) throw new Error('Unsupported format');
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
  if (options?.help) console.log(USAGE);
  else if (options) {
    try { process.exitCode = render(options).ok ? 0 : 1; }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
