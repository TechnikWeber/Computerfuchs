import type { EmojiName } from '../../core/emoji';

/*
 * Inhalte für „Was ist das Internet?“. Die IP-Adressen stammen aus den
 * Bereichen, die für Beispiele reserviert sind (192.0.2.x, 198.51.100.x,
 * 203.0.113.x) – sie gehören keinem echten Rechner.
 */

export interface Place {
  name: string;
  lon: number;
  lat: number;
}

const P = (name: string, lon: number, lat: number): Place => ({ name, lon, lat });

export const PLACES = {
  berlin: P('Berlin', 13.4, 52.52),
  newYork: P('New York', -74.0, 40.71),
  rio: P('Rio de Janeiro', -43.2, -22.9),
  kapstadt: P('Kapstadt', 18.4, -33.9),
  tokio: P('Tokio', 139.7, 35.7),
  sydney: P('Sydney', 151.2, -33.9),
  lissabon: P('Lissabon', -9.1, 38.7),
  bude: P('Bude', -4.5, 50.8),
  marseille: P('Marseille', 5.4, 43.3),
  suez: P('Suez', 32.5, 30.0),
  kairo: P('Kairo', 31.2, 30.0),
  nairobi: P('Nairobi', 36.8, -1.3),
  johannesburg: P('Johannesburg', 28.0, -26.2),
  dakar: P('Dakar', -17.4, 14.7),
  lagos: P('Lagos', 3.4, 6.5),
  fortaleza: P('Fortaleza', -38.5, -3.7),
  mumbai: P('Mumbai', 72.9, 19.0),
  singapur: P('Singapur', 103.8, 1.3),
  darwin: P('Darwin', 130.8, -12.5),
  perth: P('Perth', 115.9, -31.9),
  moskau: P('Moskau', 37.6, 55.8),
  nowosibirsk: P('Nowosibirsk', 82.9, 55.0),
  peking: P('Peking', 116.4, 39.9),
  halifax: P('Halifax', -63.6, 44.6),
  miami: P('Miami', -80.2, 25.8),
} as const;

type Lon = number;
type Lat = number;

