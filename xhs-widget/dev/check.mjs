import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const puppeteer = require('/tmp/ppt/node_modules/puppeteer-core');

const chrome = '/usr/local/bin/google-chrome';
const outDir = '/tmp/xhs-shots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
});

const results = [];
function note(ok, msg) {
  results.push((ok ? 'PASS ' : 'FAIL ') + msg);
  if (!ok) console.error('FAIL', msg);
}

async function audit(page, label) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [];
    const all = document.querySelectorAll('body *');
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.width > doc.clientWidth + 1 || r.right > doc.clientWidth + 1) {
        offenders.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 80),
          right: Math.round(r.right),
          width: Math.round(r.width)
        });
      }
    }
    return {
      client: doc.clientWidth,
      scroll: doc.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      offenders: offenders.slice(0, 8),
      offenderCount: offenders.length,
      title: document.querySelector('.pname') ? document.querySelector('.pname').textContent : '',
      cards: document.querySelectorAll('.card-btn').length,
      pop: !document.getElementById('term-pop').hidden,
      requestsHint: performance.getEntriesByType('resource').map(r => r.name)
    };
  });
  note(metrics.scroll <= metrics.client + 1, label + ' no page overflow ' + metrics.scroll + '/' + metrics.client);
  note(metrics.offenderCount === 0, label + ' no element past viewport (' + metrics.offenderCount + ') ' + JSON.stringify(metrics.offenders));
  return metrics;
}

async function run(url, label) {
  const page = await browser.newPage();
  const hits = [];
  page.on('request', (req) => hits.push(req.url()));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && !/favicon|404/.test(text)) note(false, label + ' console ' + text);
  });
  page.on('pageerror', (err) => note(false, label + ' pageerror ' + err.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForSelector('.pname');
  let m = await audit(page, label + ' 390 initial');
  note(m.title === 'Plannotator', label + ' default featured is Plannotator, got ' + m.title);
  note(m.cards === 7, label + ' seven cards, got ' + m.cards);
  const external = hits.filter(u => !u.startsWith('http://127.0.0.1') && !u.startsWith('file:') && u !== url && !u.startsWith(url.split('#')[0]));
  const bad = hits.filter(u => /^https?:\/\//.test(u) && !u.includes('127.0.0.1'));
  note(bad.length === 0, label + ' no external http ' + JSON.stringify(bad));
  note(!hits.some(u => /fonts\.google|cdn|unpkg|jsdelivr/.test(u)), label + ' no cdn');

  await page.screenshot({ path: outDir + '/mobile-390-top.png' });

  await page.click('#issue-switch [data-issue="03"]');
  await page.waitForFunction(() => document.querySelector('.pname') && document.querySelector('.pname').textContent === 'auto-ontology');
  m = await audit(page, label + ' 390 issue03');
  note(m.title === 'auto-ontology', label + ' switched to auto-ontology');
  await page.screenshot({ path: outDir + '/mobile-390-issue03.png' });

  await page.click('#issue-switch [data-issue="04"]');
  await page.waitForFunction(() => document.querySelector('.pname') && document.querySelector('.pname').textContent === 'Plannotator');
  await page.click('.card-btn[data-card="p03"]');
  await page.waitForFunction(() => document.querySelector('.pname') && document.querySelector('.pname').textContent === 'open-code-review');
  note(true, label + ' opened card p03');
  await page.evaluate(() => document.querySelector('.detail').scrollIntoView());
  await page.screenshot({ path: outDir + '/mobile-390-card.png' });

  const term = await page.$('.detail span.term');
  note(!!term, label + ' detail has a term');
  await term.click();
  await page.waitForFunction(() => !document.getElementById('term-pop').hidden);
  const popText = await page.$eval('#pop-term', el => el.textContent);
  note(popText.length > 0, label + ' glossary opened: ' + popText);
  const blocks = await page.$$eval('#pop-body .blk h4', els => els.map(e => e.textContent));
  note(blocks.includes('是什么'), label + ' glossary sections ' + blocks.join(','));
  await page.screenshot({ path: outDir + '/mobile-390-glossary.png' });
  await page.click('#pop-close');
  await page.waitForFunction(() => document.getElementById('term-pop').hidden);
  note(true, label + ' glossary closed');

  await page.type('#q', 'Vincentwei1021');
  await page.waitForFunction(() => document.querySelectorAll('.card-btn').length === 1);
  const only = await page.$eval('.card-name', el => el.textContent);
  note(only === 'video-shotcraft', label + ' filter video-shotcraft got ' + only);
  m = await audit(page, label + ' 390 filtered');
  await page.click('#filter-clear');
  await page.waitForFunction(() => document.querySelectorAll('.card-btn').length === 7);

  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  m = await audit(page, label + ' desktop 1280');
  await page.screenshot({ path: outDir + '/desktop-1280.png', fullPage: false });
  await page.evaluate(() => document.querySelector('.detail').scrollIntoView());
  await page.screenshot({ path: outDir + '/desktop-detail.png' });
  await page.close();
}

await run('http://127.0.0.1:8765/xhs-widget/index.html', 'http');
await run('file:///workspace/xhs-widget/index.html', 'file');

const html = fs.readFileSync('/workspace/xhs-widget/index.html', 'utf8');
const pkg = ['index.html', 'app.css', 'app.js', 'data.js'].map(n => fs.readFileSync('/workspace/xhs-widget/' + n, 'utf8')).join('\n');
const forbidden = [
  [/<script(?![^>]*\bsrc=)/i, 'inline script'],
  [/\son[a-z]+\s*=/i, 'inline handler'],
  [/\beval\s*\(/, 'eval'],
  [/new\s+Function/, 'Function'],
  [/WebAssembly|<iframe|<object|<embed|<form/i, 'banned tag'],
  [/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie|window\.open|navigator\.clipboard|execCommand|geolocation|new\s+Worker|ServiceWorker/i, 'banned api'],
  [/target\s*=|javascript:|\bdownload\s*=|@import|url\(\s*['"]?https?:/i, 'outbound or import']
];
for (const [re, name] of forbidden) {
  note(!re.test(pkg), 'package scan ' + name);
}
note(!/<a\b/i.test(html), 'index has no anchor');
note(/src="\.\/data\.js"/.test(html) && /src="\.\/app\.js"/.test(html), 'external scripts');
note(!/DoDoNow|WINlist|书解|播客解析|my-project\.yaml|project-fit|\/Users\/|\/home\//.test(pkg), 'no private markers');

console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('FAIL')).length;
await browser.close();
process.exit(failed ? 1 : 0);
