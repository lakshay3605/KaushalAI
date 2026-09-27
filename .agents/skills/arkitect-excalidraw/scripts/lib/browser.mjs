// Headless Chromium for PNG previews (#39).
//
// Edge, Chrome or Chromium, whichever is installed: nothing is downloaded and
// nothing leaves the machine. The page rendered is a local SVG inside a
// zero-margin wrapper, in a throwaway profile that is removed afterwards, pass
// or fail. A screenshot counts only once it is on disk, non-empty and starts
// with the PNG signature; Chromium's stderr is not evidence either way.

import { accessSync, constants, statSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, posix, win32 } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { completePng } from './browser-process.mjs';

export { PNG_SIGNATURE } from './browser-process.mjs';
const TIMEOUT = 120000;
// Chromium refuses windows past 16384px, and a PNG that large is not readable anyway.
const MAX_VIEWPORT = 16000;

// On Linux a packaged Chrome or Edge comes before Chromium, and Ubuntu's
// chromium-browser - a wrapper that execs the snap - comes last: the snap cannot
// start inside a sandbox or container ("timeout waiting for snap system
// profiles"), and ci.yml pins Chrome for the same reason (#113).
const PATH_NAMES = {
  win32: ['msedge.exe', 'chrome.exe'],
  posix: ['google-chrome', 'google-chrome-stable', 'microsoft-edge', 'microsoft-edge-stable', 'chromium', 'chromium-browser'],
};

