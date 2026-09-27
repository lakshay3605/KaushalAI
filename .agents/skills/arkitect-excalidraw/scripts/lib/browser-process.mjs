// Async browser supervision in a child Node process keeps the render API
// synchronous without waiting for Chromium's background services to exit.
import { spawn, spawnSync } from 'node:child_process';
import { openSync, closeSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// A header alone can be visible while Chromium is still writing. Walk whole
// chunks through IEND before treating the screenshot as finished.
export function completePng(bytes) {
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)
    || bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR'
    || !bytes.readUInt32BE(16) || !bytes.readUInt32BE(20)) return false;
  let data = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) return false;
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT' && length > 0) data = true;
    if (type === 'IEND') return data && length === 0 && end === bytes.length
      && bytes.readUInt32BE(offset + 8) === 0xae426082;
    offset = end;
  }
  return false;
}

async function supervise(exe, args, { timeout, log, screenshot }) {
  const fd = openSync(log, 'w');
  const group = process.platform !== 'win32';
  let child;
  let poll;
  let deadline;
  try {
    child = spawn(exe, args, { stdio: ['ignore', fd, fd], detached: group, windowsHide: true });
    return await new Promise((resolve) => {
      child.once('error', (error) => resolve({ error: error.message, code: error.code }));
      child.once('exit', (status, signal) => resolve(status === 0 ? {} : { error: `exited with ${status ?? signal}`, status, signal }));
      poll = setInterval(() => {
        try { if (completePng(readFileSync(screenshot))) resolve({}); } catch { /* not written yet */ }
      }, 100);
      deadline = setTimeout(() => resolve({ error: 'browser screenshot timed out', code: 'ETIMEDOUT' }), timeout);
    });
  } finally {
    clearInterval(poll);
    clearTimeout(deadline);
    if (child?.pid) {
      // Only this render's process tree: never target browsers by name.
      if (group) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already exited */ }
      } else if (child.exitCode === null && child.signalCode === null) {
        spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true, timeout: 5000 });
        child.kill('SIGKILL');
      }
      if (child.exitCode === null && child.signalCode === null) {
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 5000);
          child.once('exit', () => { clearTimeout(timer); resolve(); });
        });
      }
      child.unref();
    }
    closeSync(fd);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await supervise(process.argv[2], JSON.parse(process.argv[3]), JSON.parse(process.argv[4]));
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: error.message, code: error.code }));
  }
}
