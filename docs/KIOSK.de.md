[English](KIOSK.md) · **Deutsch**

# Computerfuchs als Kiosk – drei Wege

Ein Kiosk ist ein Gerät, das nur eine Sache kann. Hier heißt das: Der Rechner
startet, meldet sich von selbst an und zeigt Computerfuchs im Vollbild. Es gibt
keine Adressleiste, keinen Desktop und keinen Ausweg – und geht der Browser zu,
startet er neu. So wird ein altes Notebook oder ein Raspberry Pi zum eigenen
Lerncomputer.

> ⚠️ **Noch nicht auf echter Hardware getestet.** Die beiden Skripte sind
> sorgfältig geschrieben und auf Fehler geprüft, liefen aber noch auf keinem
> echten Gerät. Bitte zuerst auf einem Rechner ausprobieren, auf dem nichts
> Wichtiges liegt, und gern [Rückmeldung geben](https://github.com/TechnikWeber/Computerfuchs/issues).

## Welcher Weg passt?

| | Für wen | Aufwand | Wie dicht? |
|---|---|---|---|
| **[1. Linux mit Cage](#weg-1-linux-mit-cage)** | ein altes Notebook oder ein PC, der nur noch Lerncomputer sein soll | etwa 45 Minuten | sehr dicht |
| **[2. Raspberry Pi](#weg-2-raspberry-pi)** | ein günstiger eigener Lerncomputer am Monitor oder Fernseher | etwa 30 Minuten | sehr dicht |
| **[3. Windows](#weg-3-windows-10-und-11)** | ein Familien-PC, den auch Erwachsene nutzen | etwa 10 Minuten | dicht (Modus „Shell“) oder locker (Modus „Autostart“) |

**Empfehlung:** Ein Gerät, das nur für Computerfuchs da ist, mit Linux und Cage
(Weg 1 oder 2). Das ist am dichtesten, schnell und kostenlos – und viele alte
Laptops, die Windows 11 nicht mehr schaffen, laufen damit wieder flott.

## Was alle drei Wege gemeinsam haben

- **Ein eigenes Kinderkonto** (`kind` bzw. `Kind`) ohne Passwort und ohne
  Verwaltungsrechte. Es meldet sich beim Start automatisch an. Die Konten der
  Erwachsenen bleiben, wie sie sind.
- **Nur Computerfuchs.** Der Browser läuft im Vollbild ohne Adressleiste. Alle
  anderen Seiten, Entwicklerwerkzeuge und private Fenster sind gesperrt.
- **Spielstände bleiben.** Der Browser nutzt ein normales Profil, nicht den
  „privaten“ Modus – sonst wären die Sterne nach jedem Neustart weg.
- **Läuft auch ohne Internet.** Nach dem ersten Start liegt Computerfuchs im
  Offline-Speicher des Browsers. Ist das WLAN mal weg, startet er trotzdem.
- **Ton und Vorlesen** funktionieren.
- **Sichern:** Im Erwachsenen-Bereich von Computerfuchs lassen sich die
  Spielstände als Datei sichern. Die Datei landet im Ordner `Computerfuchs` im
  Kinderkonto.

Die Seite selbst hilft mit `?kiosk` am Ende der Adresse: Dann fehlen der
Vollbild-Knopf und der Link zum Quellcode, und „Ausschalten“ führt zurück zum
Einschaltknopf. Das Gerät ausschalten kann eine Webseite nicht – dafür ist der
Power-Knopf da.

---

## Weg 1: Linux mit Cage

[Cage](https://github.com/cage-kiosk/cage) ist ein winziges Programm, das genau
ein anderes Programm im Vollbild zeigt – sonst nichts. Kein Desktop, keine
Taskleiste, kein Weg hinaus. Dazu kommt Chromium als Browser.

### Was du brauchst

- einen Laptop oder PC mit 64-Bit-Prozessor, mindestens 2 GB Arbeitsspeicher
  (besser 4 GB) und 16 GB Speicher
- einen USB-Stick (mindestens 2 GB) für die Installation
- Internet über Kabel oder WLAN
- eine Maus – ein Touchpad ist für kleine Kinder schwer

### Schritt für Schritt

1. **Debian herunterladen.** Auf [debian.org](https://www.debian.org/distrib/)
   das kleine Installationsabbild („netinst“) für 64-Bit-PCs holen.
2. **USB-Stick vorbereiten**, zum Beispiel mit
   [balenaEtcher](https://etcher.balena.io/) oder dem
   [Raspberry Pi Imager](https://www.raspberrypi.com/software/) („Eigenes
   Abbild verwenden“). Achtung: Was auf dem Stick war, ist danach weg.
3. **Debian installieren.** Vom Stick starten (oft mit F12, F2 oder Esc beim
   Einschalten) und den grafischen Installer nehmen:
   - Sprache **Deutsch**, Land **Deutschland**, Tastatur **Deutsch**
   - Rechnername zum Beispiel `computerfuchs`
   - Das **root-Passwort leer lassen** – dann darf dein eigenes Konto mit `sudo`
     verwalten.
   - Dein eigenes Konto anlegen, zum Beispiel `eltern`, **mit gutem Passwort**
   - Bei der **Softwareauswahl alle Häkchen bei Desktop-Umgebungen entfernen.**
     Nur „Standard-Systemwerkzeuge“ anlassen, auf Wunsch auch „SSH-Server“.
4. **Nach dem Neustart** mit deinem Konto anmelden (Textbildschirm) und
   eingeben:

   ```sh
   wget https://raw.githubusercontent.com/TechnikWeber/Computerfuchs/main/kiosk/linux/computerfuchs-kiosk.sh
   less computerfuchs-kiosk.sh          # ansehen, was es tut (q beendet)
   sudo bash computerfuchs-kiosk.sh --ssh
   sudo reboot
   ```

   Das Skript installiert Cage, Chromium, Ton und Sprachausgabe, legt das Konto
   `kind` an und richtet alles ein. Das dauert ein paar Minuten.

   **Warum `--ssh`?** Danach zeigt der Bildschirm nur noch Computerfuchs. Per SSH
   kommst du von einem anderen Rechner aus trotzdem hinein, um etwas zu ändern.
   Ohne zweiten Rechner nimm stattdessen `--vt` (dann wechselt Strg+Alt+F2 zu
   einer Text-Anmeldung, Strg+Alt+F1 zurück). Ohne beides geht es später nur noch
   mit einem USB-Stick.

5. **Fertig.** Nach dem Neustart erscheint Computerfuchs von selbst.

### Bedienen

- **Ausschalten:** einmal kurz auf den Power-Knopf drücken – Linux fährt sauber
  herunter.
- **Updates:** Sicherheitsupdates kommen automatisch. Computerfuchs selbst
  aktualisiert sich über das Internet.
- **Warten:** Mit `--ssh` kommst du von einem anderen Rechner hinein
  (`ssh eltern@computerfuchs.local` oder mit der IP-Adresse aus deinem Router).
  Mit `--vt` wechselt **Strg+Alt+F2** zu einer Text-Anmeldung, **Strg+Alt+F1**
  zurück zu Computerfuchs.
- **Rückgängig:** `sudo bash computerfuchs-kiosk.sh --uninstall` (das Konto
  `kind` bleibt; mit `--remove-user` wird es samt Spielständen gelöscht).

### Optionen

| Option | Wirkung |
|---|---|
| `--user NAME` | anderer Name für das Kinderkonto (Standard: `kind`) |
| `--url ADRESSE` | eigener Server statt GitHub Pages, z. B. `--url http://schule.local/computerfuchs/?kiosk` |
| `--ssh` | SSH einschalten, zum Warten von einem anderen Rechner aus |
| `--vt` | Wechsel auf andere Konsolen erlauben (Strg+Alt+F2 …) |
| `--last-screen` | bei zwei Bildschirmen nur den zuletzt angeschlossenen nutzen |
| `--no-updates` | keine automatischen Sicherheitsupdates einrichten |
| `--no-desktop` | Ist schon ein Desktop installiert, startet er nicht mehr; der Rechner wird ganz zum Lerncomputer. Rückgängig mit `--uninstall`. |
| `--session` | Desktop behalten: Computerfuchs nur als Sitzung am Anmeldebildschirm anbieten (siehe unten) |
| `--no-policies` | keine Chromium-Sperren setzen |
| `--uninstall` | alles wieder entfernen |

### Linux mit Desktop, den alle nutzen

Ist auf dem Rechner schon ein Desktop (GNOME, KDE, Xfce …) installiert, fragt
das Skript nach. Mit `--session` bleibt alles, wie es ist, und am
Anmeldebildschirm gibt es zusätzlich die Sitzung „Computerfuchs“ für das Konto
`kind`. Die automatische Anmeldung stellst du dann in den Benutzer-Einstellungen
des Desktops ein.

Ein Haken: Die Chromium-Sperren gelten unter Linux für **alle** Konten. Wer als
Erwachsener Chromium nutzt, kommt dann auch nur noch auf Computerfuchs. Nimm für
dich also einen anderen Browser (zum Beispiel Firefox), oder richte den Kiosk
mit `--no-policies` ohne Sperren ein.

### Wenn etwas nicht klappt

- **Was ist passiert?** Das Protokoll liegt in
  `/home/kind/.cache/computerfuchs-kiosk.log` (lesbar per SSH mit
  `sudo less /home/kind/.cache/computerfuchs-kiosk.log`).
- **Falsche Tastatur** (Z und Y vertauscht): `sudo dpkg-reconfigure keyboard-configuration`
  und neu starten. Für das Tastatur-Training ist ein deutsches Layout wichtig.
- **Kein Ton:** prüfen, ob der Lautsprecher in Computerfuchs an ist (unten
  rechts). Am Gerät hilft oft ein anderer Ausgang (HDMI statt Kopfhörer).
- **Die Stimme klingt blechern:** Unter Linux liest eSpeak NG vor – verständlich,
  aber nicht schön. Alle Texte stehen immer auch zum Lesen da.
- **Zwei Bildschirme** zeigen das Bild doppelt breit: `--last-screen`.

---

## Weg 2: Raspberry Pi

Ein Raspberry Pi mit Monitor, Maus und Tastatur ist ein günstiger eigener
Lerncomputer. Es ist dasselbe Skript wie bei Weg 1.

### Was du brauchst

- einen **Raspberry Pi 4 oder 5** mit mindestens 2 GB (besser 4 GB). Ein Pi 3
  ist zu langsam.
- das passende Netzteil, eine microSD-Karte ab 16 GB
- einen Monitor oder Fernseher mit HDMI (für den Pi 4 und 5: Micro-HDMI-Kabel)
- eine USB-Maus und eine **Tastatur mit deutschem Layout**
- Lautsprecher, falls der Monitor keinen hat (Ton geht über HDMI oder die
  Kopfhörerbuchse des Pi 4)

### Schritt für Schritt

1. Am eigenen Rechner den [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
   starten.
2. Gerät wählen, dann als Betriebssystem **Raspberry Pi OS (other) →
   Raspberry Pi OS Lite (64-bit)**. „Lite“ heißt: ohne Desktop – den braucht der
   Kiosk nicht.
3. Die Karte wählen und **„Einstellungen bearbeiten“**:
   - Hostname `computerfuchs`
   - Benutzername `eltern` mit gutem Passwort
   - WLAN-Name und -Passwort, WLAN-Land **DE**
   - Zeitzone `Europe/Berlin`, Tastaturlayout `de`
   - unter „Dienste“ **SSH aktivieren** (empfohlen)
4. Schreiben, die Karte in den Pi stecken, einschalten und etwa zwei Minuten
   warten.
5. Am Pi anmelden – oder vom eigenen Rechner aus mit
   `ssh eltern@computerfuchs.local` – und eingeben:

   ```sh
   wget https://raw.githubusercontent.com/TechnikWeber/Computerfuchs/main/kiosk/linux/computerfuchs-kiosk.sh
   sudo bash computerfuchs-kiosk.sh --ssh
   sudo reboot
   ```

6. **Fertig.** Nach dem Neustart erscheint Computerfuchs.

### Besonderheiten am Pi

- Das Skript erkennt den Pi und nimmt dessen eigenes Chromium (mit
  Grafikbeschleunigung). Auch dessen Updates kommen automatisch.
- **Raspberry Pi OS mit Desktop** geht auch: Dann fragt das Skript nach
  `--no-desktop` (Pi wird ganz zum Lerncomputer) oder `--session`.
- **Ausschalten:** Der Pi 5 hat einen Power-Knopf (einmal kurz drücken). Den
  Pi 4 erst ausstecken, wenn die grüne Lampe nicht mehr blinkt – sicherer ist
  es, per SSH `sudo poweroff` zu tippen.
- Bedienen, Optionen und Fehlersuche: wie bei [Weg 1](#bedienen).

---

## Weg 3: Windows 10 und 11

Für Windows gibt es das Skript `Install-Kiosk.ps1`. Es funktioniert mit Home,
Pro und Education und kennt zwei Modi:

- **Shell** (Standard): Das Kinderkonto bekommt **keine Windows-Oberfläche** –
  kein Startmenü, keine Taskleiste, keinen Explorer. Nur der Browser mit
  Computerfuchs läuft. Schließt das Kind ihn, startet er neu.
- **Autostart:** Windows bleibt, wie es ist. Computerfuchs startet beim Anmelden
  im Vollbild. Das ist sanfter, aber nicht dicht – über das Startmenü kommt man
  an andere Programme. Gut für den Anfang oder falls „Shell“ Probleme macht.

### Welcher Browser?

- **Google Chrome** (empfohlen): Chrome im Kiosk-Modus behält ein normales
  Profil, die Spielstände bleiben zuverlässig. Chrome „für alle Benutzer“
  installieren (das ist der normale Installer).
- **Microsoft Edge** ist immer da. Microsofts eigener Edge-Kiosk-Modus (auch der
  „zugewiesene Zugriff“ in Windows Pro) läuft aber immer **InPrivate** – dann
  wären die Spielstände nach jedem Neustart weg. Das Skript startet Edge deshalb
  als App-Fenster im Vollbild mit normalem Profil.
- **Firefox** geht auch (`-Browser Firefox`).

Ohne Angabe nimmt das Skript Chrome, sonst Edge, sonst Firefox.

### Schritt für Schritt

1. Dein eigenes Windows-Konto braucht ein **Passwort** – sonst könnte sich das
   Kind einfach als du anmelden.
2. Auf GitHub die Datei
   [`kiosk/windows/Install-Kiosk.ps1`](../kiosk/windows/Install-Kiosk.ps1)
   öffnen und mit **„Download raw file“** herunterladen.
3. Startmenü öffnen, „PowerShell“ tippen, **Rechtsklick → Als Administrator
   ausführen**.
4. In den Download-Ordner wechseln und erst einmal nur **ansehen**, was
   passieren würde:

   ```powershell
   cd $HOME\Downloads
   powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -WhatIf
   ```

5. Passt alles? Dann wirklich einrichten:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1
   ```

6. **Neu starten.** Windows meldet das Konto „Kind“ an, und Computerfuchs
   startet.

### Was das Skript tut

1. Es legt das Standardkonto **„Kind“ ohne Passwort** an (oder nimmt ein
   vorhandenes Konto, das kein Administrator ist) und bereitet sein Profil vor.
2. Es schreibt ein kleines Startskript nach
   `C:\ProgramData\Computerfuchs\Start-Computerfuchs.ps1`. Das startet den
   Browser und startet ihn neu, wenn er zugeht.
3. Nur für „Kind“: Statt des Explorers startet dieses Skript (Modus „Shell“),
   oder es startet beim Anmelden mit (Modus „Autostart“).
4. Nur für „Kind“: Task-Manager, Entwicklerwerkzeuge, private Fenster und alle
   Seiten außer Computerfuchs werden gesperrt – für Chrome, Edge und Firefox.
5. „Kind“ meldet sich beim Start automatisch an.
6. Die Datenschutz-Fragen beim ersten Anmelden neuer Konten werden übersprungen
   (sonst würde dort ein Fenster warten).

### Bedienen

- **Raus kommen:** **Strg+Alt+Entf → Abmelden**, dann mit dem Eltern-Konto
  anmelden.
- **Einmal ohne automatische Anmeldung starten:** beim Hochfahren die
  Umschalttaste gedrückt halten.
- **Ausschalten:** kurz auf den Power-Knopf drücken, oder Strg+Alt+Entf → unten
  rechts.
- **Rückgängig:** als Administrator
  `powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -Uninstall`.
  Das Konto „Kind“ bleibt; mit `-Uninstall -RemoveUser` wird es samt
  Spielständen gelöscht – vorher im Erwachsenen-Bereich sichern!

### Optionen

| Option | Wirkung |
|---|---|
| `-User NAME` | anderer Name für das Kinderkonto (Standard: `Kind`) |
| `-Url ADRESSE` | eigener Server statt GitHub Pages |
| `-Browser Chrome\|Edge\|Firefox` | Browser fest wählen (Standard: `Auto`) |
| `-Mode Autostart` | Windows-Oberfläche behalten |
| `-NoAutoLogon` | keine automatische Anmeldung |
| `-WhatIf` | nur zeigen, was passieren würde |
| `-Uninstall`, `-RemoveUser` | entfernen |

### Wenn etwas nicht klappt

- **Die automatische Anmeldung klappt nicht:** Unter *Einstellungen → Konten →
  Anmeldeoptionen* den Schalter ausschalten, der für Microsoft-Konten nur noch
  die Windows-Hello-Anmeldung erlaubt, und neu starten.
- **Schwarzer Bildschirm mit Mauszeiger:** Der Browser startet nicht. Mit
  Strg+Alt+Entf → Abmelden zurück, als Eltern anmelden und in
  `C:\Users\Kind\AppData\Local\Computerfuchs-Kiosk.log` nachsehen. Notfalls
  `-Uninstall` und es mit `-Mode Autostart` versuchen.
- **Chrome fragt nach einer Anmeldung oder zeigt eine Willkommensseite:** einmal
  mit `-Mode Autostart` einrichten, als Kind die Fragen wegklicken, dann wieder
  mit „Shell“ einrichten.
- **Wirken die Sperren?** Im Kinderkonto führt Strg+T (neuer Tab) nur zu einer
  Sperrseite. Strg+W schließt sie wieder.

---

## Sicherheit und Grenzen

Ein Kiosk hält neugierige Kinder davon ab, aus Versehen woanders zu landen. Er
ist kein Tresor:

- Wer das Gerät in der Hand hat, kann es von einem USB-Stick starten.
- Unter Windows bleibt Strg+Alt+Entf immer offen – so kommen Erwachsene heraus.
  Das Kind kann sich dort abmelden; dann erscheint der Anmeldebildschirm.
- Computerfuchs selbst sammelt keine Daten und spricht mit keinem fremden
  Server. Die Spielstände liegen nur im Browser des Kinderkontos.

Wer im Netz der Schule einen eigenen Server betreibt, kann Computerfuchs dort
ablegen: `npm run build` erzeugt den Ordner `dist/`, der auf jedem Webserver
läuft. Dann mit `--url` bzw. `-Url` auf diese Adresse zeigen.
