[English](CONCEPT.md) · **Deutsch**

# Computerfuchs – Konzept

Stand: 23. Oktober 2026 · Version 0.2

## Die Idee

Computerfuchs ist ein Lerncomputer im Browser, so wie die Lerncomputer aus dem
Spielwarenladen. Er läuft aber auf jedem Laptop, kostet nichts und zeigt keine
Werbung. Er verfolgt zwei Ziele, die sich gegenseitig tragen:

1. **Den Computer bedienen lernen:** Maus, Tastatur, Fenster, Dateien, Internet,
   Sicherheit.
2. **Am Computer lernen:** Mathe, Deutsch, Englisch, Sachunterricht und Logik.

Das Ganze ist für Kinder von etwa 5 bis 15 Jahren gedacht. Alle sehen dieselbe
Oberfläche, aber sie passt sich an: Für die Kleinen ist sie stark vereinfacht und
wird vorgelesen, für Jugendliche ist sie ein vollwertiger Desktop.

Viele Kinder können heute auf dem Tablet wischen, haben aber noch nie eine Maus
benutzt. Genau dort setzt Computerfuchs an.

## Grundsätze

1. **Der Computer wächst mit.** Der Desktop ist selbst Teil des Lehrplans.
   Funktionen werden im Maustraining freigeschaltet und von Flinn angekündigt:

   | Funktion | Freigeschaltet durch | Sofort da ab |
   |---|---|---|
   | Symbole per Doppelklick öffnen (vorher genügt ein Klick) | Level 3 „Geschenke“ | 7 Jahren |
   | Fenster verschieben (vorher immer bildschirmfüllend) | Level 4 „Tiere füttern“ | 7 Jahren |
   | Rechtsklick-Menü auf dem Desktop | Level 6 „Farbenzauber“ | 10 Jahren |
   | Verkleinern, Vergrößern, Größe ziehen | Level 8 „Fenster-Profi“ | 10 Jahren |

   Eltern können jede Funktion im Erwachsenen-Bereich einzeln an- und ausschalten.
   Auch das Alter stellen dort nur Erwachsene um. Es bestimmt Symbolgröße, offene
   Level und die Funktionen zu Beginn. Könnte ein Kind es selbst ändern, ließe
   sich das Mitwachsen einfach überspringen.

2. **Echte Begriffe, aber keine Kopie.** Computerfuchs sieht weder wie Windows
   noch wie macOS aus. Er hat aber alles, was überall gleich funktioniert:
   Fenster mit Titelleiste und drei Knöpfen, eine Taskleiste, ein Start-Menü,
   einen Rechtsklick, einen Papierkorb, Einstellungen, einen Anmeldebildschirm
   und das echte Power-Symbol. Was die Kinder hier lernen, finden sie an jedem
   Rechner wieder.

3. **Für Kinder, die noch nicht lesen.** Jede Anleitung hat ein Bild und wird auf
   Wunsch vorgelesen. Dazu kommen große Ziele und große Mauszeiger. Lesen muss
   niemand können, um anzufangen.

4. **Kein Scheitern.** Wer sich verrechnet, hat einen zweiten Versuch. Wer vom
   Bienenweg abkommt, macht an der letzten Blume weiter. Zeitdruck gibt es nur,
   wo Tempo das Lernziel ist. Jede geschaffte Runde bringt mindestens einen Stern.

