/*
 * Bilder aus Microsofts Fluent-Emoji (MIT-Lizenz), als SVG in public/emoji.
 * Eigene Dateien statt System-Emoji: Sie sehen auf jedem Gerät gleich aus –
 * auch auf einem schlanken Linux-Kiosk, dem die Emoji-Schrift fehlt.
 */
export const EMOJI = [
  '1st-place-medal', 'abacus', 'anchor', 'artist-palette', 'badger', 'balloon', 'banana', 'bar-chart', 'bat', 'bear',
  'blossom', 'blowfish', 'bone', 'books', 'boy', 'brain', 'butterfly', 'carrot', 'cat-face', 'cheese-wedge',
  'cherries', 'chestnut', 'chipmunk', 'clapping-hands', 'cloud', 'cloud-with-lightning', 'coin', 'computer-mouse',
  'cookie', 'coral', 'crab', 'crescent-moon', 'crown', 'cupcake', 'desktop-computer', 'dog-face', 'dolphin',
  'doughnut', 'duck', 'envelope', 'envelope-with-arrow', 'euro-banknote', 'file-folder', 'fish', 'floppy-disk',
  'four-leaf-clover', 'fox', 'frog', 'gear', 'gem-stone', 'ghost', 'globe-showing-europe-africa',
  'globe-with-meridians', 'glowing-star', 'grapes', 'guitar', 'hamster', 'hedgehog', 'herb', 'hibiscus',
  'high-voltage', 'honey-pot', 'honeybee', 'hourglass-done', 'house', 'house-with-garden', 'input-latin-uppercase',
  'input-numbers', 'jellyfish', 'joystick', 'key', 'keyboard', 'kite', 'koala', 'lady-beetle', 'laptop', 'ledger',
  'light-bulb', 'lion', 'lobster', 'locked', 'locked-with-key', 'lollipop', 'magnifying-glass-tilted-left',
  'mantelpiece-clock', 'memo', 'mobile-phone', 'monkey-face', 'mouse-face', 'musical-notes', 'octopus',
  'office-building', 'old-key', 'old-woman', 'open-book', 'optical-disk', 'owl', 'package', 'panda', 'party-popper',
  'penguin', 'pizza', 'popcorn', 'puzzle-piece', 'rabbit-face', 'raccoon', 'rainbow', 'red-apple', 'red-heart',
  'ringed-planet', 'robot', 'rocket', 'sauropod', 'school', 'seal', 'seedling', 'shark', 'shield', 'shopping-bags',
  'shrimp', 'soccer-ball', 'soft-ice-cream', 'sparkles', 'speaker-high-volume', 'speech-balloon', 'spiral-shell',
  'spouting-whale', 'squid', 'star', 'stopwatch', 'strawberry', 'sun-behind-small-cloud', 'sunflower', 't-rex',
  'teddy-bear', 'television', 'thumbs-up', 'tiger-face', 'tractor', 'trophy', 'tropical-fish', 'tulip', 'turtle',
  'unicorn', 'unlocked', 'wastebasket', 'water-wave', 'watermelon', 'waving-hand', 'wireless', 'wrapped-gift',
  'wrench', 'yo-yo',
] as const;

export type EmojiName = (typeof EMOJI)[number];

export function emojiUrl(name: EmojiName): string {
  return `${import.meta.env.BASE_URL}emoji/${name}.svg`;
}
