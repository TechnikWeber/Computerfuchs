/*
 * Bilder für das README (docs/images/). Legt drei Beispielkinder mit
 * Fortschritt an und fotografiert die schönsten Stellen.
 *
 *   npm run build && npm run preview          # in einem zweiten Terminal
 *   npm run screenshots                       # gegen http://localhost:4173/
 *   npm run screenshots -- https://technikweber.github.io/Computerfuchs/
 *
 * Nutzt einen installierten Chrome, Chromium oder Edge (wie npm run e2e).
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const OUT = path.resolve('docs', 'images');
fs.mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('Kein Chrome/Chromium/Edge gefunden. Bitte CHROME_PATH setzen.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Drei Beispielkinder
// ---------------------------------------------------------------------------

/** Wie src/core/pin.ts: FNV-1a über Profil, Art und Code. */
function hashPin(profileId, kind, code) {
  let h = 0x811c9dc5;
  const text = `${profileId}:${kind}:${code}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const now = new Date().toISOString();
const record = (stars) => ({ stars, plays: stars + 1, last: now });
const levels = (entries) => Object.fromEntries(Object.entries(entries).map(([id, stars]) => [id, record(stars)]));
const ALL_FEATURES = ['doubleClick', 'moveWindows', 'rightClick', 'windowControls'];

const mia = {
  id: 'p-mia',
  name: 'Mia',
  avatar: 'cat',
  age: 8,
  createdAt: now,
  bytes: 428,
  bytesEarned: 608,
  progress: {
    maus: levels({ taschenlampe: 3, ballons: 3, geschenke: 3, fuettern: 2, weg: 3, farben: 2, tauchgang: 1, fenster: 1 }),
    rechnen: levels({ zaehlen: 3, plus10: 3, minus10: 3 }),
    tastatur: levels({ tastenzoo: 2 }),
    dateien: levels({ 'ordner-oeffnen': 1, 'bild-oeffnen': 1 }),
  },
  features: ALL_FEATURES,
  settings: { wallpaper: 'wiese' },
  seen: ['welcome'],
  owned: ['hg-regenbogen', 'sticker-einhorn', 'sticker-rakete'],
  stickers: [
    { id: 's-einhorn', emoji: 'unicorn', x: 0.135, y: 0.56 },
    { id: 's-rakete', emoji: 'rocket', x: 0.155, y: 0.8 },
  ],
};

const ben = {
  id: 'p-ben',
  name: 'Ben',
  avatar: 'trex',
  age: 5,
  createdAt: now,
  bytes: 0,
  bytesEarned: 0,
  progress: {},
  features: [],
  settings: { wallpaper: 'meer' },
  seen: [],
};

const LENA_CODE = '0481';
const lena = {
  id: 'p-lena',
  name: 'Lena',
  avatar: 'unicorn',
  age: 11,
  createdAt: now,
  bytes: 1290,
  bytesEarned: 1890,
  progress: {
    maus: levels({ taschenlampe: 3, ballons: 3, geschenke: 3, fuettern: 3, weg: 3, farben: 3, tauchgang: 3, fenster: 3 }),
    tastatur: { ...levels({ tastenzoo: 3, huepfhase: 3, pfeilweg: 3, sternenregen: 2, woerter: 3, zehnfinger: 1 }), tippprofi: { ...record(3), best: 142 } },
    rechnen: levels({ zaehlen: 3, plus10: 3, minus10: 3, bis20: 3, einmaleins: 2 }),
  },
  features: ALL_FEATURES,
  settings: { wallpaper: 'polarlicht' },
  seen: ['welcome'],
  owned: ['hg-polarlicht'],
  pin: { kind: 'bilder', hash: hashPin('p-lena', 'bilder', LENA_CODE) },
};

const SAVE = { format: 'computerfuchs', version: 1, profiles: [mia, ben, lena], lastProfileId: 'p-lena' };

// ---------------------------------------------------------------------------

const browser = await chromium.launch({ executablePath, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
// Nur beim allerersten Laden: Danach gehört der Speicher der App.
await ctx.addInitScript((save) => {
  if (!sessionStorage.getItem('cf-shots')) {
    localStorage.setItem('computerfuchs.save', JSON.stringify(save));
    sessionStorage.setItem('cf-shots', '1');
  }
}, SAVE);
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));

const wait = (ms) => page.waitForTimeout(ms);
const center = async (locator) => {
  const b = await locator.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};

async function shot(name, { mouse = [8, 8] } = {}) {
  await page.mouse.move(mouse[0], mouse[1]);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  await wait(350);
  const file = path.join(OUT, `${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 82 });
  console.log(`${name}.jpg  ${Math.round(fs.statSync(file).size / 1024)} KB`);
}

async function login(name, code) {
  await page.locator('.profile-card', { hasText: name }).click();
  if (code) {
    await page.waitForSelector('.pin-prompt');
    for (const digit of code) {
      await page.click(`.pin-key[aria-label="Bild ${Number(digit) + 1}"]`);
      await wait(120);
    }
  }
  await page.waitForSelector('.desktop');
  await wait(700);
}

async function logout() {
  await page.click('.start-btn');
  await page.click('.start-foot >> text=Abmelden');
  await page.waitForSelector('.profile-card');
  await wait(400);
}

async function openApp(appId, { maximize = true } = {}) {
  const icon = await center(page.locator(`.desk-icon[data-app="${appId}"]`));
  await page.mouse.dblclick(icon.x, icon.y, { delay: 60 });
  await page.waitForSelector('.win');
  await wait(600);
  if (maximize) {
    await page.click('.win-btn-max');
    await wait(450);
  }
}

