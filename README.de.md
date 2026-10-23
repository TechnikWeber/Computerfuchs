[English](README.md) · **Deutsch**

# Computerfuchs

Ein Lerncomputer für Kinder von etwa 5 bis 15 Jahren, der im Browser läuft.
Computerfuchs simuliert einen freundlichen Desktop mit Fenstern, Taskleiste und
Start-Menü, und dieser Desktop wächst mit dem Kind. Eine Fünfjährige startet mit
drei großen Symbolen, die mit einem Klick aufgehen. Im Maustraining schaltet sie
frei, was ein echter Computer kann: Doppelklick, Fenster verschieben,
Rechtsklick-Menü und Fenster-Knöpfe. Ältere Kinder bekommen gleich den vollen
Desktop. Das Ziel ist das der Spielzeug-Lerncomputer, nur auf jedem alten
Laptop: lernen, wie man einen Computer bedient, und daran Mathe, Lesen und mehr
üben.

**→ [technikweber.github.io/Computerfuchs](https://technikweber.github.io/Computerfuchs/)**

> Früher Prototyp (v0.1). Maustraining und Rechnen sind spielbar. Tastatur,
> Dateien, „Was ist das Internet?“ und mehr stehen im Fahrplan (siehe
> [Konzept](docs/CONCEPT.de.md)).

## Was es kann

- **Ein Desktop, der mitwächst.** Vier Desktop-Funktionen gibt es nicht
  geschenkt, man verdient sie im Maustraining: Öffnen per Doppelklick, Fenster
  verschieben, Rechtsklick-Menü sowie verkleinern, vergrößern und Größe ändern.
  Flinn, der Fuchs, kündigt jede an und lässt sie gleich ausprobieren. Mit 7 bis
  9 Jahren sind die ersten beiden schon da, ab 10 alle. Eltern können jede
  einzeln an- und ausschalten.
- **Maustraining, 8 Level mit je 3 Stufen.**
  - Taschenlampe: versteckte Tiere im Dunkeln suchen.
  - Ballons: zum Platzen anklicken, auf Stufe 3 nur die roten.
  - Geschenke: per Doppelklick öffnen. Mit jeder Stufe bleibt weniger Zeit
    zwischen den zwei Klicks.
  - Tiere füttern: das richtige Essen zum richtigen Tier ziehen.
  - Bienenweg: einen Weg nachfahren, mit Zwischenstationen nach einem Ausrutscher.
  - Farbenzauber: ein Bild per Rechtsklick-Menü ausmalen. Auf Stufe 2 nach
    Vorlage, auf Stufe 3 mit Untermenü.
  - Tauchgang: durch ein Meer scrollen.
  - Fenster-Profi: ein Fenster verschieben, größer ziehen, verkleinern,
    zurückholen, vergrößern und schließen.
- **Rechnen, 6 Level.** Zählen bis 10, Plus und Minus bis 10, bis 20 (meist mit
  Zehnerübergang, das Zwanzigerfeld hilft auf Wunsch), Einmaleins und
  Kopfrechnen bis 100. Jede Runde wird neu erzeugt. Kleine Mengen stehen in
  Fünferreihen, wie in der Grundschule. Die Antwort geht über ein Zahlenfeld oder
  die echte Tastatur. Nach einem Fehler gibt es einen zweiten Versuch und ein
  Bild zur Aufgabe.
- **Gemacht für Kinder, die noch nicht lesen.** Jede Anleitung hat ein Bild und
  kann vorgelesen werden (Sprachausgabe des Browsers). Knöpfe und Ziele sind
  groß, und Zeitdruck gibt es nur, wo Tempo das Lernziel ist. Den Mauszeiger gibt
  es in Normal, Groß und Riesig.
- **Bytes statt Münzen.** Jeder neue Stern bringt Bytes. Die gesammelten Bytes
  bestimmen den Rang: Fuchswelpe, Jungfuchs, Schlaufuchs, ab 1 Kilobyte
  Computerfuchs und danach Meisterfuchs. Der Rang zeigt, wie weit ein Kind schon
  ist. Später kann man mit den Bytes im App-Laden Hintergründe, Mauszeiger und
  Sticker kaufen.
- **Profile auf dem Anmeldebildschirm.** Jedes Kind wählt ein Tier, einen Namen
  und sein Alter. Das ist die erste Lektion über Benutzerkonten.
- **Gespeichert im Browser, gesichert als Datei.** Der Fortschritt liegt lokal.
  Ein Erwachsenen-Bereich hinter einer kleinen Rechenaufgabe sichert alle Profile
  als JSON-Datei und lädt sie wieder, per Knopf oder per Ziehen auf den
  Anmeldebildschirm. Kaputte oder fremde Dateien werden mit einer Erklärung
  abgelehnt, statt die Seite abstürzen zu lassen.
- **Kiosk-tauglich.** Mit `?kiosk` am Ende der Adresse verschwindet der
  Vollbild-Knopf, und „Ausschalten“ führt zurück zum Einschaltknopf. Zusammen mit
  dem Kiosk-Modus des Betriebssystems wird jeder Laptop zum festen Lerncomputer
  (siehe [Konzept](docs/CONCEPT.de.md#kiosk-betrieb)).
- Deutsch zuerst. Keine Anmeldung, keine Werbung, keine Cookies, keine Analyse
  und keine Anfragen an fremde Server: Schriften und Bilder kommen vom selben
  Server wie die Seite.

## Entwickeln

```sh
npm ci
npm run dev        # http://localhost:5173
npm test           # Vitest (Logik: Profile, Belohnung, Spielstand, Fenster, Rechnen)
npm run lint       # oxlint
npm run build      # Typprüfung + Produktions-Build nach dist/
```

Stack: React 19, TypeScript 7, Vite 8, Vitest und oxlint, genau wie
[LinuxKompass](https://github.com/TechnikWeber/LinuxKompass) und
[JobKompass](https://github.com/TechnikWeber/JobKompass). Jeder Push auf `main`
wird von `.github/workflows/deploy.yml` geprüft, gebaut und auf GitHub Pages
veröffentlicht. Der Build nutzt einen relativen Pfad. Deshalb läuft `dist/` auch
auf einem Schulserver oder als lokale Kopie.

Aufbau:

- `src/core/`: Profile, Belohnung, Spielstand, Ton, Sprache, kleine Hooks
- `src/os/`: der simulierte Computer mit Start, Anmeldung, Desktop, Fenstern und Taskleiste
- `src/apps/`: die Apps. `registry.ts` listet sie auf; Apps mit „bald“ stehen schon im Start-Menü.

## Lizenz

Code: MIT (siehe `LICENSE`). Bilder: Fluent Emoji von Microsoft (MIT).
Schriften: Nunito und Fredoka (SIL OFL). Einzelheiten stehen in
`THIRD_PARTY_NOTICES.md`.
