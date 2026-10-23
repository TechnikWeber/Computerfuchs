/*
 * Automatischer Durchlauf durch Computerfuchs, mit Screenshots.
 *
 *   npm run build && npm run preview      # in einem zweiten Terminal
 *   npm run e2e                           # gegen http://localhost:4173/
 *   npm run e2e -- https://technikweber.github.io/Computerfuchs/
 *
 * Nutzt einen installierten Chrome, Chromium oder Edge (kein Browser-Download).
 * Anderer Pfad: Umgebungsvariable CHROME_PATH. Screenshots landen in test-results/e2e.
 * Spielt alle 8 Maus-Level, Rechnen, Einstellungen, Spielstand-Datei, Neuladen,
 * ein zweites Profil, alle 7 Tastatur-Level, die Dateien-Aufgaben, den App-Laden,
 * Sticker, ein Lied, den Geheimcode, alle 15 Stufen von „Was ist das Internet?“, den
 * Kiosk-Modus und einen Neustart ohne Internet durch und meldet Konsolenfehler.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const OUT = process.argv[3] ?? path.resolve('test-results', 'e2e');
fs.rmSync(OUT, { recursive: true, force: true });
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

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
const page = await ctx.newPage();
const problems = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') problems.push(`[console.${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));

let n = 0;
const shot = async (name) => {
  n++;
  await page.screenshot({ path: path.join(OUT, `${String(n).padStart(2, '0')}-${name}.png`) });
};
const results = [];
const step = async (name, fn) => {
  const t0 = Date.now();
  try {
    await fn();
    results.push(`OK   ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    results.push(`FAIL ${name}: ${e.message.split('\n')[0]}`);
    // Ohne Doppelpunkt & Co. – unter Windows würde daraus sonst ein versteckter Datenstrom statt einer Datei.
    await shot(`FAIL-${name.replace(/[\\/:*?"<>|]+/g, '-')}`);
  }
};
const wait = (ms) => page.waitForTimeout(ms);
const center = async (handle) => {
  const b = await handle.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};

/** Hinweise von Flinn (Freischaltungen, Rang) wegklicken. */
async function dismissNotices() {
  for (let i = 0; i < 4; i++) {
    const btn = await page.$('.notice .fox-bubble-actions .btn');
    if (!btn) return;
    await wait(250);
    await btn.click();
    await wait(350);
  }
}

async function waitResult(timeout = 30000) {
  await page.waitForSelector('.result', { timeout });
  // Freischalt- und Rang-Hinweise kommen kurz nach dem Ergebnis.
  await wait(1100);
  await dismissNotices();
}

async function backToMap() {
  await page.click('.result-actions >> text=Karte');
  await page.waitForSelector('.level-map');
  await wait(200);
}

async function startLevel(index) {
  await page.locator('.level-card').nth(index).click();
  await page.waitForSelector('.level-intro');
  await wait(250);
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.level-stage');
  await wait(400);
}

/** Desktop-Symbol per Doppelklick öffnen. */
async function openDesk(appId) {
  const icon = await center(page.locator(`.desk-icon[data-app="${appId}"]`));
  await page.mouse.dblclick(icon.x, icon.y, { delay: 60 });
  await wait(700);
}

async function closeWindows() {
  for (let i = 0; i < 6; i++) {
    const btn = await page.$('.win-btn-close');
    if (!btn) return;
    await btn.click();
    await wait(300);
  }
}

/**
 * Tippen wie mit einer echten Tastatur. Playwright kennt nur das US-Layout –
 * für ä, ö, ü, ß und @ schicken wir die Tastenereignisse deshalb selbst.
 */
async function typeKeys(text, ms = 45) {
  for (const key of text) {
    await page.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), key);
    await wait(ms);
  }
}

async function startTastatur(index) {
  await page.locator('.level-card').nth(index).click();
  await page.waitForSelector('.level-intro');
  await wait(250);
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.kb-level');
  await wait(350);
}

/** Text der aktuellen Zeile abtippen, bis das Ergebnis kommt. */
async function typeLines(pause) {
  const t0 = Date.now();
  while (!(await page.$('.result')) && Date.now() - t0 < 40000) {
    const line = await page.$('.typing-line');
    if (!line) {
      await wait(150);
      continue;
    }
    const target = await line.getAttribute('aria-label');
    const done = await page.$$eval('.typing-ch.is-done', (els) => els.length);
    await typeKeys(target.slice(done));
    await wait(pause);
  }
}

// ---------------------------------------------------------------------------

await step('Startbildschirm', async () => {
  await page.goto(BASE);
  await page.waitForSelector('.power-btn');
  await shot('boot');
  await page.click('.power-btn');
  await page.waitForSelector('.boot-splash');
  await wait(900);
  await shot('boot-splash');
  await page.waitForSelector('.wizard', { timeout: 8000 });
});

await step('Profil anlegen (5 Jahre)', async () => {
  await wait(300);
  await shot('wizard-avatar');
  await page.locator('.avatar-pick').nth(6).click();
  await page.waitForSelector('.name-input');
  await page.fill('.name-input', 'Mia');
  await shot('wizard-name');
  await page.click('.name-form button[type=submit]');
  await page.waitForSelector('.age-grid');
  await shot('wizard-age');
  await page.click('.age-pick >> text="5"');
  await page.waitForSelector('.desktop');
  await wait(700);
  await shot('desktop-welcome');
  await page.click('.notice .btn-leaf');
  await wait(400);
  await shot('desktop-klein');
});

await step('Maustraining öffnen (ein Klick)', async () => {
  await page.locator('.desk-icon').first().click();
  await page.waitForSelector('.level-map', { timeout: 8000 });
  await wait(500);
  await shot('maus-karte');
});

await step('Level 1 Taschenlampe', async () => {
  await page.locator('.level-card').nth(0).click();
  await page.waitForSelector('.level-intro');
  await wait(400);
  await shot('maus-intro');
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.lamp-friend');
  await wait(300);
  await page.mouse.move(500, 420);
  await wait(200);
  await shot('lamp-dunkel');
  const friends = await page.$$('.lamp-friend');
  for (const [i, f] of friends.entries()) {
    const c = await center(f);
    await page.mouse.move(c.x, c.y, { steps: 6 });
    await wait(650);
    if (i === 1) await shot('lamp-gefunden');
  }
  await waitResult();
  await shot('ergebnis');
  await backToMap();
});

await step('Level 2 Ballons', async () => {
  await startLevel(1);
  await wait(800);
  await shot('ballons');
  const t0 = Date.now();
  while (!(await page.$('.result')) && Date.now() - t0 < 45000) {
    const balloons = await page.$$('.balloon');
    for (const b of balloons) {
      const box = await b.boundingBox();
      if (box && box.y > 150 && box.y + box.height < 740) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.35);
        break;
      }
    }
    await wait(200);
  }
  await waitResult(5000);
  await backToMap();
});