/** Sehr grobe Umrisse der Kontinente (Länge, Breite) – eine Spielzeug-Weltkarte, kein Atlas. */
export const CONTINENTS: [Lon, Lat][][] = [
  // Nordamerika
  [
    [-165, 65], [-140, 70], [-110, 72], [-95, 72], [-80, 68], [-70, 62], [-58, 53], [-66, 45], [-70, 42], [-75, 38],
    [-80, 32], [-81, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 21], [-90, 21], [-87, 21], [-88, 16], [-83, 10],
    [-79, 8], [-83, 8], [-92, 14], [-105, 20], [-110, 23], [-117, 32], [-121, 36], [-124, 41], [-124, 48],
    [-131, 54], [-140, 59], [-152, 59], [-160, 55], [-166, 60],
  ],
  // Grönland
  [[-73, 78], [-58, 82], [-28, 83], [-18, 77], [-22, 70], [-42, 60], [-52, 64], [-58, 70], [-70, 76]],
  // Südamerika
  [
    [-79, 8], [-75, 11], [-71, 12], [-62, 10], [-55, 6], [-50, 0], [-44, -3], [-35, -6], [-37, -12], [-40, -22],
    [-48, -27], [-53, -34], [-58, -38], [-63, -41], [-65, -47], [-69, -52], [-68, -55], [-73, -50], [-75, -42],
    [-73, -33], [-71, -24], [-70, -18], [-76, -13], [-81, -6], [-80, -1], [-78, 3],
  ],
  // Europa und Asien
  [
    [-9, 37], [-9, 43], [-2, 43.5], [-1, 46], [-5, 48], [2, 51], [5, 53], [8, 54], [9, 57], [10, 59], [5, 61],
    [7, 63], [14, 67], [20, 70], [30, 71], [40, 67], [44, 68], [55, 69], [70, 73], [80, 73], [100, 78], [113, 74],
    [140, 72], [160, 70], [180, 66], [180, 64], [170, 60], [163, 60], [156, 51], [156, 57], [143, 59], [140, 54],
    [140, 48], [133, 43], [129, 41], [127, 38], [126, 35], [121, 31], [120, 26], [114, 22], [109, 21], [106, 17],
    [109, 12], [105, 9], [100, 13], [100, 6], [103, 2], [101, 3], [98, 8], [98, 16], [94, 17], [92, 22], [87, 21],
    [85, 19], [80, 15], [80, 10], [77, 8], [74, 14], [73, 19], [70, 21], [67, 24], [62, 25], [57, 25], [56, 27],
    [51, 24], [56, 22], [59, 22], [53, 16], [45, 13], [42, 15], [39, 21], [35, 28], [34, 31], [35, 33], [36, 36],
    [30, 36], [27, 37], [26, 40], [23, 40], [24, 38], [21, 37], [19, 40], [16, 41], [18, 40], [16, 38], [12, 42],
    [10, 44], [6, 43], [3, 43], [0, 39], [-2, 37], [-6, 36],
  ],
  // Großbritannien
  [[-5, 50], [1, 51], [1, 53], [-2, 56], [-2, 58], [-5, 58.6], [-6, 56], [-4.5, 55], [-3.5, 54], [-4.5, 53], [-5, 52]],
  // Afrika
  [
    [-17, 21], [-17, 15], [-15, 11], [-11, 7], [-8, 4.5], [-2, 5], [3, 6], [8, 4], [10, 2], [12, -5], [13, -12],
    [12, -17], [15, -27], [18, -34], [22, -34], [27, -34], [31, -29], [33, -25], [35, -20], [40, -15], [40, -10],
    [39, -5], [42, -1], [46, 2], [51, 11], [44, 11], [43, 13], [39, 18], [37, 22], [34, 27], [32, 31], [29, 31],
    [25, 32], [20, 31], [15, 32], [10, 34], [11, 37], [9, 37], [0, 36], [-5, 36], [-10, 32], [-13, 27],
  ],
  // Madagaskar
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  // Japan
  [[130, 31], [132, 34], [136, 34], [140, 35], [141, 38], [142, 40], [140, 42], [141, 45], [145, 44], [142, 40.5], [139.5, 38], [139, 36], [135, 35.5], [131, 34.5]],
  // Indonesien (stark vereinfacht)
  [[95, 5], [98, 3], [104, -3], [106, -6], [114, -8], [120, -9], [115, -6], [110, -6], [106, -3], [100, 1]],
  [[109, 2], [117, 7], [119, 2], [116, -4], [110, -3]],
  // Australien
  [
    [113, -22], [114, -27], [115, -34], [118, -35], [124, -33], [131, -31], [135, -35], [138, -35], [141, -38],
    [146, -39], [150, -37], [153, -32], [153, -26], [149, -21], [146, -18], [145, -15], [142, -11], [141, -15],
    [137, -16], [136, -12], [132, -11], [129, -15], [125, -14], [122, -18], [118, -20],
  ],
  // Neuseeland
  [[172.5, -34.5], [175, -37], [178, -38], [175, -41.5], [172, -41], [174, -39]],
  [[172, -41], [174, -42], [171, -46], [167, -46.5], [168, -44]],
];