async function closeWindows() {
  for (let i = 0; i < 5; i++) {
    const btn = await page.$('.win-btn-close');
    if (!btn) return;
    await btn.click();
    await wait(300);
  }
}

async function startLevel(index, tier) {
  await page.locator('.level-card').nth(index).click();
  await page.waitForSelector('.level-intro');
  await wait(250);
  if (tier) await page.locator('.tier-chip').nth(tier - 1).click();
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.level-play');
  await wait(500);
}

async function typeKeys(text) {
  for (const key of text) {
    await page.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), key);
    await wait(60);
  }
}

// 1. Anmeldung
await page.goto(BASE);
await page.click('.power-btn');
await page.waitForSelector('.profile-card');
await wait(900);
await shot('login', { mouse: [1240, 60] });

// 2. Ben, 5 Jahre: große Symbole, Flinn zeigt auf das Maustraining
await login('Ben');
await page.waitForSelector('.notice');
await wait(600);
await page.click('.notice .btn-leaf');
await wait(900);
await shot('desktop-age-5', { mouse: [1240, 60] });
await logout();

// 3. Mia, 8 Jahre: der Desktop mit Maustraining – das große Bild oben im README
await page.setViewportSize({ width: 1440, height: 900 });
await login('Mia');
await openApp('maus', { maximize: false });
const title = await center(page.locator('.win-title'));
await page.mouse.move(title.x, title.y);
await page.mouse.down();
await page.mouse.move(title.x + 150, title.y + 12, { steps: 12 });
await page.mouse.up();
await wait(400);
await shot('hero-desktop', { mouse: [1420, 30] });
await closeWindows();
await page.setViewportSize({ width: 1280, height: 800 });
await wait(400);

// 4. Maustraining: Farbenzauber mit offenem Rechtsklick-Menü
await openApp('maus');
await startLevel(5, 1);
const spots = await page.evaluate(() =>
  [...document.querySelectorAll('.paint-field > .paint-scene .paint-part.is-paintable')].map((g) => {
    const r = g.getBoundingClientRect();
    for (let fy = 0.2; fy <= 0.8; fy += 0.1) {
      for (let fx = 0.2; fx <= 0.8; fx += 0.1) {
        const x = r.left + r.width * fx;
        const y = r.top + r.height * fy;
        const hit = document.elementFromPoint(x, y);
        if (hit && g.contains(hit)) return { x, y };
      }
    }
    return null;
  }),
);
const usable = spots.filter(Boolean);
for (const [i, s] of usable.slice(0, -2).entries()) {
  await page.mouse.click(s.x, s.y, { button: 'right' });
  await page.waitForSelector('.paint-menu');
  await page.locator('.paint-swatch').nth((i * 3) % 8).click();
  await wait(250);
}
const open = usable[usable.length - 2];
await page.mouse.click(open.x, open.y, { button: 'right' });
await page.waitForSelector('.paint-menu');
await shot('mouse-course', { mouse: [open.x, open.y] });
await page.keyboard.press('Escape');
await closeWindows();

// 5. Rechnen: Plus bis 20 mit dem Zwanzigerfeld
await openApp('rechnen');
await startLevel(3);
await page.waitForSelector('.math-eq');
await page.click('.math-help');
await wait(500);
await shot('maths', { mouse: [1240, 40] });
await closeWindows();

// 6. Tastatur: Tastenzoo
await openApp('tastatur');
await startLevel(0, 1);
await wait(900);
await shot('keyboard-zoo', { mouse: [1240, 40] });
await closeWindows();

// 7. Dateien: der Ordner „Bilder“ mit Flinns Aufgaben
await openApp('dateien');
await page.locator('.files-place', { hasText: 'Bilder' }).click();
await wait(400);
await page.locator('.files-grid .file-item', { hasText: 'Hund' }).click();
await wait(300);
await shot('files', { mouse: [1240, 40] });
await closeWindows();

// 8. App-Laden
await openApp('laden');
await wait(300);
await shot('app-store', { mouse: [1240, 40] });
await closeWindows();
await logout();

// 9. Lena, 11 Jahre: Zehn Finger
await login('Lena', LENA_CODE);
await openApp('tastatur');
await startLevel(5, 2);
const line = await page.getAttribute('.typing-line', 'aria-label');
await typeKeys(line.slice(0, 3));
await wait(300);
await shot('keyboard-ten-fingers', { mouse: [1240, 40] });
await closeWindows();

// 10. Was ist das Internet?: Ein Foto reist in vier Paketen zu Oma …
await openApp('internet');
await startLevel(1, 1);
await page.waitForSelector('[data-node="paket-0"]', { timeout: 6000 });
for (const i of [0, 1]) {
  const p = await center(page.locator(`[data-node="paket-${i}"] .nm-node-bg`));
  await page.mouse.click(p.x, p.y);
  await wait(450);
}
await wait(700);
await shot('internet-packets', { mouse: [1240, 40] });

// … und ein Hai beißt ins Seekabel.
await page.click('.level-top .btn-ghost');
await page.waitForSelector('.level-map');
await startLevel(2, 1);
await page.click('.net-controls >> text=Losschicken');
await page.waitForSelector('.nm-edge.tone-pick', { timeout: 6000 });
await wait(800);
await shot('internet-sea-cable', { mouse: [1240, 40] });

await browser.close();
if (problems.length) {
  console.error('Fehler auf der Seite:', problems);
  process.exitCode = 1;
}
console.log(`Bilder: ${OUT}`);