const INSTALL_LOCATIONS = {
  win32: (env) => [env['ProgramFiles(x86)'], env.ProgramFiles, env.LOCALAPPDATA].filter(Boolean).flatMap((root) => [
    win32.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    win32.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    win32.join(root, 'Chromium', 'Application', 'chrome.exe'),
  ]),
  darwin: () => [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: () => [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/microsoft-edge',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium',
  ],
};

function executable(path, platform) {
  try {
    accessSync(path, platform === 'win32' ? constants.F_OK : constants.X_OK);
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

// The browser a PNG render uses, how it was found, and every path tried.
// --browser and ARKITECT_BROWSER are pins, like DRAWIO_EXE: an unusable pin
// fails naming it rather than rendering with some other browser.
export function locateBrowser(override, { platform = process.platform, env = process.env,
  isExecutable = (p) => executable(p, platform) } = {}) {
  const explicit = override ?? env.ARKITECT_BROWSER;
  if (explicit) {
    const source = override ? '--browser' : 'ARKITECT_BROWSER';
    return isExecutable(explicit)
      ? { path: explicit, source, tried: [explicit] }
      : { path: null, source, tried: [explicit], error: `${source} ${explicit} is not executable` };
  }
  const windows = platform === 'win32';
  const dirs = (env.PATH ?? env.Path ?? '').split(windows ? ';' : ':').filter(Boolean);
  const onPath = dirs.flatMap((dir) => PATH_NAMES[windows ? 'win32' : 'posix']
    .map((name) => (windows ? win32 : posix).join(dir.replace(/^"|"$/g, ''), name)));
  const installs = (INSTALL_LOCATIONS[platform] ?? INSTALL_LOCATIONS.linux)(env);
  const tried = [];
  for (const candidate of new Set([...onPath, ...installs])) {
    tried.push(candidate);
    if (isExecutable(candidate)) return { path: candidate, source: onPath.includes(candidate) ? 'PATH' : 'install location', tried };
  }
  return { path: null, source: null, tried, error: 'no Edge, Chrome or Chromium found' };
}

// Where the page, profile and screenshot go. A snap-packaged Chromium - what
// Ubuntu installs, including behind /usr/bin/chromium-browser - gets a private
// /tmp and cannot see the host's, so it would render nothing and write its
// screenshot where we cannot read it. Its own data directory is reachable from
// both sides, so a snap works there; everything else uses the system temp dir.
export function workRootFor(browser, { platform = process.platform, env = process.env,
  readHead = (p) => readFileSync(p).subarray(0, 4096).toString('latin1') } = {}) {
  if (platform !== 'linux' || !env.HOME) return tmpdir();
  let snap = browser.startsWith('/snap/');
  if (!snap) {
    try { snap = /\/snap\/bin\/|\bsnap run\b/.test(readHead(browser)); } catch { snap = false; }
  }
  const name = /^\/snap\/bin\/([\w-]+)/.exec(browser)?.[1] ?? 'chromium';
  return snap ? join(env.HOME, 'snap', name, 'common') : tmpdir();
}

// A complete screenshot ends the job even when Chromium itself stays alive.
// The supervisor owns its process tree and shuts it down before cleanup.
export const runBrowser = (exe, args, options) => {
  const worker = fileURLToPath(new URL('./browser-process.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [worker, exe, JSON.stringify(args), JSON.stringify(options)], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`browser supervisor exited with ${result.status ?? result.signal}: ${result.stderr}`);
  const report = JSON.parse(result.stdout);
  if (report.error) throw Object.assign(new Error(report.error), report);
};

const removeWork = (dir) => rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });

// Lines Chromium prints on every start, failed or not; they would crowd out
// the one that says why (#113).
const NOISE = /crashpad|cpufreq|dbus|StartTransientUnit|Fontconfig/i;

// The last of what the browser printed, for a failure message.
const said = (log) => {
  try {
    const text = readFileSync(log, 'utf8').trim().split('\n')
      .map((line) => line.replace(/^\[[^\]]*\]\s*/, '').trim())
      .filter((line) => line && !NOISE.test(line))
      .slice(-3).join(' | ').slice(-400);
    return text ? ` (browser said: ${text})` : '';
  } catch {
    return '';
  }
};

// Screenshots an SVG document whose root carries its width and height in CSS
// pixels, `width` pixels wide. Returns the PNG bytes and their dimensions, or
// throws saying why. `runner` stands in for the browser in the tests.
export function rasteriseSvg(svg, { browser, width, noSandbox = false, runner = runBrowser, timeout = TIMEOUT, workRoot = tmpdir(), remove = removeWork }) {
  const size = /<svg\b[^>]*?\swidth="([\d.]+)"[^>]*?\sheight="([\d.]+)"/.exec(svg);
  if (!size) throw new Error('the SVG carries no width and height to size the screenshot by');
  const w = Math.max(1, Math.ceil(Number(size[1])));
  const h = Math.max(1, Math.ceil(Number(size[2])));
  // The SVG is drawn as a vector at the output size, in a window of that size at
  // scale factor 1. Shrinking with --force-device-scale-factor instead is
  // clamped by some builds (snap Chromium would not go below 0.5), which
  // silently gave a PNG wider than asked.
  const outH = Math.max(1, Math.round((h * width) / w));
  if (width > MAX_VIEWPORT || outH > MAX_VIEWPORT) {
    throw new Error(`a ${width}x${outH}px screenshot is past Chromium's ${MAX_VIEWPORT}px limit; use a smaller --width`);
  }
  mkdirSync(workRoot, { recursive: true });
  const work = mkdtempSync(join(workRoot, 'arkitect-render-'));
  try {
    const svgPath = join(work, 'scene.svg');
    const page = join(work, 'page.html');
    const shot = join(work, 'shot.png');
    const browserLog = join(work, 'browser.log');
    writeFileSync(svgPath, svg);
    // Chromium puts an 8px body margin round a bare SVG, shifting and clipping it.
    writeFileSync(page, '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}img{display:block}</style>'
      + `<img src="${pathToFileURL(svgPath).href}" width="${width}" height="${outH}">`);
    const args = [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
      '--disable-crash-reporter', '--force-device-scale-factor=1',
      // Nothing that waits on the outside world: on macOS CI, Chrome started its
      // updater and never exited. The same set headless automation tools pass.
      '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--disable-sync',
      '--no-service-autorun', '--password-store=basic', '--use-mock-keychain', `--user-data-dir=${join(work, 'profile')}`,
      `--window-size=${width},${outH}`, `--screenshot=${shot}`,
      ...(noSandbox ? ['--no-sandbox'] : []),
      pathToFileURL(page).href,
    ];
    try {
      runner(browser, args, { timeout, log: browserLog, screenshot: shot });
    } catch (error) {
      const timedOut = error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM';
      const reason = timedOut ? `the browser timed out after ${timeout / 1000}s` : `the browser failed: ${String(error.message).split('\n')[0]}`;
      throw new Error(`${reason}${said(browserLog)}`);
    }
    let bytes;
    try { bytes = readFileSync(shot); } catch { throw new Error(`the browser exited without writing a screenshot${said(browserLog)}`); }
    if (!completePng(bytes)) {
      throw new Error('the screenshot is empty or not a PNG, or is incomplete');
    }
    return { bytes, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  } finally {
    // Best effort, with retries: a helper slow to let go of the profile must
    // never turn a screenshot already in hand into a failed render.
    try { remove(work); } catch { /* nothing more can be done from here */ }
  }
}