/** Umriss Deutschlands (Länge, Breite), grob. */
export const GERMANY: [Lon, Lat][] = [
  [7.0, 53.6], [8.0, 53.55], [8.6, 53.9], [8.9, 54.4], [8.6, 54.9], [9.4, 54.85], [10.0, 54.6], [10.9, 54.35],
  [11.2, 54.0], [12.3, 54.2], [13.4, 54.6], [14.2, 53.9], [14.4, 53.3], [14.1, 52.6], [14.7, 52.1], [14.9, 51.2],
  [14.3, 50.9], [13.6, 50.7], [12.5, 50.3], [12.2, 50.3], [12.5, 49.8], [13.4, 49.3], [13.8, 48.8], [13.4, 48.4],
  [12.8, 48.1], [13.0, 47.6], [12.1, 47.7], [10.9, 47.5], [10.4, 47.3], [9.6, 47.6], [8.6, 47.65], [7.6, 47.6],
  [7.6, 48.3], [8.2, 49.0], [7.0, 49.1], [6.4, 49.2], [6.4, 49.6], [6.1, 50.1], [6.4, 50.4], [6.0, 50.8],
  [5.9, 51.0], [6.2, 51.4], [5.9, 51.8], [6.8, 51.95], [6.9, 52.4], [7.0, 52.9], [7.2, 53.2],
];

export const GERMAN_CITIES = [
  { id: 'hamburg', name: 'Hamburg', lon: 10.0, lat: 53.55 },
  { id: 'berlin', name: 'Berlin', lon: 13.4, lat: 52.52 },
  { id: 'koeln', name: 'Köln', lon: 6.96, lat: 50.94 },
  { id: 'dresden', name: 'Dresden', lon: 13.74, lat: 51.05 },
  { id: 'frankfurt', name: 'Frankfurt', lon: 8.68, lat: 50.11 },
  { id: 'muenchen', name: 'München', lon: 11.58, lat: 48.14 },
] as const;

// ---------------------------------------------------------------------------
// Kabel im Meer
// ---------------------------------------------------------------------------

export type Accident = 'hai' | 'anker' | 'traktor';

export const ACCIDENT: Record<Accident, { emoji: EmojiName; text: string; fact: string }> = {
  hai: {
    emoji: 'shark',
    text: 'Oh nein! Ein Hai hat ins Kabel gebissen.',
    fact: 'Das ist wirklich schon passiert. Darum stecken Seekabel heute in einer dicken Hülle.',
  },
  anker: {
    emoji: 'anchor',
    text: 'Oh nein! Ein Schiffsanker hat das Kabel zerrissen.',
    fact: 'Anker von Schiffen sind der häufigste Grund, wenn ein Seekabel kaputtgeht.',
  },
  traktor: {
    emoji: 'tractor',
    text: 'Oh nein! Ein Traktor hat beim Graben das Kabel erwischt.',
    fact: 'An Land kommt das öfter vor, als man denkt – auf Baustellen und Feldern.',
  },
};

export interface Route {
  id: string;
  name: string;
  via: Place[];
}

export interface RerouteRound {
  to: Place;
  /** Die Pakete starten auf dem ersten Weg – der geht kaputt. */
  routes: [Route, ...Route[]];
  accident: Accident;
}

const B = PLACES;

export const REROUTE_ROUNDS: RerouteRound[] = [
  {
    to: B.newYork,
    accident: 'hai',
    routes: [
      { id: 'nord', name: 'über England', via: [B.berlin, P('', 5, 52.6), B.bude, P('', -30, 51), P('', -55, 45), B.newYork] },
      { id: 'mitte', name: 'über Portugal', via: [B.berlin, P('', 6, 46), B.lissabon, P('', -35, 39), B.newYork] },
    ],
  },
  {
    to: B.rio,
    accident: 'anker',
    routes: [
      { id: 'ella', name: 'über Portugal', via: [B.berlin, P('', 6, 46), B.lissabon, P('', -22, 18), B.fortaleza, P('', -36, -12), B.rio] },
      { id: 'amerika', name: 'über New York', via: [B.berlin, P('', 5, 52.6), B.bude, P('', -35, 47), B.newYork, B.miami, P('', -55, 8), P('', -35, -8), B.rio] },
    ],
  },
  {
    to: B.kapstadt,
    accident: 'traktor',
    routes: [
      { id: 'land', name: 'quer durch Afrika', via: [B.berlin, P('', 16, 42), B.kairo, B.nairobi, B.johannesburg, B.kapstadt] },
      { id: 'kueste', name: 'an der Küste entlang', via: [B.berlin, P('', 6, 46), B.lissabon, B.dakar, B.lagos, P('', 8, -12), B.kapstadt] },
    ],
  },
];