await step('Level 3 Geschenke (Doppelklick)', async () => {
  await startLevel(2);
  await shot('geschenke');
  // Erst ein einzelner Klick: Es soll der Tipp kommen.
  const first = (await page.$$('.gift'))[0];
  const c0 = await center(first);
  await page.mouse.click(c0.x, c0.y);
  await wait(1300);
  await shot('geschenke-tipp');
  for (let i = 0; i < 4; i++) {
    const gift = (await page.$$('.gift:not(.is-open)'))[0];
    if (!gift) break;
    const c = await center(gift);
    await page.mouse.dblclick(c.x, c.y, { delay: 60 });
    await wait(500);
  }
  await shot('geschenke-offen');
  await page.waitForSelector('.result', { timeout: 10000 });
  await wait(1100);
  await shot('freischaltung-doppelklick');
  await dismissNotices();
  await backToMap();
});

await step('Doppelklick ist freigeschaltet', async () => {
  const features = await page.evaluate(() => JSON.parse(localStorage.getItem('computerfuchs.save')).profiles[0].features);
  if (!features.includes('doubleClick')) throw new Error(`features: ${features}`);
});

const FOOD_FOR = {
  carrot: 'rabbit-face',
  bone: 'dog-face',
  banana: 'monkey-face',
  'cheese-wedge': 'mouse-face',
  fish: 'cat-face',
  'honey-pot': 'bear',
  chestnut: 'chipmunk',
};

await step('Level 4 Tiere füttern (Ziehen)', async () => {
  await startLevel(3);
  await shot('fuettern');
  // Absichtlich zuerst zum falschen Tier ziehen.
  for (let round = 0; round < 3; round++) {
    const foods = await page.$$('.feed-food');
    if (foods.length === 0) break;
    const food = foods[0];
    const src = await food.$eval('img', (img) => img.getAttribute('src'));
    const name = src.split('/').pop().replace('.svg', '');
    const animals = await page.$$('.feed-animal:not(.is-fed)');
    let right = null;
    let wrong = null;
    for (const a of animals) {
      const aSrc = await a.$eval('img', (img) => img.getAttribute('src'));
      if (aSrc.endsWith(`${FOOD_FOR[name]}.svg`)) right = a;
      else wrong = a;
    }
    const from = await center(food);
    if (round === 0 && wrong) {
      const to = await center(wrong);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 12 });
      await shot('fuettern-ziehen');
      await page.mouse.up();
      await wait(600);
    }
    const from2 = await center((await page.$$('.feed-food'))[0]);
    const to2 = await center(right);
    await page.mouse.move(from2.x, from2.y);
    await page.mouse.down();
    await page.mouse.move(to2.x, to2.y, { steps: 15 });
    await page.mouse.up();
    await wait(700);
  }
  await waitResult();
  await backToMap();
  await dismissNotices();
});

await step('Level 5 Bienenweg', async () => {
  await startLevel(4);
  await wait(300);
  await shot('bienenweg');
  const pts = await page.evaluate(() => {
    const svg = document.querySelector('.path-svg');
    const r = svg.getBoundingClientRect();
    return document
      .querySelector('.path-road')
      .getAttribute('points')
      .split(' ')
      .map((p) => p.split(',').map(Number))
      .map(([x, y]) => ({ x: x + r.left, y: y + r.top }));
  });
  await page.mouse.move(pts[0].x, pts[0].y, { steps: 4 });
  await wait(200);
  for (let i = 2; i < pts.length; i += 3) {
    await page.mouse.move(pts[i].x, pts[i].y);
    if (i % 60 === 2) await wait(16);
    if (i === 152) await shot('bienenweg-unterwegs');
  }
  await page.mouse.move(pts[pts.length - 1].x, pts[pts.length - 1].y);
  await waitResult();
  await backToMap();
});

await step('Level 6 Farbenzauber (Rechtsklick)', async () => {
  await startLevel(5);
  await shot('farben');
  // Linksklick zuerst: Hinweis auf die rechte Taste.
  const spots = await page.evaluate(() => {
    const out = [];
    for (const g of document.querySelectorAll('.paint-field > .paint-scene .paint-part.is-paintable')) {
      const r = g.getBoundingClientRect();
      let found = null;
      for (let fy = 0.2; fy <= 0.8 && !found; fy += 0.1) {
        for (let fx = 0.2; fx <= 0.8 && !found; fx += 0.1) {
          const x = r.left + r.width * fx;
          const y = r.top + r.height * fy;
          const hit = document.elementFromPoint(x, y);
          if (hit && g.contains(hit)) found = { x, y };
        }
      }
      out.push(found);
    }
    return out;
  });
  await page.mouse.click(spots[0].x, spots[0].y);
  await wait(400);
  await shot('farben-linksklick');
  for (const [i, s] of spots.entries()) {
    await page.mouse.click(s.x, s.y, { button: 'right' });
    await page.waitForSelector('.paint-menu');
    if (i === 0) await shot('farben-menu');
    await page.locator('.paint-swatch').nth(i % 8).click();
    await wait(300);
  }
  await shot('farben-bunt');
  await waitResult();
  await backToMap();
  await dismissNotices();
});

await step('Level 7 Tauchgang (Scrollen)', async () => {
  await startLevel(6);
  await shot('tauchgang');
  const scroller = await page.$('.dive-scroll');
  const sc = await center(scroller);
  await page.mouse.move(sc.x, sc.y);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 250);
    await wait(120);
  }
  await wait(300);
  await shot('tauchgang-tiefer');
  for (let i = 0; i < 3; i++) {
    const animal = (await page.$$('.dive-animal:not(.is-found)'))[0];
    if (!animal) break;
    await animal.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await wait(250);
    const c = await center(animal);
    await page.mouse.click(c.x, c.y);
    await wait(400);
  }
  await waitResult();
  await backToMap();
});

await step('Level 8 Fenster-Profi', async () => {
  await startLevel(7);
  await shot('fenster');
  const title = await center(await page.$('.winpro-title'));
  const win = (await (await page.$('.winpro-win')).boundingBox());
  const target = (await (await page.$('.winpro-target')).boundingBox());
  await page.mouse.move(title.x - 40, title.y);
  await page.mouse.down();
  await page.mouse.move(title.x - 40 + (target.x - win.x), title.y + (target.y - win.y), { steps: 20 });
  await page.mouse.up();
  await waitResult();
  await shot('fenster-geschafft');
  await backToMap();
  await dismissNotices();
  await shot('maus-karte-fertig');
});