5. **Belohnungen mit Sinn.** Die Währung heißt *Bytes*. Ab 1.000 zählt sie in
   Kilobyte, und so lernen Kinder nebenbei, was die Einheiten bedeuten. Im
   App-Laden werden Belohnungen zu echten Dateien (siehe [Belohnung](#belohnung)).

6. **Datenschutz von Anfang an.** Es gibt keinen Server, kein Konto, keine
   Cookies, keine Analyse und keine fremden Anfragen. Alle Daten bleiben auf dem
   Gerät. Schulen können die fertigen Dateien sogar selbst hosten.

7. **Offen.** Der Code steht unter der MIT-Lizenz. Neue Apps und Inhalte lassen
   sich ohne Umbau ergänzen.

## Was Computerfuchs heute kann

Stand: Version 0.2, dazu „Was ist das Internet?“ aus 0.3 und die Installation
als App aus 0.4.

- Einschalten (mit Vollbild), ein Anmeldebildschirm mit Profilen, der
  Profil-Assistent (Tier, Name, Alter), ein Geheimcode aus Bildern oder Zahlen
  und Ausschalten
- ein Desktop mit zehn Hintergründen (vier davon aus dem App-Laden), Fenstern,
  Taskleiste, Start-Menü, Rechtsklick-Menü, Stickern, Meldungen, Rängen und
  Konfetti
- **Maustraining:** 8 Level mit je 3 Stufen
- **Tastatur:** 7 Level mit je 3 Stufen, vom Tastenzoo bis zum Wettrennen gegen
  Flinn. Die Listen stehen in der [README](../README.de.md).
- **Rechnen:** 6 Level vom Zählen bis zum Kopfrechnen bis 100, jede Runde neu
  erzeugt
- **Was ist das Internet?:** 5 Kapitel mit je 3 Stufen (Das Netz, Bilder-Post,
  Kabel im Meer, Das Telefonbuch, Das Schloss). Wie sie aufgebaut sind, steht
  [weiter unten](#wie-was-ist-das-internet-funktioniert).
- **Dateien:** ein eigenes Dateisystem pro Kind mit Papierkorb, Ziehen und
  Ablegen, Umbenennen, Kopieren und Einfügen, Tastenkürzeln und sechs Aufgaben
  von Flinn. Eine **Anzeige** öffnet Bilder, Hintergründe, Mauszeiger, Sticker,
  Lieder und Texte.
- **App-Laden:** 19 Dinge zum Kaufen in vier Abteilungen; alles landet in
  „Downloads“
- **Einstellungen:** Hintergrund, Ton und Lautstärke, Vorlesen, Zeigergröße und
  -farbe, Doppelklick-Tempo mit Testfeld (wie an einem echten Computer), Profil
  (Name, Tier, Geheimcode) und ein Erwachsenen-Bereich (Spielstand-Datei, Alter,
  Funktionen, Geheimcode entfernen, Kiosk-Hinweis, Profil löschen)
- **Offline und als App:** Nach dem ersten Besuch startet Computerfuchs auch
  ohne Internet. Chrome und Edge installieren es als App mit eigenem Symbol.
- **Kiosk-Skripte** für Linux mit Cage, den Raspberry Pi und Windows
- **7 weitere Apps** stehen als „Bald da“ im Start-Menü. Flinn erzählt, was
  dort kommen wird.

## App-Katalog

Status: ✅ fertig · 🔜 als Nächstes · 💡 geplant

### Computer lernen

| App | Alter | Was man lernt | Status |
|---|---|---|---|
| Maustraining | ab 4 | Bewegen, Klicken, Doppelklick, Ziehen, genau Führen, Rechtsklick, Scrollen, Fenster | ✅ |
| Tastatur | 5+ / 8+ / 10+ | Tasten mit Anlaut-Bildern finden („A wie Affe“), Leertaste, Pfeiltasten, Buchstabenregen, Wörter zu Bildern, Rücktaste, Großbuchstaben, Satzzeichen und @ (AltGr+Q), 10-Finger-System auf QWERTZ, Tipp-Rennen gegen Flinn mit Rekord | ✅ |
| Tastatur (weiter) | ab 9 | Tastenkürzel wie Strg+Z, längere Texte, eigene Rekordliste | 💡 |
| Dateien | ab 6 | Ordner, Ziehen, Umbenennen, Kopieren und Einfügen, Papierkorb und Zurückholen, Dateiendungen | ✅ |
| Dateien (weiter) | ab 9 | Suchen, Sortieren, Dateigrößen vergleichen, ein Bild aus dem Malkasten speichern | 💡 |
| Was ist das Internet? | 5–7 / 8–10 / ab 11 | Geräte am Router und WLAN, der Weg zu Oma über die Internetanbieter, ein Netz, das hält; ein Foto in Paketen, Router mit Wegweisern, Pakete ordnen und nachfordern; Seekabel (reißt eins, nimmt man einen anderen Weg), ein Rennen mit Lichtgeschwindigkeit, ein echter Ping; DNS als Telefonbuch, Adressen tippen, wem eine Adresse gehört; Postkarte oder Schatzkiste, Geheimschrift, wo das Passwort hin darf | ✅ |
| Netz-Detektiv | ab 8 | ein Spiel-Internet mit Suchmaschine: Werbung, Fake-News, „Du hast gewonnen!“-Fallen, Cookie-Banner | 💡 |
| Postfach | ab 8 | E-Mail mit Anhang (z. B. das eigene Bild aus dem Malkasten), antworten, Spam und Phishing erkennen | 💡 |
| Passwort-Festung | ab 8 | starke Passwörter und Passphrasen, „Wie lange bräuchte ein Hacker?“, nichts weitergeben | 💡 |
| Computer-Werkstatt | 5+ / 9+ / 12+ | Teile benennen → was CPU, RAM und SSD tun → einen PC mit Budget bauen | 💡 |
| Befehlszentrale | ab 12 | ein Terminal auf denselben Dateien (`ls`, `cd`, `mkdir`) | 💡 |
| KI-Labor | ab 9 | eine Mini-KI mit eigenen Zeichnungen trainieren und sehen, wann sie sich irrt; was Chatbots und Deepfakes sind | 💡 |

### Schule

| App | Alter | Was man lernt | Status |
|---|---|---|---|
| Rechnen | 4–10 | Zählen bis 10, Plus und Minus bis 10, bis 20 mit Zehnerübergang, Einmaleins, Kopfrechnen bis 100 | ✅ |
| Rechnen (weiter) | 8–15 | Zahlenraum bis 1.000 und 1 Million, Geld, Brüche, Prozent, Textaufgaben, Geometrie, Gleichungen | 💡 |
| Buchstaben | 4–7 | Anlaute, Buchstaben, Silben klatschen, erste Wörter | 🔜 |
| Lesen und Schreiben | 7–10 | Wort und Bild, Lückentexte, Rechtschreibung, Wortarten | 💡 |
| Englisch | ab 6 | erste Wörter mit Bild und Ton, später Sätze | 💡 |
| Uhr lesen | 6–8 | volle, halbe und Viertelstunden, Minuten | 💡 |
| Sachunterricht | 6–10 | Tiere, Körper, Jahreszeiten, Verkehrszeichen, Deutschlandkarte | 💡 |
| Logik | ab 4 | Muster fortsetzen, Sudoku 4×4, Memory, Tangram | 💡 |

### Kreativ

| App | Alter | Was man lernt | Status |
|---|---|---|---|
| Malkasten | ab 4 | genau zeichnen, Werkzeuge, Rückgängig, Bild speichern und als Hintergrund setzen | 🔜 |
| Schreibwerkstatt | ab 7 | Tippen mit Sinn: Einladung schreiben, markieren, kopieren, speichern, drucken | 💡 |
| Klangstudio | ab 4 | ein Beat-Raster per Klick, das Lied als Datei speichern | 💡 |
| Robo-Code | 5+ / 8+ / 12+ | Pfeile legen (ohne Lesen) → Schleifen und Bedingungen → echter Code | 💡 |

### System

| App | Was sie zeigt | Status |
|---|---|---|
| Einstellungen | Ein Computer lässt sich einstellen: Hintergrund, Ton, Maus | ✅ |
| Papierkorb | Löschen heißt erst einmal Wegräumen – und Zurückholen geht | ✅ |
| App-Laden | Bytes ausgeben; Herunterladen mit Fortschrittsbalken; Gekauftes landet als Datei in „Downloads“ | ✅ |

## Wie die Schul-Apps wachsen

Damit es Hunderte Übungen geben kann wie bei einem gekauften Lerncomputer,
teilen sich alle Lern-Apps dieselben Bausteine:

- **Aufgaben werden erzeugt, nicht abgeschrieben.** Rechenaufgaben entstehen aus
  Regeln, etwa „bis 20, 70 % mit Zehnerübergang“, und sind dadurch unendlich.
  Sprach-Apps bekommen Wortlisten mit Bildern.
- **Gemeinsame Antwortarten:** auswählen, eintippen, ziehen, zuordnen.
- **Gemeinsame Rückmeldung:** zwei Versuche, Hilfebilder (Fünferreihen,
  Zwanzigerfeld, Punktefelder), Sterne nach richtigen Antworten beim ersten
  Versuch.
- **Orientierung an der Grundschule:** Zahlenräume (20 / 100 / 1.000 /
  1 Million) und Anlaut-Tabellen folgen dem, was Kinder in der Schule kennen. Das
  Alter des Profils schaltet passende Level frei.
- **Später:** Die Schwierigkeit passt sich an. Wer sicher ist, bekommt Schwereres,
  wer hängt, bekommt Hilfen.

## Wie „Was ist das Internet?“ funktioniert

Das Internet kann man nicht anfassen. Darum bauen und benutzen die Kinder ein
Spiel-Netz, statt Erklärungen zu lesen.

- **Fünf Kapitel, je drei Stufen.** Stufe 1 ist für 5 bis 7 Jahre, Stufe 2 für 8
  bis 10, Stufe 3 ab 11. Jedes Kind startet auf der Stufe seines Alters, die
  leichteren bleiben offen. Wer eine Stufe schafft, darf die nächste probieren.
  Ab 10 Jahren sind alle Kapitel offen, jüngere Kinder spielen sie der Reihe
  nach.
- **Selbst machen:** Kabel ziehen, Pakete losschicken, umleiten und ordnen,
  Adressen eintippen, verschlüsseln. Flinn erzählt jeden Schritt und liest ihn
  vor, auch die Nachrichten, über die ein Kind entscheiden soll.
- **Ein Merksatz pro Stufe** steht am Ende auf dem Ergebnis-Bildschirm, etwa
  „Dein Internetanbieter verbindet dein Haus mit dem Rest der Welt.“
- **Echte Zahlen:** Entfernungen werden auf der Erdkugel gerechnet, und Licht
  schafft im Glasfaserkabel 200.000 km pro Sekunde. Der Ping misst wirklich, wie
  lange ein winziges Paket zum Server von Computerfuchs und zurück braucht.
- **Nichts Echtes wird berührt:** Die Seiten im Spiel-Browser sind erfunden. Die
  IP-Adressen stammen aus den Bereichen, die für Beispiele reserviert sind
  (192.0.2.x, 198.51.100.x und 203.0.113.x). Der Ping fragt nur beim Server von
  Computerfuchs selbst an.
- **Sicherheit ohne Angst:** Das letzte Kapitel erklärt, was das Schloss in der
  Adressleiste bedeutet (unterwegs liest niemand mit) und was nicht: Ob eine
  Seite echt ist, verrät erst die Adresse.

## Belohnung

- **Bytes:** Der erste, zweite und dritte Stern eines Levels bringen 16, 32 und
  64 Bytes. Eine Wiederholung ohne neuen Stern bringt 4 Bytes. Ein Level ist
  also 112 Bytes wert, und alle 21 Level mit Sternen zusammen etwa 2,3 KB. Jede
  der sechs Dateien-Aufgaben bringt noch einmal 16 Bytes.
- **Ränge** nach allen jemals verdienten Bytes:

  | Rang | ab |
  |---|---|
  | Fuchswelpe | 0 Bytes |
  | Jungfuchs | 150 Bytes |
  | Schlaufuchs | 500 Bytes |
  | Computerfuchs | 1 KB |
  | Meisterfuchs | 2,5 KB |

- **Führerscheine** 💡 für Maus, Tastatur und Internet zum Ausdrucken, mit Namen
  und Datum
- **App-Laden** ✅: Hintergründe (120 bis 200 Bytes), Mauszeiger (60 bis 100),
  Sticker (30) und Lieder (40 bis 60). Gekauftes landet als Datei im Ordner
  „Downloads“. Wer es dort öffnet, verschiebt und als Hintergrund einstellt, übt
  nebenbei den Umgang mit Dateien. Noch einmal herunterladen kostet nichts, und
  Ausgeben senkt den Rang nicht. Später 💡 kommt ein Desktop-Haustier dazu.

## Speichern

1. **Im Browser:** automatisch und sofort, mehrere Profile pro Gerät
2. **Als Datei:** Im Erwachsenen-Bereich lassen sich alle Profile als JSON-Datei
   sichern. Laden geht dort oder per Ziehen auf den Anmeldebildschirm. Geladene
   Dateien werden streng geprüft und repariert.
3. **Später ein Zaubercode** 💡: etwa 16 Zeichen oder ein QR-Code auf dem
   Führerschein mit dem Fortschritt (ohne Bilder). Er ist für Schul-PCs gedacht,
   die beim Abmelden alles löschen.

**Warum kein 4-stelliger Code?** Ohne Server gibt es keinen Ort, auf den ein Code
zeigen könnte, also müsste der ganze Spielstand im Code stecken. Dafür sind
10.000 Möglichkeiten viel zu wenig. Mit Server könnten Fremde fremde Codes
erraten. Die 4 Ziffern haben stattdessen eine andere Aufgabe bekommen ✅: als
**Geheimcode** fürs Profil – vier Zahlen oder, für die Kleinen, vier aus neun
Bildern. Das ist ihr erstes Passwort. Gespeichert wird nur eine Prüfsumme, nicht
der Code selbst. Ein Tresor ist das nicht: Er hält Geschwister fern und übt, ein
Passwort für sich zu behalten. Nach zwei Fehlversuchen können Erwachsene ihn
hinter der Rechenaufgabe zurücksetzen.

## Kiosk-Betrieb

Ziel: Ein alter Laptop startet direkt in Computerfuchs, und man kann nichts
anderes damit machen.

Eine Webseite allein kann das nicht. Alt+Tab, die Windows-Taste und
Strg+Alt+Entf gehören dem Betriebssystem. Das Abschließen muss deshalb der
**Kiosk-Modus des Betriebssystems** übernehmen. Die Seite hilft dabei mit
`?kiosk` am Ende der Adresse:

- Der Knopf zum Verlassen des Vollbilds fehlt.
- „Ausschalten“ führt zurück zum Einschaltknopf.
- Im Vollbild werden in Chromium auch Tasten wie Esc abgefangen.

Für das Betriebssystem gibt es zwei Skripte und eine
[Anleitung mit drei Wegen](KIOSK.de.md):

1. **Linux mit Cage** (Empfehlung für alte Laptops): Debian ohne Desktop, dazu
   Cage, das genau ein Programm im Vollbild zeigt, und Chromium. Ein Konto
   `kind` meldet sich automatisch an; stürzt etwas ab, startet es neu.
   Chromium-Richtlinien sperren alle anderen Seiten, die Entwicklerwerkzeuge und
   private Fenster.
2. **Raspberry Pi** mit Raspberry Pi OS Lite und demselben Skript – ein
   günstiger eigener Lerncomputer.
3. **Windows 10 und 11** (auch Home): Ein Standardkonto „Kind“ ohne Passwort
   bekommt statt des Explorers nur den Browser mit Computerfuchs. Chrome und
   Firefox behalten im Kiosk-Modus ein normales Profil; Edge startet als
   App-Fenster, denn Edges eigener Kiosk-Modus läuft immer InPrivate und würde
   die Spielstände löschen.

Damit ein Kiosk-Laptop, der schneller hochfährt als sein WLAN, nicht auf einer
Fehlerseite hängt, speichert ein Service Worker die ganze Seite im Browser.
Danach startet Computerfuchs auch ganz ohne Internet. Eine lokale Kopie von
`dist/` hinter einem eigenen Webserver geht ebenfalls.

> ⚠️ Die Skripte sind noch nicht auf echter Hardware getestet.

## Technik

- **Stack:** React 19, TypeScript 7, Vite 8, Vitest und oxlint, genau wie
  LinuxKompass und JobKompass. Zur Laufzeit kommen nur React und die Schriften
  hinzu.
- **Kein Backend.** GitHub Pages liefert fertige Dateien aus. Jeder Push auf
  `main` wird geprüft, gebaut und veröffentlicht.
- **Aufbau:**
  - `src/core/`: Profile, Belohnungen, Spielstand (mit Prüfung und Reparatur),
    das Dateisystem und die Aufgaben dazu, App-Laden, Geheimcode, Lieder als
    Notenfolgen, Ton (Web Audio, ohne Tondateien), Sprache,
    Doppelklick-Erkennung, Geometrie
  - `src/os/`: der simulierte Computer. Die Fensterverwaltung ist eine reine,
    getestete Funktion (`windows.ts`).
  - `src/apps/`: die Apps. Sie bekommen über `useOs()` das Profil, Belohnungen,
    Meldungen und `openApp`. Über `useWindow()` erfahren sie, ob ihr Fenster
    vorne ist.
- **Eine neue App:** einen Ordner unter `src/apps/` anlegen, eine Komponente als
  `default export` schreiben, einen Eintrag in `src/apps/registry.ts` mit
  `component: lazy(() => import(...))` machen, fertig. Jede App wird erst beim
  Öffnen geladen.
- **Bilder:** Fluent Emoji (MIT) als SVG in `public/emoji/`. Sie sehen auf jedem
  Gerät gleich aus, auch auf einem Linux-Kiosk ohne Emoji-Schrift.
- **Offline:** `tools/offline.ts` erzeugt beim Bauen `dist/sw.js` mit der Liste
  aller Dateien. Die Seite kommt zuerst aus dem Netz (damit Updates ankommen),
  alles andere aus dem Speicher.
- **Tastatur:** Die Bildschirmtastatur kennt die Tasten nach ihrem Ort
  (`e.code`), die Spiele prüfen das Zeichen (`e.key`). So funktionieren sie auch
  mit anderen Layouts; Chrome und Edge erkennen eine nicht deutsche Tastatur und
  zeigen einen Hinweis.
- **Tests:** Vitest für die Logik (Profile, Belohnung, Spielstand-Dateien,
  Fenster, Rechenaufgaben, Geometrie, Dateisystem, App-Laden, Geheimcode,
  Tastaturbelegung, Tippen, Labyrinthe, Netze und Wege). Dazu kommt
  `npm run e2e`, ein automatischer Durchlauf in einem unsichtbaren Chrome durch
  die ganze App, mit Screenshots.

## Fahrplan

| Version | Inhalt |
|---|---|
| **0.1** | Desktop, der mitwächst; Maustraining (8 × 3); Rechnen (6 Level); Einstellungen; Spielstand-Datei; Kiosk-Schalter |
| **0.2** | Tastatur (7 × 3); Dateien mit Papierkorb und Flinns Aufgaben; App-Laden; Geheimcode; offline nutzbar; Kiosk-Skripte für Linux, Raspberry Pi und Windows |
| **0.3** (jetzt) | „Was ist das Internet?“ in 5 Kapiteln × 3 Stufen ✅; Malkasten (Bilder landen in „Bilder“); Buchstaben |
| **0.4** | Führerscheine zum Ausdrucken; Elternecke mit Fortschritt und Pausen-Erinnerung; als App installierbar ✅; englische Oberfläche |
| danach | weitere Schul-Apps; Material für Lehrkräfte; Zaubercode/QR |

## Offene Fragen

- Reicht die Sprachausgabe des Browsers, oder lohnen sich eigene Aufnahmen? Edge
  klingt sehr natürlich, Linux eher blechern.
- Soll Flinn eine richtige Illustration bekommen statt der einfachen SVG-Figur?
- Wie bekommen Lehrkräfte einen Überblick über eine Klasse, ohne dass ein Server
  Kinderdaten sammelt? Eine Idee sind Spielstand-Dateien, die eine Lehrkraft
  einsammelt.
- Wann kommt die englische Oberfläche? Die Texte liegen heute noch direkt in den
  Komponenten.
- Wie gut laufen die Kiosk-Skripte auf echten Geräten? Rückmeldungen dazu und zu
  Tests mit Kindern ([Testanleitung](TESTING.de.md)) helfen am meisten.
