**English** · [Deutsch](README.de.md)

# Computerfuchs

A learning computer for children aged about 5 to 15 that runs in the browser.
Computerfuchs ("computer fox") simulates a friendly desktop with windows, a
taskbar and a start menu, and the desktop grows with the child. A five-year-old
starts with three huge icons that open with one click. Through the mouse course
they unlock what a real computer does: double-clicking, dragging windows,
right-click menus and window buttons. Older children get the full desktop right
away. The goal is the one the toy learning laptops have, on any old laptop: learn
how to use a computer, and learn maths, reading and more on it.

**→ [technikweber.github.io/Computerfuchs](https://technikweber.github.io/Computerfuchs/)**

> Early prototype (v0.1). The mouse course and the maths app are playable. Keyboard,
> files, "What is the internet?" and more are on the roadmap (see the
> [concept](docs/CONCEPT.md)).

## What it does

- **A desktop that grows with the child.** Four desktop features are earned in
  the mouse course rather than handed out: open by double-click, move windows,
  right-click menu, and minimise/maximise/resize. Flinn the fox announces each
  one and lets the child try it straight away. Ages 7–9 start with the first two,
  ages 10 and up with all of them, and parents can switch each one on or off.
- **Mouse course, 8 levels × 3 tiers.**
  - Flashlight: move the pointer to find hidden animals in the dark.
  - Balloons: click to pop them. Tier 3 pops only the red ones.
  - Presents: double-click to open. The allowed gap between the two clicks gets
    shorter on every tier.
  - Feeding: drag each food to the right animal.
  - Bee path: follow a road, with checkpoints after a slip.
  - Colour magic: a right-click menu colours a picture. Tier 2 matches a template,
    tier 3 hides the colours in a submenu.
  - Diving: scroll through an ocean.
  - Window pro: move a window, resize it, minimise, restore, maximise and close it.
- **Maths, 6 levels.** Counting to 10, plus and minus to 10, to 20 (mostly
  crossing ten, with the 20-frame as optional help), times tables and mental
  arithmetic to 100. Rounds are generated, so every round is new. Small numbers
  are grouped in fives, as in German primary schools. Answers go in with an
  on-screen number pad or the real keyboard. A wrong answer gets a second try
  plus a picture of the task.
- **Made for children who cannot read yet.** Every instruction has a picture and
  can be read aloud (browser speech synthesis). Buttons and targets are big, and
  nothing has a time limit unless the level is about speed. The mouse pointer
  comes in normal, large and huge sizes.
- **Bytes instead of coins.** Every new star earns Bytes. Lifetime Bytes decide
  the rank: Fuchswelpe, Jungfuchs, Schlaufuchs, then Computerfuchs at
  1 kilobyte, and Meisterfuchs after that. The rank shows how far a child has
  come, and the Bytes will pay for wallpapers, pointers and stickers in the
  app store later.
- **Profiles on a login screen.** Each child picks an animal, a name and their
  age. That is the first lesson about user accounts. Later, only grown-ups can
  change the age, because it decides how much the desktop can do.
- **Saved in the browser, backed up as a file.** Progress is stored locally. A
  grown-ups' area behind a small arithmetic gate exports all profiles as a JSON
  file and imports them again, by button or by dropping the file on the login
  screen. Damaged or foreign files are rejected with an explanation instead of
  crashing.
- **Kiosk-friendly.** Add `?kiosk` to the URL and the fullscreen toggle
  disappears; "shut down" returns to the power button. Together with the
  operating system's kiosk mode, any laptop becomes a dedicated learning
  computer (see the [concept](docs/CONCEPT.md#kiosk-operation)).
- German first. No sign-up, no ads, no cookies, no analytics, no external
  requests: fonts and images are served from the same origin.

## Development

```sh
npm ci
npm run dev        # http://localhost:5173
npm test           # Vitest (logic: profiles, rewards, save files, windows, maths)
npm run lint       # oxlint
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run e2e        # browser walkthrough against the preview (uses an installed Chrome/Edge)
```

`npm run e2e` plays all eight mouse levels, maths, settings, the save file, a
reload, a second profile and kiosk mode in headless Chrome, and fails on any
console error. Pass a URL to test the live site:
`npm run e2e -- https://technikweber.github.io/Computerfuchs/`. Screenshots go
to `test-results/e2e/`.

Stack: React 19, TypeScript 7, Vite 8, Vitest, oxlint — the same as
[LinuxKompass](https://github.com/TechnikWeber/LinuxKompass) and
[JobKompass](https://github.com/TechnikWeber/JobKompass). Every push to `main`
is tested, built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.
The build uses a relative base path, so `dist/` also works on a school server or
as a local copy.

Layout:

- `src/core/` — profiles, rewards, save files, sound, speech, small hooks
- `src/os/` — the simulated computer: boot, login, desktop, windows, taskbar
- `src/apps/` — the apps; `registry.ts` lists them (apps marked "soon" are already in the start menu)

## Licence

Code: MIT (see `LICENSE`). Images: Fluent Emoji by Microsoft (MIT). Fonts:
Nunito and Fredoka (SIL OFL). Details in `THIRD_PARTY_NOTICES.md`.
