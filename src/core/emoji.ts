/*
 * Bilder aus Microsofts Fluent-Emoji (MIT-Lizenz), als SVG in public/emoji.
 * Eigene Dateien statt System-Emoji: Sie sehen auf jedem Gerät gleich aus –
 * auch auf einem schlanken Linux-Kiosk, dem die Emoji-Schrift fehlt.
 */
export const EMOJI = [
  '1st-place-medal', 'abacus', 'artist-palette', 'badger', 'balloon', 'banana', 'bar-chart', 'bat', 'bear',
  'blossom', 'blowfish', 'bone', 'books', 'brain', 'butterfly', 'carrot', 'cat-face', 'cheese-wedge', 'cherries',
  'chestnut', 'chipmunk', 'clapping-hands', 'coin', 'computer-mouse', 'cookie', 'coral', 'crab', 'crescent-moon',
  'crown', 'cupcake', 'desktop-computer', 'dog-face', 'dolphin', 'doughnut', 'duck', 'envelope', 'euro-banknote',
  'file-folder', 'fish', 'floppy-disk', 'four-leaf-clover', 'fox', 'frog', 'gear', 'gem-stone', 'ghost',
  'globe-with-meridians', 'glowing-star', 'grapes', 'guitar', 'hamster', 'hedgehog', 'herb', 'hibiscus', 'honey-pot',
  'honeybee', 'hourglass-done', 'input-latin-uppercase', 'input-numbers', 'jellyfish', 'joystick', 'key', 'keyboard',
  'kite', 'koala', 'lady-beetle', 'laptop', 'light-bulb', 'lion', 'lobster', 'locked', 'lollipop',
  'magnifying-glass-tilted-left', 'mantelpiece-clock', 'memo', 'monkey-face', 'mouse-face', 'musical-notes',
  'octopus', 'open-book', 'optical-disk', 'owl', 'package', 'panda', 'party-popper', 'penguin', 'puzzle-piece',
  'rabbit-face', 'raccoon', 'rainbow', 'red-apple', 'red-heart', 'ringed-planet', 'robot', 'rocket', 'sauropod',
  'seal', 'seedling', 'shark', 'shield', 'shopping-bags', 'shrimp', 'soccer-ball', 'soft-ice-cream', 'sparkles',
  'speaker-high-volume', 'speech-balloon', 'spiral-shell', 'spouting-whale', 'squid', 'star', 'strawberry',
  'sunflower', 't-rex', 'teddy-bear', 'thumbs-up', 'tiger-face', 'trophy', 'tropical-fish', 'tulip', 'turtle',
  'unicorn', 'wastebasket', 'watermelon', 'waving-hand', 'wrapped-gift', 'wrench', 'yo-yo',
] as const;

export type EmojiName = (typeof EMOJI)[number];

export function emojiUrl(name: EmojiName): string {
  return `${import.meta.env.BASE_URL}emoji/${name}.svg`;
}