export interface RaceRound {
  to: Place;
  routes: [Route, Route];
}

export const RACE_ROUNDS: RaceRound[] = [
  {
    to: B.newYork,
    routes: [
      { id: 'a', name: 'direkt über den Atlantik', via: [B.berlin, P('', 5, 52.6), B.bude, P('', -30, 50), B.newYork] },
      { id: 'b', name: 'über Afrika und Brasilien', via: [B.berlin, B.lissabon, B.dakar, B.fortaleza, P('', -50, 18), B.newYork] },
    ],
  },
  {
    to: B.tokio,
    routes: [
      { id: 'a', name: 'Seekabel um Indien', via: [B.berlin, B.marseille, B.suez, B.mumbai, B.singapur, P('', 114, 22), B.tokio] },
      { id: 'b', name: 'über Land durch Russland', via: [B.berlin, B.moskau, B.nowosibirsk, B.peking, B.tokio] },
    ],
  },
  {
    to: B.sydney,
    routes: [
      { id: 'a', name: 'um Afrika herum', via: [B.berlin, B.lissabon, B.dakar, P('', 5, -20), B.kapstadt, P('', 75, -38), B.perth, P('', 130, -40), B.sydney] },
      { id: 'b', name: 'über Asien', via: [B.berlin, B.marseille, B.suez, B.mumbai, B.singapur, B.darwin, B.sydney] },
    ],
  },
];

/** Für den Ping-Vergleich: Wie weit ist es von Deutschland aus? */
export const PING_TARGETS: { name: string; km: number; space?: boolean }[] = [
  { name: 'nach Paris', km: 880 },
  { name: 'nach New York', km: 6400 },
  { name: 'nach Tokio', km: 8900 },
  { name: 'nach Sydney', km: 16_100 },
  { name: 'zum Mond', km: 384_400, space: true },
];

// ---------------------------------------------------------------------------
// Das Telefonbuch
// ---------------------------------------------------------------------------

export interface Site {
  name: string;
  title: string;
  emoji: EmojiName;
  ip: string;
  color: string;
  text: string;
  /** So sagt es Flinn: „zum Zoo“ */
  to: string;
}

export const SITES: Site[] = [
  { name: 'zoo.de', title: 'Der Tierpark', emoji: 'lion', ip: '192.0.2.17', color: '#2fbf62', text: 'Heute neu: Babyelefant Paula!', to: 'zum Zoo' },
  { name: 'kino.de', title: 'Kino am Markt', emoji: 'popcorn', ip: '198.51.100.23', color: '#ff4f87', text: 'Um 15 Uhr: Der kleine Fuchs.', to: 'ins Kino' },
  { name: 'pizza.de', title: 'Pizzeria Flinn', emoji: 'pizza', ip: '203.0.113.5', color: '#ff7a2f', text: 'Pizza Margherita – heute im Angebot.', to: 'zur Pizzeria' },
  { name: 'wetter.de', title: 'Das Wetter', emoji: 'sun-behind-small-cloud', ip: '192.0.2.88', color: '#2f9bff', text: 'Morgen: Sonne und ein paar Wolken.', to: 'zum Wetter' },
  { name: 'schwimmbad.de', title: 'Das Hallenbad', emoji: 'water-wave', ip: '198.51.100.61', color: '#14b0d4', text: 'Neue Rutsche – 40 Meter lang!', to: 'zum Schwimmbad' },
  { name: 'schule.de', title: 'Grundschule Fuchsbau', emoji: 'school', ip: '203.0.113.42', color: '#8a6bff', text: 'Freitag ist Sportfest.', to: 'zur Schule' },
  { name: 'buecherei.de', title: 'Die Stadtbücherei', emoji: 'books', ip: '192.0.2.130', color: '#f5a524', text: 'Neu im Regal: 30 Tierbücher.', to: 'zur Bücherei' },
  { name: 'fussball.de', title: 'FC Fuchsbau', emoji: 'soccer-ball', ip: '198.51.100.7', color: '#22c7ad', text: 'Samstag: Spiel gegen die Igel.', to: 'zum Fußballverein' },
];

