// Render tools/og-card.html to assets/img/og-cover.jpg at 1200x630.
//
//   node tools/make-og.mjs
//
// Needs a local server on :4350 (the repo root) and Chrome. Run it after
// changing the client name on the card so the link preview never drifts from
// the deal it was built for.
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { spawn, execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CARD_URL = process.env.CARD_URL || 'http://localhost:4350/tools/og-card.html';
const OUT_PNG = 'assets/img/og-cover.png';
const OUT_JPG = 'assets/img/og-cover.jpg';
const PORT = 9321;

const profile = mkdtempSync(join(tmpdir(), 'ogcard-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--window-size=1200,630',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', detached: false });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let pages;
  for (let i = 0; i < 20; i++) {
    try { pages = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; }
    catch { await sleep(500); }
  }
  const target = pages.find(t => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  };
  await new Promise(r => ws.onopen = r);

  await send('Emulation.setDeviceMetricsOverride',
    { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });
  await send('Page.navigate', { url: CARD_URL });
  await sleep(3500); // webfonts + logo

  const shot = await send('Page.captureScreenshot',
    { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  writeFileSync(OUT_PNG, Buffer.from(shot.data, 'base64'));
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
  // Chrome flushes its profile asynchronously; deleting too early throws
  // ENOTEMPTY and would mask a successful render.
  await sleep(1200);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}

// 1200x630 at quality 82 lands well under the ~1MB most scrapers will fetch
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
  '-z', '630', '1200', OUT_PNG, '--out', OUT_JPG], { stdio: 'ignore' });
rmSync(OUT_PNG, { force: true });
console.log('wrote', OUT_JPG);
