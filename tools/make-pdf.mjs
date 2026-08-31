// Render print.html to Pivot-x-WM-Events-Experience-Catalog.pdf (8.5x11, 9 pages).
//
//   node tools/make-pdf.mjs
//
// Needs a local server on :4350 serving the repo root, and Chrome. Run this after
// editing print.html or assets/print/style.css so the downloadable catalog never
// drifts from the site.
import { writeFileSync, mkdtempSync, rmSync, statSync } from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.PRINT_URL || 'http://localhost:4350/print.html';
const OUT = 'Pivot-x-WM-Events-Experience-Catalog.pdf';
const PORT = 9322;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'wmpdf-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--window-size=1100,1400',
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
  await send('Page.navigate', { url: URL });
  await sleep(2500);

  // the print faces use font-display:block, so wait for them rather than risk
  // a page rendering in a fallback
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  // and for every image to decode, since a half-loaded gallery prints blank
  await send('Runtime.evaluate', {
    expression: `Promise.all([...document.images].filter(i=>!i.complete)
                   .map(i=>new Promise(r=>{i.onload=i.onerror=r})))`,
    awaitPromise: true,
  });
  await sleep(1200);

  const { data } = await send('Page.printToPDF', {
    paperWidth: 8.5, paperHeight: 11,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    printBackground: true,           // the whole design is background colour
    preferCSSPageSize: true,
    scale: 1,
  });
  writeFileSync(OUT, Buffer.from(data, 'base64'));
} finally {
  try { ws?.close(); } catch {}
  chrome.kill();
  await sleep(1200);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
console.log(`wrote ${OUT} — ${(statSync(OUT).size / 1024 / 1024).toFixed(2)} MB`);