/** Echte und falsche Adressen – wem gehören sie wirklich? */
export const OWNER_ROUNDS: { url: string; options: string[] }[] = [
  { url: 'https://www.fuchsbank.de/login', options: ['fuchsbank.de', 'www.fuchsbank', 'login'] },
  { url: 'https://fuchsbank.de-konto-sicher.info/login', options: ['fuchsbank.de', 'de-konto-sicher.info', 'konto-sicher.info'] },
  { url: 'https://de.wikipedia.org/wiki/Fuchs', options: ['wikipedia.org', 'de.wikipedia', 'wiki'] },
  { url: 'https://www.kika.de.gewinnspiel-sofort.net/preis', options: ['kika.de', 'gewinnspiel-sofort.net', 'preis'] },
  { url: 'https://spiele.zoo.de/memory', options: ['spiele.zoo', 'zoo.de', 'memory'] },
  { url: 'https://gratis-spielgeld.xyz/fuchsbank.de', options: ['fuchsbank.de', 'gratis-spielgeld.xyz', 'spielgeld.xyz'] },
];

// ---------------------------------------------------------------------------
// Das Schloss
// ---------------------------------------------------------------------------

export const MESSAGES: { text: string; emoji: EmojiName; secret: boolean }[] = [
  { text: 'Heute scheint die Sonne.', emoji: 'sun-behind-small-cloud', secret: false },
  { text: 'Mein Passwort heißt Sonne123.', emoji: 'key', secret: true },
  { text: 'Ich habe ein Bild gemalt.', emoji: 'artist-palette', secret: false },
  { text: 'Wir wohnen im Lindenweg 3.', emoji: 'house', secret: true },
  { text: 'Ich mag Pizza.', emoji: 'pizza', secret: false },
  { text: 'Mein Geheimcode: Fuchs, Katze, Hund, Eule.', emoji: 'locked', secret: true },
];

export const CIPHER_SHIFT = 3;

export const CIPHER_ROUNDS: { word: string; mode: 'entschluesseln' | 'verschluesseln' }[] = [
  { word: 'HALLO', mode: 'entschluesseln' },
  { word: 'FUCHS', mode: 'entschluesseln' },
  { word: 'OMA', mode: 'verschluesseln' },
];

export const LOGIN_ROUNDS: { url: string; safe: boolean; why: string }[] = [
  {
    url: 'https://www.fuchsbank.de/login',
    safe: true,
    why: 'Schloss da, und die Adresse gehört wirklich zu fuchsbank.de. Hier darfst du dich anmelden.',
  },
  {
    url: 'http://www.fuchsbank.de/login',
    safe: false,
    why: 'Kein s, kein Schloss: Unterwegs könnte jeder dein Passwort mitlesen. Nie hier eingeben!',
  },
  {
    url: 'https://fuchsbank.sicher-anmelden.xyz/login',
    safe: false,
    why: 'Das Schloss ist da – aber die Adresse gehört zu sicher-anmelden.xyz. Das Schloss schützt nur den Weg, nicht vor einer falschen Seite.',
  },
  {
    url: 'https://de.wikipedia.org/w/index.php?title=Spezial:Anmelden',
    safe: true,
    why: 'Schloss da, und die Adresse gehört zu wikipedia.org. Das ist echt.',
  },
  {
    url: 'http://gratis-spielgeld.net/einloggen',
    safe: false,
    why: 'Kein Schloss und Gratis-Versprechen: So eine Seite will nur deine Anmeldedaten.',
  },
  {
    url: 'https://www.kika.de/mitmachen',
    safe: true,
    why: 'Schloss da, und die Adresse gehört zu kika.de. Trotzdem gilt: Passwörter nur eingeben, wenn deine Eltern einverstanden sind.',
  },
];
