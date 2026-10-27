# Computerfuchs as a kiosk – three ways

A kiosk is a device that does one thing. Here that means: the computer starts,
signs in by itself and shows Computerfuchs full screen. There is no address bar,
no desktop and no way out, and if the browser closes, it starts again. An old
laptop or a Raspberry Pi becomes a dedicated learning computer.

> ⚠️ **Not yet tested on real hardware.** Both scripts are written carefully and
> checked for errors, but they have not run on a real device yet. Please try them
> on a computer without anything important on it first, and
> [tell us how it went](https://github.com/TechnikWeber/Computerfuchs/issues).

## Which way fits?

| | For | Effort | How locked down? |
|---|---|---|---|
| **[1. Linux with Cage](#way-1-linux-with-cage)** | an old laptop or PC that should only be a learning computer | about 45 minutes | very |
| **[2. Raspberry Pi](#way-2-raspberry-pi)** | a cheap dedicated learning computer on a monitor or TV | about 30 minutes | very |
| **[3. Windows](#way-3-windows-10-and-11)** | a family PC that grown-ups use too | about 10 minutes | locked ("Shell" mode) or loose ("Autostart" mode) |

**Recommendation:** a device that exists only for Computerfuchs, running Linux
with Cage (way 1 or 2). It is the most locked down, fast and free, and many old
laptops that cannot run Windows 11 become quick again.

## What all three ways have in common

- **A separate child account** (`kind` or `Kind`) without a password and without
  admin rights. It signs in automatically at startup. The grown-ups' accounts
  stay as they are.
- **Only Computerfuchs.** The browser runs full screen without an address bar.
  Every other site, the developer tools and private windows are blocked.
- **Progress is kept.** The browser uses a normal profile, not private mode –
  otherwise the stars would be gone after every restart.
- **Works without internet.** After the first start, Computerfuchs lives in the
  browser's offline storage. If the Wi-Fi drops, it still starts.
- **Sound and read-aloud** work.
- **Backups:** the grown-ups' area in Computerfuchs saves all progress as a
  file. It lands in the `Computerfuchs` folder of the child account.

The page helps with `?kiosk` at the end of the address: the fullscreen button and
the source-code link disappear, and "shut down" returns to the power button. A
web page cannot switch the device off – that is what the power button is for.

---

## Way 1: Linux with Cage

[Cage](https://github.com/cage-kiosk/cage) is a tiny program that shows exactly
one other program full screen – nothing else. No desktop, no taskbar, no way
out. Chromium is the browser.

### What you need

- a laptop or PC with a 64-bit processor, at least 2 GB of RAM (4 GB is better)
  and 16 GB of storage
- a USB stick (2 GB or more) for the installation
- internet via cable or Wi-Fi
- a mouse – touchpads are hard for small children

### Step by step

1. **Download Debian:** the small installation image ("netinst") for 64-bit PCs
   from [debian.org](https://www.debian.org/distrib/).
2. **Prepare the USB stick**, for example with
   [balenaEtcher](https://etcher.balena.io/) or the
   [Raspberry Pi Imager](https://www.raspberrypi.com/software/) ("Use custom").
   Everything on the stick is erased.
3. **Install Debian.** Boot from the stick (often F12, F2 or Esc at power-on)
   and use the graphical installer:
   - language, country and keyboard: whatever you need (for the typing course a
     German keyboard layout is best)
   - host name, for example `computerfuchs`
   - **leave the root password empty** – then your own account may administer
     the system with `sudo`
   - create your own account, for example `parent`, **with a good password**
   - in **software selection, untick every desktop environment.** Keep only
     "standard system utilities", and "SSH server" if you like.
4. **After the reboot**, sign in with your account (text screen) and type:

   ```sh
   wget https://raw.githubusercontent.com/TechnikWeber/Computerfuchs/main/kiosk/linux/computerfuchs-kiosk.sh
   less computerfuchs-kiosk.sh          # see what it does (q quits)
   sudo bash computerfuchs-kiosk.sh --ssh
   sudo reboot
   ```

   The script installs Cage, Chromium, sound and speech, creates the `kind`
   account and sets everything up. It takes a few minutes.

   **Why `--ssh`?** Afterwards the screen only shows Computerfuchs. With SSH you
   can still get in from another computer. Without a second computer, use
   `--vt` instead (Ctrl+Alt+F2 then switches to a text login, Ctrl+Alt+F1 back).
   Without either, you can only get back in with a USB stick.

5. **Done.** After the reboot, Computerfuchs appears by itself.

### Using it

- **Switch off:** press the power button once, briefly. Linux shuts down cleanly.
- **Updates:** security updates install automatically. Computerfuchs updates
  itself over the internet.
- **Maintenance:** with `--ssh`, use `ssh parent@computerfuchs.local` (or the IP
  address from your router). With `--vt`, **Ctrl+Alt+F2** switches to a text
  login and **Ctrl+Alt+F1** back to Computerfuchs.
- **Undo:** `sudo bash computerfuchs-kiosk.sh --uninstall` (the `kind` account
  stays; add `--remove-user` to delete it with all progress).

### Options

| Option | Effect |
|---|---|
| `--user NAME` | another name for the child account (default: `kind`) |
| `--url ADDRESS` | your own server instead of GitHub Pages, e.g. `--url http://school.local/computerfuchs/?kiosk` |
| `--ssh` | enable SSH for maintenance from another computer |
| `--vt` | allow switching to other consoles (Ctrl+Alt+F2 …) |
| `--last-screen` | with two screens, use only the one connected last |
| `--no-updates` | do not set up automatic security updates |
| `--no-desktop` | an installed desktop no longer starts; the computer becomes a learning computer only. Undo with `--uninstall`. |
| `--session` | keep the desktop: offer Computerfuchs as a session on the login screen (see below) |
| `--no-policies` | do not set Chromium restrictions |
| `--uninstall` | remove everything again |

### Linux with a desktop that everyone uses

If a desktop (GNOME, KDE, Xfce …) is already installed, the script asks. With
`--session` everything stays as it is, and the login screen gets an extra
"Computerfuchs" session for the `kind` account. Set up automatic sign-in in the
desktop's user settings.

One catch: on Linux the Chromium restrictions apply to **all** accounts. A
grown-up using Chromium would only reach Computerfuchs too. Use another browser
yourself (for example Firefox), or set up the kiosk with `--no-policies`.

### Troubleshooting

- **What happened?** The log is at `/home/kind/.cache/computerfuchs-kiosk.log`
  (over SSH: `sudo less /home/kind/.cache/computerfuchs-kiosk.log`).
- **Wrong keyboard layout** (Z and Y swapped): `sudo dpkg-reconfigure keyboard-configuration`
  and reboot. The typing course expects a German layout.
- **No sound:** check the speaker button in Computerfuchs (bottom right). On the
  device, another output often helps (HDMI instead of headphones).
- **The voice sounds tinny:** on Linux, eSpeak NG reads aloud – clear, but not
  pretty. Every text is always on screen too.
- **Two screens** show one picture stretched across both: `--last-screen`.

---

## Way 2: Raspberry Pi

A Raspberry Pi with a monitor, mouse and keyboard is a cheap dedicated learning
computer. It uses the same script as way 1.

### What you need

- a **Raspberry Pi 4 or 5** with at least 2 GB (4 GB is better). A Pi 3 is too
  slow.
- the matching power supply and a microSD card of 16 GB or more
- a monitor or TV with HDMI (micro-HDMI cable for the Pi 4 and 5)
- a USB mouse and a keyboard (German layout for the typing course)
- speakers if the monitor has none (sound goes over HDMI or the Pi 4's headphone
  jack)

### Step by step

1. On your own computer, start the
   [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Choose your device, then **Raspberry Pi OS (other) → Raspberry Pi OS Lite
   (64-bit)**. "Lite" means without a desktop – the kiosk does not need one.
3. Choose the card and **"Edit settings"**:
   - host name `computerfuchs`
   - user name `parent` with a good password
   - Wi-Fi name and password, Wi-Fi country
   - time zone and keyboard layout
   - under "Services", **enable SSH** (recommended)
4. Write the card, put it in the Pi, switch on and wait about two minutes.
5. Sign in on the Pi – or from your computer with
   `ssh parent@computerfuchs.local` – and type:

   ```sh
   wget https://raw.githubusercontent.com/TechnikWeber/Computerfuchs/main/kiosk/linux/computerfuchs-kiosk.sh
   sudo bash computerfuchs-kiosk.sh --ssh
   sudo reboot
   ```

6. **Done.** After the reboot, Computerfuchs appears.

### Pi specifics

- The script detects the Pi and uses its own Chromium build (with graphics
  acceleration). Its updates install automatically too.
- **Raspberry Pi OS with desktop** works as well: the script then asks for
  `--no-desktop` (the Pi becomes a learning computer only) or `--session`.
- **Switching off:** the Pi 5 has a power button (press once). Unplug a Pi 4 only
  when the green light has stopped blinking – safer is `sudo poweroff` over SSH.
- Using it, options and troubleshooting: as in [way 1](#using-it).

---

## Way 3: Windows 10 and 11

For Windows there is the script `Install-Kiosk.ps1`. It works on Home, Pro and
Education and has two modes:

- **Shell** (default): the child account gets **no Windows interface** – no
  start menu, no taskbar, no Explorer. Only the browser with Computerfuchs runs.
  If the child closes it, it starts again.
- **Autostart:** Windows stays as it is, and Computerfuchs starts full screen at
  sign-in. Gentler, but not locked down – the start menu leads to other programs.
  Good for a first try, or if "Shell" causes trouble.

### Which browser?

- **Google Chrome** (recommended): Chrome's kiosk mode keeps a normal profile,
  so progress is kept reliably. Install Chrome "for all users" (the normal
  installer does that).
- **Microsoft Edge** is always there. But Microsoft's own Edge kiosk mode (and
  "assigned access" in Windows Pro) always runs **InPrivate** – progress would be
  gone after every restart. So the script starts Edge as a full-screen app window
  with a normal profile.
- **Firefox** works too (`-Browser Firefox`).

Without a choice, the script takes Chrome, then Edge, then Firefox.

### Step by step

1. Your own Windows account needs a **password** – otherwise the child could
   simply sign in as you.
2. On GitHub, open
   [`kiosk/windows/Install-Kiosk.ps1`](../kiosk/windows/Install-Kiosk.ps1) and
   use **"Download raw file"**.
3. Open the start menu, type "PowerShell", **right-click → Run as
   administrator**.
4. Go to your downloads and first only **look** at what would happen:

   ```powershell
   cd $HOME\Downloads
   powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -WhatIf
   ```

5. All good? Then set it up for real:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1
   ```

6. **Restart.** Windows signs in as "Kind" and Computerfuchs starts.

### What the script does

1. It creates the standard account **"Kind" without a password** (or uses an
   existing account that is not an administrator) and prepares its profile.
2. It writes a small launcher to
   `C:\ProgramData\Computerfuchs\Start-Computerfuchs.ps1`, which starts the
   browser and restarts it when it closes.
3. For "Kind" only: the launcher replaces Explorer ("Shell" mode) or starts at
   sign-in ("Autostart" mode).
4. For "Kind" only: Task Manager, developer tools, private windows and every site
   except Computerfuchs are blocked – for Chrome, Edge and Firefox.
5. "Kind" signs in automatically at startup.
6. The privacy questions at the first sign-in of new accounts are skipped
   (otherwise a window would wait there).

### Using it

- **Getting out:** **Ctrl+Alt+Del → Sign out**, then sign in with the grown-up
  account.
- **Start once without automatic sign-in:** hold Shift while Windows starts.
- **Switch off:** press the power button briefly, or Ctrl+Alt+Del → bottom right.
- **Undo:** as administrator,
  `powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -Uninstall`.
  The "Kind" account stays; `-Uninstall -RemoveUser` deletes it with all
  progress – back it up in the grown-ups' area first!

### Options

| Option | Effect |
|---|---|
| `-User NAME` | another name for the child account (default: `Kind`) |
| `-Url ADDRESS` | your own server instead of GitHub Pages |
| `-Browser Chrome\|Edge\|Firefox` | pick the browser (default: `Auto`) |
| `-Mode Autostart` | keep the Windows interface |
| `-NoAutoLogon` | no automatic sign-in |
| `-WhatIf` | only show what would happen |
| `-Uninstall`, `-RemoveUser` | remove |

### Troubleshooting

- **Automatic sign-in does not work:** in *Settings → Accounts → Sign-in
  options*, turn off the switch that allows only Windows Hello sign-in for
  Microsoft accounts, then restart.
- **Black screen with a mouse pointer:** the browser does not start. Use
  Ctrl+Alt+Del → Sign out, sign in as the grown-up and look at
  `C:\Users\Kind\AppData\Local\Computerfuchs-Kiosk.log`. If needed, `-Uninstall`
  and try `-Mode Autostart`.
- **Chrome asks to sign in or shows a welcome page:** set up once with
  `-Mode Autostart`, click the questions away as the child, then set up "Shell"
  again.
- **Do the restrictions work?** In the child account, Ctrl+T (new tab) only
  leads to a block page. Ctrl+W closes it.

---

## Security and limits

A kiosk keeps curious children from ending up somewhere else by accident. It is
not a safe:

- Anyone holding the device can boot it from a USB stick.
- On Windows, Ctrl+Alt+Del always stays available – that is how grown-ups get
  out. The child can sign out there; the login screen appears.
- Computerfuchs itself collects no data and talks to no third-party server.
  Progress lives only in the child account's browser.

If your school runs its own server, put Computerfuchs there: `npm run build`
creates the `dist/` folder, which runs on any web server. Point `--url` or
`-Url` at that address.