await step('Alle vier Desktop-Funktionen freigeschaltet', async () => {
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('computerfuchs.save')).profiles[0]);
  const need = ['doubleClick', 'moveWindows', 'rightClick', 'windowControls'];
  const missing = need.filter((f) => !p.features.includes(f));
  if (missing.length) throw new Error(`fehlt: ${missing}`);
  results.push(`     Bytes nach 8 Leveln: ${p.bytes}, Rang-Bytes: ${p.bytesEarned}`);
});

await step('Fenster bedienen: verschieben, vergrößern, verkleinern, Taskleiste', async () => {
  // Seit „Fenster verschieben" ist das Fenster normal groß und hat jetzt alle Knöpfe.
  await shot('fenster-normal');
  const before = await (await page.$('.win')).boundingBox();
  const title = await center(await page.$('.win-title'));
  await page.mouse.move(title.x - 200, title.y);
  await page.mouse.down();
  await page.mouse.move(title.x - 120, title.y + 60, { steps: 10 });
  await page.mouse.up();
  await wait(300);
  const after = await (await page.$('.win')).boundingBox();
  if (Math.abs(after.x - before.x - 80) > 6 || Math.abs(after.y - before.y - 60) > 6) {
    throw new Error(`Fenster nicht verschoben: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  }
  await page.click('.win-btn-max');
  await wait(400);
  if (!(await page.$('.win.win-max'))) throw new Error('Vergrößern ging nicht');
  await page.click('.win-btn-min');
  await wait(400);
  if (!(await page.$('.task.is-min'))) throw new Error('Taskleisten-Knopf zeigt kein verkleinertes Fenster');
  await shot('desktop-verkleinert');
  await page.click('.task');
  await wait(400);
  if (await page.$('.task.is-min')) throw new Error('Fenster kam nicht zurück');
  if (!(await page.$('.win.win-max'))) throw new Error('Fenster kam nicht groß zurück');
});

await step('Rechtsklick-Menü auf dem Desktop', async () => {
  await page.click('.win-btn-close');
  await wait(400);
  await page.mouse.click(900, 300, { button: 'right' });
  await page.waitForSelector('.ctx-menu');
  await wait(350);
  await shot('desktop-rechtsklick');
  await page.click('.ctx-item >> text=Hintergrund ändern');
  await page.waitForSelector('.wall-grid', { timeout: 8000 });
  await wait(400);
  await shot('einstellungen-hintergrund');
  await page.click('.wall-pick >> text=Sternennacht');
  await wait(400);
});

await step('Rechnen: Zählen bis 10', async () => {
  await page.click('.win-btn-close');
  await wait(300);
  // Doppelklick ist jetzt Pflicht auf dem Desktop.
  await openDesk('rechnen');
  await page.waitForSelector('.level-map', { timeout: 8000 });
  await wait(300);
  await shot('rechnen-karte');
  await page.locator('.level-card').nth(0).click();
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.math-choices');
  await wait(300);
  await shot('rechnen-zaehlen');
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('.math-choice:not([disabled])', { timeout: 5000 });
    const count = await page.$$eval('.vis-obj', (els) => els.length);
    // Einmal absichtlich falsch, um den zweiten Versuch zu sehen.
    if (i === 2) {
      const wrongBtn = page.locator('.math-choice').filter({ hasNotText: new RegExp(`^${count}$`) }).first();
      await wrongBtn.click();
      await wait(250);
      await shot('rechnen-falsch');
      await wait(1100);
    }
    await page.locator('.math-choice', { hasText: new RegExp(`^${count}$`) }).click();
    await wait(1000);
  }
  await waitResult();
  await shot('rechnen-ergebnis');
});

await step('Rechnen: Plus mit der Tastatur', async () => {
  await page.click('.result-actions >> text=Plus');
  await page.waitForSelector('.level-intro');
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.numpad');
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('.math-answer.is-none', { timeout: 5000 });
    const [a, , b] = await page.$$eval('.math-eq > span', (s) => s.map((x) => x.textContent));
    if (i === 0) {
      await shot('rechnen-plus');
      const top = await page.$eval('.math-card', (el) => el.getBoundingClientRect().top - el.closest('.math-play').getBoundingClientRect().top);
      if (top < 0) throw new Error(`Aufgabe ragt oben hinaus (${top}px)`);
    }
    await page.keyboard.type(String(Number(a) + Number(b)));
    await page.keyboard.press('Enter');
    await wait(1000);
  }
  await waitResult();
});

await step('Einmaleins mit Hilfe-Bild', async () => {
  await page.click('.result-actions >> text=Karte');
  await page.waitForSelector('.level-map');
  const cards = page.locator('.level-card');
  // Einmaleins ist für eine Fünfjährige noch gesperrt.
  const locked = await cards.nth(4).getAttribute('aria-disabled');
  if (locked !== 'true') throw new Error('Einmaleins hätte gesperrt sein sollen');
  await shot('rechnen-karte-2');
});

await step('Erwachsenen-Bereich: Spielstand als Datei', async () => {
  await page.click('.start-btn');
  await page.waitForSelector('.start-menu');
  await wait(400);
  await shot('startmenue');
  await page.click('.start-tile >> text=Einstellungen');
  await page.waitForSelector('.settings');
  await page.click('.settings-tab >> text=Für Erwachsene');
  await page.waitForSelector('.parent-gate');
  const [a, b] = (await page.textContent('.parent-gate-task span')).match(/\d+/g).map(Number);
  await page.fill('.parent-gate-task input', String(a * b));
  await page.click('.parent-gate .btn');
  await page.waitForSelector('text=Alle Profile als Datei sichern');
  await shot('erwachsene');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('text=Alle Profile als Datei sichern')]);
  const file = path.join(OUT, download.suggestedFilename());
  await download.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.format !== 'computerfuchs' || data.profiles.length !== 1) throw new Error('Datei unvollständig');
  results.push(`     Datei: ${download.suggestedFilename()} (${fs.statSync(file).size} Bytes)`);
});

await step('Alter stellen nur Erwachsene um', async () => {
  await page.click('.me-age >> text="8"');
  await wait(500);
  const age = await page.evaluate(() => JSON.parse(localStorage.getItem('computerfuchs.save')).profiles[0].age);
  if (age !== 8) throw new Error(`Alter nicht geändert: ${age}`);
  await page.click('.settings-tab >> text="Ich"');
  await page.waitForSelector('.me-card');
  if (await page.$('.me-age')) throw new Error('Unter „Ich" lässt sich das Alter noch ändern');
});

await step('Neu laden: Spielstand bleibt', async () => {
  await page.reload();
  await page.click('.power-btn');
  await page.waitForSelector('.profile-card', { timeout: 8000 });
  await wait(300);
  await shot('login');
  await page.locator('.profile-card').first().click();
  await page.waitForSelector('.desktop');
  await wait(500);
  const wall = await page.$eval('.desktop > .wallpaper', (el) => el.innerHTML.includes('mask'));
  if (!wall) throw new Error('Hintergrund „Sternennacht" nicht übernommen');
  await shot('desktop-nacht');
});

await step('Zweites Profil: 12 Jahre, voller Desktop', async () => {
  await page.click('.start-btn');
  await page.click('.start-foot >> text=Abmelden');
  await page.waitForSelector('.profile-new');
  await page.click('.profile-new');
  await page.locator('.avatar-pick').nth(11).click();
  await page.fill('.name-input', 'Jonas');
  await page.click('.name-form button[type=submit]');
  await page.click('.age-pick >> text="12"');
  await page.waitForSelector('.desktop');
  await wait(500);
  await page.click('.notice .btn-leaf');
  const icon = await center(page.locator('.desk-icon').first());
  // Ein Klick wählt nur aus …
  await page.mouse.click(icon.x, icon.y);
  await wait(300);
  if (await page.$('.win')) throw new Error('Ein Klick hätte nichts öffnen dürfen');
  // … erst der Doppelklick öffnet.
  await page.mouse.dblclick(icon.x, icon.y, { delay: 60 });
  await page.waitForSelector('.win.win-normal', { timeout: 8000 });
  await wait(400);
  await shot('gross-fenster');
  // Größe am Rand ziehen
  const se = await center(await page.$('.win-resize-se'));
  await page.mouse.move(se.x, se.y);
  await page.mouse.down();
  await page.mouse.move(se.x - 150, se.y - 80, { steps: 10 });
  await page.mouse.up();
  await wait(300);
  await shot('gross-kleiner');
  const cards = await page.$$eval('.level-card', (els) => els.filter((e) => e.getAttribute('aria-disabled') === 'true').length);
  if (cards !== 0) throw new Error('Große sollten alle Level offen haben');
});

// --- Version 0.2: Tastatur, Dateien, App-Laden, Sticker, Lieder, Geheimcode ---

await step('Tastatur 1: Tastenzoo', async () => {
  await closeWindows();
  await openDesk('tastatur');
  await page.waitForSelector('.level-map');
  await shot('tastatur-karte');
  await startTastatur(0);
  await shot('tastenzoo');
  let wrongDone = false;
  const t0 = Date.now();
  while (!(await page.$('.result')) && Date.now() - t0 < 30000) {
    const letter = (await page.textContent('.zoo-letter').catch(() => ''))?.trim().toLowerCase();
    if (!letter || letter === '?') {
      await wait(200);
      continue;
    }
    if (!wrongDone) {
      // Einmal danebengetippt: Es soll ein Tipp kommen.
      await typeKeys(letter === 'q' ? 'w' : 'q');
      await page.waitForSelector('.level-hint', { timeout: 2000 });
      await shot('tastenzoo-falsch');
      wrongDone = true;
    }
    await typeKeys(letter);
    await wait(1450);
  }
  await waitResult(5000);
  await backToMap();
});

await step('Tastatur 2: Hüpfhase (Leertaste)', async () => {
  await startTastatur(1);
  const t0 = Date.now();
  let shotDone = false;
  let ok = 0;
  while (!(await page.$('.result')) && Date.now() - t0 < 50000) {
    const xs = await page.$$eval('.hop-hedgehog:not(.is-hit)', (els) => els.map((e) => parseFloat(e.style.left)));
    // Höchstwert merken – am Ende verschwinden die Punkte, wenn das Ergebnis kommt.
    ok = Math.max(ok, await page.$$eval('.progress-dots .dot-ok', (els) => els.length).catch(() => 0));
    if (xs.some((x) => x > 21.5 && x < 25)) {
      await page.keyboard.press(' ');
      if (!shotDone) {
        await wait(300);
        await shot('huepfhase-sprung');
        shotDone = true;
      }
      await wait(450);
    }
    await wait(20);
  }
  await waitResult(5000);
  results.push(`     Hüpfhase: ${ok} von 6 Igeln übersprungen`);
  await backToMap();
});

await step('Tastatur 3: Hamsterweg (Pfeiltasten)', async () => {
  await startTastatur(2);
  await shot('hamsterweg');
  const pos = () =>
    page.$eval('.maze-hamster', (el) => {
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(el.style.transform);
      return m ? `${Math.round(Number(m[1]) / 10)},${Math.round(Number(m[2]) / 10)}` : '?';
    });
  const won = async () => !!(await page.$('.maze-hamster image[href*="party-popper"], .result'));
  const DIRS = [
    ['ArrowRight', 'ArrowLeft'],
    ['ArrowDown', 'ArrowUp'],
    ['ArrowLeft', 'ArrowRight'],
    ['ArrowUp', 'ArrowDown'],
  ];
  const seen = new Set();
  // Tiefensuche mit der Tastatur: probieren, und wenn es nicht weitergeht, zurück.
  const explore = async () => {
    const here = await pos();
    seen.add(here);
    for (const [go, back] of DIRS) {
      if (await won()) return true;
      await page.keyboard.press(go);
      await wait(70);
      if (await won()) return true;
      const now = await pos();
      if (now === here) continue;
      if (!seen.has(now) && (await explore())) return true;
      if (await won()) return true;
      await page.keyboard.press(back);
      await wait(70);
    }
    return false;
  };
  if (!(await explore())) throw new Error('Käse nicht gefunden');
  await waitResult(5000);
  await backToMap();
});

await step('Tastatur 4: Sternenregen', async () => {
  await startTastatur(3);
  const t0 = Date.now();
  let shotDone = false;
  while (!(await page.$('.result')) && Date.now() - t0 < 60000) {
    const letters = await page.$$eval('.rain-star.is-fall span', (els) => els.map((e) => e.textContent.toLowerCase()));
    if (letters[0]) {
      if (!shotDone) {
        await wait(1200);
        await shot('sternenregen');
        shotDone = true;
      }
      await typeKeys(letters[0]);
    }
    await wait(300);
  }
  await waitResult(5000);
  await backToMap();
});

await step('Tastatur 5: Bilderwörter', async () => {
  await startTastatur(4);
  await shot('bilderwoerter');
  await typeLines(1400);
  await waitResult(5000);
  await backToMap();
});

await step('Tastatur 6: Zehn Finger', async () => {
  await startTastatur(5);
  await shot('zehnfinger');
  await typeLines(700);
  await waitResult(5000);
  await backToMap();
});

await step('Tastatur 7: Tipp-Profi, alle drei Stufen', async () => {
  await startTastatur(6);
  await shot('tippprofi-1');
  await typeLines(800);
  await waitResult(5000);
  // Stufe 2: Satzzeichen und @
  await page.click('.result-actions >> text=Stufe 2');
  await page.waitForSelector('.kb-level');
  await wait(400);
  await shot('tippprofi-2');
  await typeLines(800);
  await waitResult(5000);
  // Stufe 3: Wettrennen gegen Flinn
  await page.click('.result-actions >> text=Stufe 3');
  await page.waitForSelector('.race');
  await wait(400);
  const target = await page.getAttribute('.typing-line', 'aria-label');
  // Einmal vertippen und mit der Rücktaste korrigieren
  await typeKeys(target.slice(0, 3) + '#');
  await wait(200);
  if (!(await page.$('.typing-ch.is-wrong'))) throw new Error('Falscher Buchstabe wird nicht rot angezeigt');
  await shot('tippprofi-rennen');
  await typeKeys(['Backspace']);
  await typeKeys(target.slice(3), 90);
  await page.waitForSelector('.race-result', { timeout: 5000 });
  await shot('tippprofi-ergebnis');
  await waitResult(8000);
  const best = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('computerfuchs.save'));
    const p = save.profiles.find((x) => x.name === 'Jonas');
    return p.progress.tastatur?.tippprofi?.best;
  });
  if (!best) throw new Error('Anschläge pro Minute nicht gespeichert');
  results.push(`     Tipp-Profi: ${best} Anschläge pro Minute`);
});

const fileItem = (name) => page.locator('.files-grid .file-item', { hasText: name }).first();
const place = (name) => page.locator('.files-place', { hasText: name });
async function openItem(name) {
  const c = await center(fileItem(name));
  await page.mouse.dblclick(c.x, c.y, { delay: 50 });
  await wait(500);
}
async function dragItem(name, target) {
  const a = await center(fileItem(name));
  const b = await center(target);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 16, a.y + 10, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await wait(120);
  await page.mouse.up();
  await wait(400);
}

await step('Dateien: Flinns sechs Aufgaben', async () => {
  await closeWindows();
  await openDesk('dateien');
  await page.waitForSelector('.files');
  await shot('dateien');
  // 1 und 2: Ordner öffnen, Bild ansehen
  await openItem('Bilder');
  await openItem('Hund');
  await page.waitForSelector('.viewer-picture');
  await shot('anzeige-bild');
  await page.locator('.win', { has: page.locator('.viewer') }).locator('.win-btn-close').click();
  await wait(400);
  // 3: Downloads aufräumen – mit Ziehen und Ablegen auf die Seitenleiste
  await place('Downloads').click();
  await wait(300);
  await dragItem('Muschel vom Strand', place('Bilder'));
  await dragItem('Hänschen klein', place('Musik'));
  await dragItem('Hausaufgaben', place('Dokumente'));
  // 4: Neuer Ordner
  await place('Bilder').click();
  await wait(300);
  await page.click('.files-toolbar >> text=Neuer Ordner');
  await page.waitForSelector('.file-rename');
  await page.keyboard.type('Tiere');
  await page.keyboard.press('Enter');
  await wait(400);
  // 5: Hund und Katze in den Ordner
  await dragItem('Hund', fileItem('Tiere'));
  await dragItem('Katze', fileItem('Tiere'));
  await shot('dateien-tiere');
  // 6: Löschen und zurückholen
  await fileItem('Altes Gespenst').click();
  await page.keyboard.press('Delete');
  await wait(400);
  await place('Papierkorb').click();
  await wait(300);
  await fileItem('Altes Gespenst').click();
  await page.click('.files-toolbar >> text=Wiederherstellen');
  await wait(800);
  await dismissNotices();
  await shot('dateien-fertig');
  const done = await page.$$eval('.mission.is-done', (els) => els.length);
  if (done !== 6) throw new Error(`nur ${done} von 6 Aufgaben erledigt`);
});

await step('Dateien: Kopieren, Einfügen, falscher Name', async () => {
  await place('Bilder').click();
  await wait(300);
  await fileItem('Sonnenblume').click();
  await page.keyboard.press('Control+c');
  await place('Dokumente').click();
  await wait(300);
  await page.keyboard.press('Control+v');
  await wait(400);
  if ((await fileItem('Sonnenblume').count()) === 0) throw new Error('Kopie fehlt in „Dokumente"');
  await fileItem('Sonnenblume').click();
  await page.keyboard.press('F2');
  await page.waitForSelector('.file-rename');
  await page.keyboard.type('Blume/Sonne');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.files-hint', { timeout: 2000 });
  const hint = await page.textContent('.files-hint');
  if (!hint.includes('Zeichen')) throw new Error(`unerwarteter Hinweis: ${hint}`);
  await shot('dateien-falscher-name');
  await page.keyboard.press('Escape');
  await wait(200);
});

await step('App-Laden: Hintergrund kaufen und festlegen', async () => {
  await closeWindows();
  const jonas = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('computerfuchs.save')).profiles.find((p) => p.name === 'Jonas'));
  const bytesBefore = (await jonas()).bytes;
  await openDesk('laden');
  await page.waitForSelector('.shop');
  await wait(300);
  await shot('laden');
  await page.locator('.shop-card', { hasText: 'Regenbogenland' }).locator('button').click();
  await page.waitForSelector('.shop-confirm');
  await shot('laden-frage');
  await page.click('.shop-confirm >> text=Ja, holen');
  await page.waitForSelector('.shop-done', { timeout: 6000 });
  await shot('laden-fertig');
  await page.click('.shop-done >> text=Downloads öffnen');
  await page.waitForSelector('.files');
  await wait(400);
  await openItem('Regenbogenland');
  await page.waitForSelector('.viewer-wallpaper');
  await page.click('text=Als Hintergrund festlegen');
  await wait(500);
  const p = await jonas();
  if (p.settings.wallpaper !== 'regenbogen') throw new Error(`Hintergrund ist ${p.settings.wallpaper}`);
  if (p.bytes !== bytesBefore - 120) throw new Error(`Bytes: vorher ${bytesBefore}, jetzt ${p.bytes}`);
  results.push(`     App-Laden: ${bytesBefore} Bytes, nach dem Kauf ${p.bytes}`);
  await closeWindows();
  await wait(300);
  await shot('desktop-regenbogen');
});

await step('Sticker kleben und auf den Papierkorb ziehen', async () => {
  await openDesk('laden');
  await page.click('.shop-tab >> text=Sticker');
  await page.locator('.shop-card', { hasText: 'Einhorn' }).locator('button').click();
  await page.click('.shop-confirm >> text=Ja, holen');
  await page.waitForSelector('.shop-done', { timeout: 6000 });
  await page.click('.shop-done >> text=Gleich ansehen');
  await page.waitForSelector('.viewer-sticker');
  await page.click('text=Auf den Desktop kleben');
  await wait(300);
  await closeWindows();
  await page.waitForSelector('.sticker');
  await shot('desktop-sticker');
  const s = await center(page.locator('.sticker').first());
  const t = await center(page.locator('.desk-icon[data-app="papierkorb"]'));
  await page.mouse.move(s.x, s.y);
  await page.mouse.down();
  await page.mouse.move(t.x, t.y, { steps: 15 });
  await page.mouse.up();
  await wait(400);
  if (await page.$('.sticker')) throw new Error('Sticker ist noch da');
});

await step('Lied abspielen', async () => {
  await openDesk('dateien');
  await page.waitForSelector('.files');
  await place('Musik').click();
  await wait(300);
  await openItem('Alle meine Entchen');
  await page.waitForSelector('.viewer-song');
  await page.click('.viewer-song >> text=Abspielen');
  await page.waitForSelector('.song-disc.is-playing');
  await wait(600);
  await shot('lied');
  await page.click('.viewer-song >> text=Anhalten');
  await wait(200);
  if (await page.$('.song-disc.is-playing')) throw new Error('Lied läuft weiter');
  await closeWindows();
});

await step('Geheimcode mit Bildern', async () => {
  await openDesk('einstellungen');
  await page.waitForSelector('.settings');
  await page.click('.settings-tab >> text="Ich"');
  await page.click('text=Bilder-Code festlegen');
  const code = async (nums) => {
    for (const i of nums) {
      await page.click(`.pin-key[aria-label="Bild ${i}"]`);
      await wait(120);
    }
  };
  await code([1, 5, 9, 2]);
  await wait(500);
  await code([1, 5, 9, 2]);
  await wait(400);
  await shot('geheimcode-gespeichert');
  const pin = await page.evaluate(
    () => JSON.parse(localStorage.getItem('computerfuchs.save')).profiles.find((x) => x.name === 'Jonas').pin,
  );
  if (pin?.kind !== 'bilder') throw new Error('Geheimcode nicht gespeichert');
  await closeWindows();
  await page.click('.start-btn');
  await page.click('.start-foot >> text=Abmelden');
  await page.waitForSelector('.profile-card');
  const card = page.locator('.profile-card', { hasText: 'Jonas' });
  if ((await card.locator('.profile-lock').count()) !== 1) throw new Error('Schloss fehlt auf dem Profil');
  await card.click();
  await page.waitForSelector('.pin-prompt');
  await code([3, 3, 3, 3]);
  await wait(700);
  await code([4, 4, 4, 4]);
  await wait(700);
  await page.waitForSelector('text=Code vergessen?');
  await shot('geheimcode-falsch');
  await code([1, 5, 9, 2]);
  await page.waitForSelector('.desktop', { timeout: 5000 });
});

// --- Version 0.3: Was ist das Internet? ---

const textOf = async (sel) => (await (await page.$(sel))?.textContent())?.trim() ?? null;
async function waitStory(re, timeout = 10000) {
  await page.waitForFunction(
    (src) => new RegExp(src).test(document.querySelector('.net-story p')?.textContent ?? ''),
    re.source,
    { timeout },
  );
}
const nodePos = (id) => center(page.locator(`[data-node="${id}"] .nm-node-bg`));
/** Ein Kabel von Knoten zu Knoten ziehen. */
async function dragNode(a, b) {
  const p = await nodePos(a);
  const q = await nodePos(b);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(q.x, q.y, { steps: 12 });
  await page.mouse.up();
  await wait(250);
}
async function clickNode(id) {
  const p = await nodePos(id);
  await page.mouse.click(p.x, p.y);
  await wait(150);
}
/** Mitten auf ein Kabel klicken – auch wenn es eine Kurve ist. */
async function clickEdge(selector) {
  const pt = await page.$eval(selector, (el) => {
    const p = el.getPointAtLength(el.getTotalLength() / 2);
    const m = el.getScreenCTM();
    return { x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f };
  });
  await page.mouse.click(pt.x, pt.y);
  await wait(200);
}
async function internetMap() {
  if (await page.$('.level-map')) return;
  await closeWindows();
  await openDesk('internet');
  await page.waitForSelector('.level-map');
}
async function startNet(chapter, tier) {
  await internetMap();
  await page.locator('.level-card').nth(chapter).click();
  await page.waitForSelector('.level-intro');
  await wait(250);
  await page.locator('.tier-chip').nth(tier - 1).click();
  await page.click('.level-intro .btn-leaf');
  await page.waitForSelector('.net-level');
  await wait(400);
}
/** Vom Ergebnis direkt in die nächste Stufe. */
async function nextTier(tier) {
  await page.click(`.result-actions >> text=Stufe ${tier}`);
  await page.waitForSelector('.net-level');
  await wait(400);
}

await step('Internet 1: Das Netz (Geräte, Weg zu Oma, Netz das hält)', async () => {
  await dismissNotices();
  await closeWindows();
  await openDesk('internet');
  await page.waitForSelector('.level-map');
  await shot('internet-karte');
  // Stufe 1: Geräte am Router einstecken – zuerst absichtlich ans Internet
  await startNet(0, 1);
  await dragNode('laptop', 'internet');
  await waitStory(/über den Router/);
  for (const id of ['laptop', 'pc', 'handy', 'tv']) await dragNode(id, 'router');
  await waitStory(/alle Geräte im Netz/);
  await shot('internet-netz-1');
  await waitResult(10000);
  // Stufe 2: Kabel bis zu Omas Router – zuerst ein zu langes
  await nextTier(2);
  await dragNode('routerA', 'routerB');
  await waitStory(/So lang ist kein Kabel/);
  for (const [a, b] of [['routerA', 'provA'], ['provA', 'internet'], ['internet', 'provB'], ['provB', 'routerB']]) await dragNode(a, b);
  await waitStory(/reist deine Nachricht los/);
  await shot('internet-netz-2');
  await waitResult(15000);
  // Stufe 3: Eine Kette reicht nicht – der Traktor findet das schwache Kabel
  await nextTier(3);
  const ring = ['hamburg', 'berlin', 'dresden', 'muenchen', 'frankfurt', 'koeln'];
  for (let i = 0; i < ring.length - 1; i++) await dragNode(ring[i], ring[i + 1]);
  await page.click('.net-controls >> text=Netz prüfen');
  await waitStory(/Hamburg abgeschnitten/);
  await shot('internet-netz-3-traktor');
  await page.waitForSelector('.net-controls button:has-text("Netz prüfen"):not([disabled])', { timeout: 6000 });
  // Ein Kabel zu viel – ein Klick nimmt es wieder weg
  await dragNode('hamburg', 'frankfurt');
  if ((await textOf('.net-budget b')) !== '6') throw new Error('Kabel nicht gezählt');
  await clickEdge('[data-edge="frankfurt|hamburg"]');
  if ((await textOf('.net-budget b')) !== '5') throw new Error('Kabel nicht entfernt');
  await dragNode('koeln', 'hamburg');
  await page.click('.net-controls >> text=Netz prüfen');
  await waitStory(/Dein Netz hält/, 15000);
  await shot('internet-netz-3');
  await waitResult(10000);
  await backToMap();
});

await step('Internet 2: Bilder-Post (Pakete, Wegweiser, Reihenfolge)', async () => {
  await startNet(1, 1);
  await page.waitForSelector('[data-node="paket-0"]', { timeout: 6000 });
  for (let i = 0; i < 4; i++) await clickNode(`paket-${i}`);
  await waitStory(/Alle Pakete sind da/, 10000);
  await shot('internet-post-1');
  await waitResult(10000);
  // Stufe 2: Dem Wegweiser folgen – einmal absichtlich falsch abbiegen
  await nextTier(2);
  let wrongTried = false;
  const t0 = Date.now();
  while (!(await page.$('.result')) && Date.now() - t0 < 45000) {
    const to = (await page.$('.nm-node.tone-pick')) ? await textOf('.net-sign-row.is-current b') : null;
    if (!to) {
      await wait(150);
      continue;
    }
    const id = to.startsWith('direkt zu ') ? { Oma: 'oma', Zoo: 'zoo', Schule: 'schule' }[to.slice(10)] : to.replace('Router ', '');
    if (!wrongTried) {
      const picks = await page.$$eval('.nm-node.tone-pick', (els) => els.map((e) => e.getAttribute('data-node')));
      const other = picks.find((x) => x !== id);
      if (other) {
        await clickNode(other);
        await page.waitForSelector('.net-sign-row.is-hint', { timeout: 2000 });
        await shot('internet-post-2-hinweis');
        wrongTried = true;
      }
    }
    await clickNode(id);
    await wait(1000);
  }
  if (!wrongTried) throw new Error('Kein falscher Weg probiert');
  await waitResult(5000);
  // Stufe 3: Pakete ordnen, das verlorene nachfordern
  await nextTier(3);
  const packet = (num) => page.locator(`.tcp-packet:has(b:text-is("${num}"))`);
  await packet(3).waitFor({ timeout: 8000 });
  await packet(3).click();
  await waitStory(/Erst Paket 1/);
  for (let i = 1; i <= 6; i++) {
    await packet(i).waitFor({ timeout: 8000 });
    await packet(i).click();
    await wait(150);
  }
  await waitStory(/Paket 7 fehlt/);
  await shot('internet-post-3-fehlt');
  await page.click('.tcp-tray >> text=Paket 7 nochmal anfordern', { timeout: 8000 });
  await packet(7).waitFor({ timeout: 6000 });
  await packet(7).click();
  await wait(150);
  await packet(8).click();
  await waitStory(/HALLO OMA/);
  await waitResult(8000);
  await backToMap();
});

await step('Internet 3: Kabel im Meer (Umweg, Wettrennen, echter Ping)', async () => {
  await startNet(2, 1);
  for (let round = 0; round < 3; round++) {
    await page.click('.net-controls button:has-text("Losschicken"):not([disabled])', { timeout: 8000 });
    await page.waitForSelector('.nm-edge.tone-pick [data-edge]', { timeout: 6000 });
    if (round === 0) await shot('internet-meer-1-kaputt');
    await clickEdge('.nm-edge.tone-pick [data-edge]');
    await waitStory(/Angekommen/, 6000);
  }
  await waitResult(12000);
  // Stufe 2: Wettrennen – immer auf A tippen, richtig oder falsch
  await nextTier(2);
  for (let round = 0; round < 3; round++) {
    await page.click('.race-pick.is-a');
    const next = page.locator('.net-controls .btn-leaf');
    await next.waitFor({ timeout: 10000 });
    if (round === 0) await shot('internet-meer-2');
    await next.click();
    await wait(300);
  }
  await waitResult(8000);
  // Stufe 3: Ein echter Ping zum Server
  await nextTier(3);
  await page.click('.ping-btn');
  await page.waitForSelector('.net-question', { timeout: 15000 });
  const pings = await page.$$eval('.ping-list li b', (els) => els.map((e) => e.textContent));
  if (!pings.every((p) => /^[\d.]+ ms$/.test(p))) throw new Error(`Ping: ${pings.join(', ')}`);
  await shot('internet-meer-3-ping');
  await page.click('.net-controls >> text=nach Paris');
  await waitStory(/Nicht ganz/);
  await page.click('.net-controls >> text=zum Mond');
  await waitResult(8000);
  await backToMap();
});

await step('Internet 4: Telefonbuch (Bilder, Adresse tippen, wem gehört sie?)', async () => {
  await startNet(3, 1);
  let wrong = false;
  for (let round = 0; round < 4; round++) {
    await page.waitForSelector('.wish img', { timeout: 6000 });
    const want = await page.getAttribute('.wish img', 'src');
    const srcs = await page.$$eval('.phonebook-entry img', (els) => els.map((e) => e.getAttribute('src')));
    const right = srcs.indexOf(want);
    if (right < 0) throw new Error('Gesuchtes Bild fehlt im Telefonbuch');
    const entries = page.locator('.phonebook-entry');
    if (!wrong) {
      await entries.nth((right + 1) % srcs.length).click();
      await page.waitForSelector('.phonebook-entry.is-wrong');
      wrong = true;
    }
    await entries.nth(right).click();
    await page.waitForSelector('.site-page');
    if (round === 0) await shot('internet-telefonbuch-1');
  }
  await waitResult(10000);
  // Stufe 2: Adresse eintippen – erst mit Tippfehler
  await nextTier(2);
  for (let round = 0; round < 4; round++) {
    const input = page.locator('.mock-address input');
    await input.waitFor({ timeout: 8000 });
    const name = await textOf('.dns-target b');
    if (round === 0) {
      await input.click();
      await page.keyboard.type(name.replace('.de', '.dee'), { delay: 30 });
      await page.keyboard.press('Enter');
      await waitStory(/Tippfehler/, 5000);
      await shot('internet-telefonbuch-2-tippfehler');
      await input.fill('');
    }
    await input.click();
    await page.keyboard.type(name, { delay: 30 });
    await page.keyboard.press('Enter');
    await page.waitForSelector('.site-page', { timeout: 10000 });
    if (round === 0) await shot('internet-telefonbuch-2');
  }
  await waitResult(10000);
  // Stufe 3: Wem gehört die Adresse? Einmal absichtlich daneben
  await nextTier(3);
  for (let round = 0; round < 6; round++) {
    const host = new URL(await textOf('.mock-url')).hostname;
    const options = await page.$$eval('.owner-options .btn', (els) => els.map((e) => e.textContent.trim()));
    const owner = options.find((o) => host === o || host.endsWith(`.${o}`));
    if (!owner) throw new Error(`Kein Besitzer für ${host}`);
    const pick = round === 1 ? options.find((o) => o !== owner) : owner;
    await page.click(`.owner-options .btn:text-is("${pick}")`);
    await waitStory(round === 1 ? /Nicht ganz/ : /Richtig/);
    if (round === 1) await shot('internet-telefonbuch-3');
    await page.click('.net-controls .btn-leaf');
    await wait(250);
  }
  await waitResult(8000);
  await backToMap();
});

await step('Internet 5: Das Schloss (Schatzkiste, Geheimschrift, Passwort)', async () => {
  await startNet(4, 1);
  for (let i = 0; i < 6; i++) {
    await page.waitForSelector('.message-actions .btn:not([disabled])', { timeout: 10000 });
    const text = await textOf('.message-card p');
    // Die ersten beiden als Postkarte: Einmal ist das in Ordnung, einmal liest der Waschbär ein Geheimnis.
    await page.click(`.message-actions >> text=${i < 2 ? 'Postkarte' : 'Schatzkiste'}`);
    if (i < 2) {
      await page.waitForSelector('.raccoon-bubble', { timeout: 4000 });
      if (/Probier es nochmal/.test(await textOf('.net-story p'))) {
        await shot('internet-schloss-1-waschbaer');
        await page.waitForSelector('.message-actions .btn:not([disabled])', { timeout: 5000 });
        await page.click('.message-actions >> text=Schatzkiste');
      }
    }
    await page.waitForFunction((t) => document.querySelector('.message-card p')?.textContent !== t, text, { timeout: 12000 });
  }
  await waitResult(12000);
  // Stufe 2: Geheimschrift – erst getippt (mit einem Fehler), dann geklickt
  await nextTier(2);
  const shift = Number((await textOf('.cipher-key')).match(/(\d+) Stellen/)[1]);
  const move = (ch, by) => String.fromCharCode(((ch.charCodeAt(0) - 65 + by + 26) % 26) + 65);
  for (let round = 0; round < 3; round++) {
    await page.waitForSelector('.cipher-tile.is-current', { timeout: 6000 });
    const decode = (await page.$$('.cipher-row.is-plain .cipher-cell.is-pick')).length > 0;
    const shown = await page.$$eval('.cipher-tile small', (els) => els.map((e) => e.textContent).join(''));
    const wanted = [...shown].map((ch) => move(ch, decode ? -shift : shift)).join('');
    if (round === 0) {
      await typeKeys(wanted[0] === 'X' ? 'Y' : 'X');
      await page.waitForSelector('.cipher-cell.is-wrong', { timeout: 2000 });
      await typeKeys(wanted, 120);
    } else {
      const row = decode ? '.cipher-row.is-plain' : '.cipher-row.is-secret';
      for (const ch of wanted) {
        await page.click(`${row} .cipher-cell:text-is("${ch}")`);
        await wait(120);
      }
    }
    await waitStory(/Geknackt|Fertig!/, 4000);
    if (round === 2) await shot('internet-schloss-2');
    if (round < 2) {
      await page.waitForFunction(
        (s) => [...document.querySelectorAll('.cipher-tile small')].map((e) => e.textContent).join('') !== s,
        shown,
        { timeout: 6000 },
      );
    }
  }
  await waitResult(8000);
  // Stufe 3: Wo darf das Passwort hin?
  await nextTier(3);
  for (let round = 0; round < 6; round++) {
    await page.waitForSelector('.owner-options .btn:not([disabled])', { timeout: 6000 });
    await page.click(`.owner-options >> text=${round === 0 ? 'Ja, hier schon' : 'Nein, lieber nicht'}`);
    await waitStory(/Richtig|Aufgepasst/);
    if (round === 1) await shot('internet-schloss-3');
    await page.click('.net-controls .btn-leaf');
    await wait(250);
  }
  await waitResult(8000);
  await wait(600);
  const stars = await page.evaluate(() =>
    Object.values(JSON.parse(localStorage.getItem('computerfuchs.save')).profiles.find((p) => p.progress?.internet).progress.internet).map(
      (x) => x.stars,
    ),
  );
  if (stars.length !== 5 || stars.some((s) => s !== 3)) throw new Error(`Sterne im Internet-Kurs: ${stars.join(', ')}`);
  await closeWindows();
});

await step('Kiosk-Modus ohne Vollbild-Knopf', async () => {
  await page.goto(`${BASE}?kiosk`);
  await page.click('.power-btn');
  await page.waitForSelector('.profile-card', { timeout: 8000 });
  await page.locator('.profile-card').first().click();
  await page.waitForSelector('.taskbar');
  await wait(300);
  const fsButtons = await page.$$('.tray-btn');
  if (fsButtons.length !== 1) throw new Error(`erwartet nur den Ton-Knopf, gefunden ${fsButtons.length}`);
});

await step('Ohne Internet: Neustart aus dem Offline-Speicher', async () => {
  if (BASE.startsWith('file:')) return;
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    for (let i = 0; i < 50 && !navigator.serviceWorker.controller; i++) await new Promise((r) => setTimeout(r, 100));
  });
  await ctx.setOffline(true);
  try {
    await page.reload();
    await page.click('.power-btn', { timeout: 8000 });
    await page.waitForSelector('.profile-card', { timeout: 8000 });
    await page.locator('.profile-card').first().click();
    await page.waitForSelector('.taskbar');
    await openDesk('dateien');
    await page.waitForSelector('.files', { timeout: 8000 });
    await shot('offline-dateien');
  } finally {
    await ctx.setOffline(false);
  }
});

await step('Kleines Fenster (1024×600)', async () => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await wait(400);
  await shot('klein-1024');
});

await browser.close();
console.log(results.join('\n'));
console.log(`\nProbleme in der Konsole: ${problems.length}`);
for (const p of [...new Set(problems)].slice(0, 30)) console.log(p);
console.log(`Screenshots: ${OUT}`);
if (results.some((r) => r.startsWith('FAIL')) || problems.length > 0) process.exitCode = 1;
