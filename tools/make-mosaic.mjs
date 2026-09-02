// Screenshot the live mosaic canvas from index.html into assets/print/img/mosaic_wiseowl.jpg.
//   node tools/make-mosaic.mjs      (needs the local server + Chrome)
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.PAGE_URL || 'http://localhost:8421/index.html';
const OUT = 'assets/print/img/mosaic_wiseowl.jpg';
const PORT = 9323;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'womosaic-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--window-size=1280,900',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

let ws;
try {
  let pages;
  for (let i = 0; i < 24; i++) {
    try { pages = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; }
    catch { await sleep(500); }
  }
  ws = new WebSocket(pages.find(t => t.type === 'page').webSocketDebuggerUrl);
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
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false });
  await send('Page.navigate', { url: URL });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: `document.getElementById('mosaicFrame').scrollIntoView({block:'center'})` });
  await sleep(5000); // asset load + tile build animation
  const { result } = await send('Runtime.evaluate', {
    expression: `document.getElementById('mosaicCanvas').toDataURL('image/jpeg',0.92)`,
  });
  const data = result.value.split(',')[1];
  writeFileSync(OUT, Buffer.from(data, 'base64'));
  console.log('wrote', OUT);
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
  await sleep(800);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
