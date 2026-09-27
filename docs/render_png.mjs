import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';
import os from 'os';

const browserModulePath = 'C:/Users/Abhijeet Yadav/AppData/Roaming/npm/node_modules/arkitect/skills/arkitect-excalidraw/scripts/lib/browser.mjs';
const { locateBrowser } = await import(pathToFileURL(browserModulePath).href);

const supervisorPath = 'C:/Users/Abhijeet Yadav/AppData/Roaming/npm/node_modules/arkitect/skills/arkitect-excalidraw/scripts/lib/browser-process.mjs';

const browser = locateBrowser();
console.log('Using browser:', browser.path);

const svg = fs.readFileSync('d:/sih-26087/docs/sahakar_setu_architecture.svg', 'utf8');

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'render-png-'));
const pagePath = path.join(work, 'page.html');
const shotPath = 'd:/sih-26087/docs/sahakar_setu_architecture.png';
const logPath = path.join(work, 'browser.log');

// Inline the SVG directly into the page
const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #F7F4EB;
      overflow: hidden;
      width: 1920px;
      height: 1080px;
    }
    svg {
      display: block;
      width: 1920px;
      height: 1080px;
    }
  </style>
</head>
<body>
${svg}
</body>
</html>`;

fs.writeFileSync(pagePath, html, 'utf8');

const args = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-crash-reporter',
  '--force-device-scale-factor=1',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-sync',
  '--no-service-autorun',
  '--password-store=basic',
  '--use-mock-keychain',
  `--user-data-dir=${path.join(work, 'profile')}`,
  '--window-size=1920,1080',
  `--screenshot=${shotPath}`,
  pathToFileURL(pagePath).href
];

const res = spawnSync(process.execPath, [
  supervisorPath,
  browser.path,
  JSON.stringify(args),
  JSON.stringify({ timeout: 60000, log: logPath, screenshot: shotPath })
], { encoding: 'utf8' });

console.log('Supervisor output:', res.stdout);
if (res.stderr) console.error('Supervisor stderr:', res.stderr);

if (fs.existsSync(shotPath)) {
  const stat = fs.statSync(shotPath);
  console.log(`Success! Rendered PNG size: ${(stat.size / 1024).toFixed(1)} KB at ${shotPath}`);
} else {
  console.error('Failed to generate PNG.');
}

try {
  fs.rmSync(work, { recursive: true, force: true });
} catch (e) {}
