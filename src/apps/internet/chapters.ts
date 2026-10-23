import type { MapLevel, Tier } from '../shared/levelTypes';

export type InternetChapterId = 'netz' | 'post' | 'meer' | 'telefonbuch' | 'schloss';

export interface InternetChapter extends MapLevel {
  id: InternetChapterId;
  intro: string;
  tiers: [string, string, string];
  /** Merksatz nach jeder Stufe */
  lessons: [string, string, string];
}

/** Stufe 1 für 5 bis 7, Stufe 2 für 8 bis 10, Stufe 3 ab 11 Jahren. */
export const TIER_AGES: [string, string, string] = ['5–7 Jahre', '8–10 Jahre', 'ab 11'];

export function tierForAge(age: number): Tier {
  if (age <= 7) return 1;
  if (age <= 10) return 2;
  return 3;
}

/*
 * Eine Reise vom eigenen Router bis ans andere Ende der Welt: erst das Netz,
 * dann Pakete, Wege, Namen und zum Schluss die Sicherheit.
 */
export const CHAPTERS: InternetChapter[] = [
  {
    id: 'netz',
    title: 'Das Netz',
    skill: 'Was ist das Internet?',
    icon: 'globe-with-meridians',
    color: '#14b0d4',
    intro:
      'Das Internet ist ein riesiges Netz. Computer, Tablets und Handys auf der ganzen Welt sind darin verbunden – mit Kabeln und über Funk. Bau dir dein eigenes Netz!',
    tiers: ['Steck alle Geräte am Router ein.', 'Verbinde dein Haus mit Omas Haus.', 'Bau ein Netz, das hält, auch wenn ein Kabel reißt.'],
    lessons: [
      'Merke: Der Router verbindet alle Geräte zu Hause mit dem Internet.',
      'Merke: Dein Internetanbieter verbindet dein Haus mit dem Rest der Welt.',
      'Merke: Das Internet hat fast immer einen zweiten Weg. Darum hält es, auch wenn ein Kabel reißt.',
    ],
  },
  {
    id: 'post',
    title: 'Bilder-Post',
    skill: 'Datenpakete',
    icon: 'envelope-with-arrow',
    color: '#ff7a2f',
    intro:
      'Du schickst Oma ein Foto. Im Internet reist es nicht im Ganzen, sondern in vielen kleinen Paketen – und Router zeigen ihnen den Weg.',
    tiers: ['Schick die Pakete los.', 'Lies die Wegweiser an den Routern.', 'Nummerierte Pakete – eins geht verloren!'],
    lessons: [
      'Merke: Große Dateien reisen in vielen kleinen Paketen.',
      'Merke: Jedes Paket trägt eine Adresse, die IP-Adresse. Router lesen sie und schicken es weiter.',
      'Merke: Pakete haben Nummern. So merkt der Computer, welches fehlt, und fragt nach.',
    ],
  },
  {
    id: 'meer',
    title: 'Kabel im Meer',
    skill: 'Wege um die Welt',
    icon: 'globe-showing-europe-africa',
    color: '#2f9bff',
    intro:
      'Nach Amerika oder Japan reisen die Pakete durch Kabel am Meeresgrund – so dick wie ein Gartenschlauch und Tausende Kilometer lang.',
    tiers: ['Ein Kabel ist kaputt – such einen anderen Weg.', 'Welcher Weg ist schneller?', 'Miss mit einem echten Ping, wie schnell dein Internet ist.'],
    lessons: [
      'Merke: Es gibt viele Wege durchs Internet. Reißt ein Kabel, nehmen die Pakete einen anderen.',
      'Merke: Licht schafft im Glasfaserkabel 200.000 Kilometer pro Sekunde. Weite Wege dauern trotzdem länger.',
      'Merke: Ein Ping misst, wie lange ein Paket hin und zurück braucht.',
    ],
  },
  {
    id: 'telefonbuch',
    title: 'Das Telefonbuch',
    skill: 'Namen und Nummern',
    icon: 'ledger',
    color: '#8a6bff',
    intro:
      'Computer merken sich keine Namen, sondern Nummern. Gibst du zoo.de ein, schaut dein Computer im Telefonbuch des Internets nach, welche Nummer der Zoo hat.',
    tiers: ['Such die Seite im Bilder-Telefonbuch.', 'Tipp die Adresse selbst ein.', 'Wem gehört die Adresse wirklich?'],
    lessons: [
      'Merke: Hinter jedem Namen im Internet steckt eine Nummer.',
      'Merke: Das Telefonbuch des Internets heißt DNS. Es übersetzt Namen in Nummern.',
      'Merke: Wem eine Adresse gehört, steht ganz hinten im Rechnernamen.',
    ],
  },
  {
    id: 'schloss',
    title: 'Das Schloss',
    skill: 'Sicher verschickt',
    icon: 'locked-with-key',
    color: '#2fbf62',
    intro:
      'Unterwegs kommen Pakete an vielen Computern vorbei. Eine Postkarte kann jeder lesen. Mit dem Schloss in der Adressleiste ist die Nachricht verschlossen.',
    tiers: ['Postkarte oder Schatzkiste?', 'Knack die Geheimschrift.', 'Wo darfst du dein Passwort eingeben?'],
    lessons: [
      'Merke: Geheimnisse gehören in die Schatzkiste, nicht auf die Postkarte.',
      'Merke: Verschlüsseln heißt: Nur wer den Schlüssel kennt, kann es lesen.',
      'Merke: Das Schloss schützt den Weg. Ob die Seite echt ist, verrät die Adresse.',
    ],
  },
];
