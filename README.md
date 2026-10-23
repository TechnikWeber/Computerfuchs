**English** · [Deutsch](README.de.md)

# Computerfuchs

A learning computer for children aged about 5 to 15 that runs in the browser.
Computerfuchs ("computer fox") simulates a friendly desktop with windows, a
taskbar and a start menu, and the desktop grows with the child. A five-year-old
starts with big icons that open with one click. Through the mouse course they
unlock what a real computer does: double-clicking, dragging windows, right-click
menus and window buttons. Older children get the full desktop right away. The
goal is the one the toy learning laptops have, on any old laptop: learn how to
use a computer, and learn maths, reading and more on it.

**→ [technikweber.github.io/Computerfuchs](https://technikweber.github.io/Computerfuchs/)**

![The Computerfuchs desktop with icons, stickers, the taskbar and the mouse course](docs/images/hero-desktop.jpg)

> Early prototype (v0.2). The mouse course, keyboard, maths, files and the app
> store are playable. "What is the internet?", a paint box and more are on the
> roadmap (see the [concept](docs/CONCEPT.md)).

## Screenshots

The interface is in German.

<table>
  <tr>
    <td width="50%"><img src="docs/images/login.jpg" alt="Login screen with three child profiles, one with a padlock"><br><b>Login:</b> every child has a profile, optionally with a secret code.</td>
    <td width="50%"><img src="docs/images/desktop-age-5.jpg" alt="Desktop with big icons on an underwater wallpaper"><br><b>Age 5:</b> big icons, one click opens. The mouse course unlocks the rest.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/mouse-course.jpg" alt="A picture with a house, sun and tree, next to a right-click menu with colours"><br><b>Mouse course:</b> in Colour magic, the right-click paints.</td>
    <td width="50%"><img src="docs/images/maths.jpg" alt="The task 19 minus 17 with a 20-frame and a number pad"><br><b>Maths:</b> plus and minus to 20, with the 20-frame as help.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/keyboard-zoo.jpg" alt="A tulip with the letter T above an on-screen keyboard where the T key lights up"><br><b>Keyboard:</b> in the key zoo the key you need lights up – T for Tulpe (tulip).</td>
    <td width="50%"><img src="docs/images/keyboard-ten-fingers.jpg" alt="Two hands and a keyboard, every key in the colour of its finger"><br><b>Ten fingers:</b> every finger has its own colour.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/files.jpg" alt="The file explorer with the Bilder folder and Flinn's tasks"><br><b>Files:</b> folders, drag and drop, recycle bin – with Flinn's tasks.</td>
    <td width="50%"><img src="docs/images/app-store.jpg" alt="The app store with four wallpapers and prices in Bytes"><br><b>App store:</b> Bytes buy wallpapers, mouse pointers, stickers and songs.</td>
  </tr>
</table>

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
- **Keyboard, 7 levels × 3 tiers,** with an on-screen keyboard in the German
  QWERTZ layout:
  - Key zoo: find the key with the first letter of the picture ("A wie Affe"),
    on tier 3 by ear only.
  - Hopping hare: jump over hedgehogs with the space bar.
  - Hamster path: arrow keys through a maze, collecting cookies on tier 3.
  - Star rain: catch falling letters before they land.
  - Picture words: type the word for the picture, later with backspace and
    capitals.
  - Ten fingers: the home row, every key in the colour of its finger.
  - Typing pro: shift, punctuation, the @ (AltGr+Q) and a race against Flinn,
    measured in keystrokes per minute.
- **Maths, 6 levels.** Counting to 10, plus and minus to 10, to 20 (mostly
  crossing ten, with the 20-frame as optional help), times tables and mental
  arithmetic to 100. Rounds are generated, so every round is new. Small numbers
  are grouped in fives, as in German primary schools. Answers go in with an
  on-screen number pad or the real keyboard. A wrong answer gets a second try
  plus a picture of the task.
- **Files with a recycle bin.** Every child has a small file system of their own
  with pictures, music, documents and downloads. They create folders, rename
  them (with the same rules as on Windows), drag files into folders, copy and
  paste – with the mouse, the right-click menu, or Delete, F2 and Ctrl+C/V.
  Deleted things go to the recycle bin and can be restored. File extensions such
  as `.jpg` can be shown. Flinn sets six tasks, from the first folder to tidying
  up the downloads. Pictures, songs and texts open in a viewer.
- **App store.** Bytes buy wallpapers, mouse pointers in other colours, desktop
  stickers and songs. Whatever you get lands as a file in "Downloads". Opening it
  there and setting it as wallpaper is file-management practice on the side.
  There is no real money, and spending never lowers the rank.
- **Made for children who cannot read yet.** Every instruction has a picture and
  can be read aloud (browser speech synthesis). Buttons and targets are big, and
  nothing has a time limit unless the level is about speed. The mouse pointer
  comes in normal, large and huge sizes.
- **Bytes instead of coins.** Every new star earns Bytes. Lifetime Bytes decide
  the rank: Fuchswelpe, Jungfuchs, Schlaufuchs, then Computerfuchs at
  1 kilobyte, and Meisterfuchs after that.
- **Profiles with a secret code.** Each child picks an animal, a name and their
  age. If they like, they protect their profile with four pictures or four
  digits – their first password. If a child forgets the code, a grown-up resets
  it. Only grown-ups change the age, because it decides how much the desktop can
  do.
- **Saved in the browser, backed up as a file.** Progress is stored locally. A
  grown-ups' area behind a small arithmetic gate exports all profiles as a JSON
  file and imports them again, by button or by dropping the file on the login
  screen. Damaged or foreign files are rejected with an explanation instead of
  crashing.
- **Works offline.** After the first visit, Computerfuchs lives in the browser's
  offline storage and starts without internet too.
- **Kiosk-friendly.** Add `?kiosk` to the URL and the fullscreen toggle
  disappears; "shut down" returns to the power button. Two scripts turn a
  computer into a dedicated learning computer: one for Linux with Cage (Raspberry
  Pi included) and one for Windows. The [guide](docs/KIOSK.md) covers all three
  ways.
- German first. No sign-up, no ads, no cookies, no analytics, no external
  requests: fonts and images are served from the same origin.

## Try it with children

Feedback from real children is the most valuable thing for Computerfuchs. The
[testing guide](docs/TESTING.md) shows how a short test works for each age, what
to watch for, and has an observation sheet to print.

## Development

```sh
npm ci
npm run dev        # http://localhost:5173
npm test           # Vitest (logic: profiles, rewards, save files, windows, maths, files, keyboard)
npm run lint       # oxlint
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run e2e        # browser walkthrough against the preview (uses an installed Chrome/Edge)
npm run screenshots  # retake the README images (docs/images/), also against the preview
```

`npm run e2e` plays through the whole app in headless Chrome: all eight mouse
levels and all seven keyboard levels, maths, Flinn's file tasks, an app store
purchase, stickers, a song, the secret code, settings, the save file, a reload,
a second profile, kiosk mode and a restart without internet. It fails on any
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

- `src/core/` — profiles, rewards, save files, file system, app store, secret code, songs, sound, speech, small hooks
- `src/os/` — the simulated computer: boot, login, desktop, windows, taskbar, stickers, mouse pointers
- `src/apps/` — the apps; `registry.ts` lists them (apps marked "soon" are already in the start menu)
- `tools/` — the offline storage (service worker) generated at build time, and the script for the README images
- `kiosk/` — the kiosk scripts for Linux and Windows

## Licence

Code: MIT (see `LICENSE`). Images: Fluent Emoji by Microsoft (MIT). Fonts:
Nunito and Fredoka (SIL OFL). The songs are traditional public-domain children's
songs. Details in `THIRD_PARTY_NOTICES.md`.
