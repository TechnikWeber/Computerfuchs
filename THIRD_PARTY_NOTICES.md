# Third-party notices

Computerfuchs bundles the following third-party assets. Everything else in this
repository is © 2026 Philipp Weber under the MIT License (see `LICENSE`).

## Fluent Emoji (images in `public/emoji/`)

The colourful pictures are a curated subset of the *Color* style of
[Fluent Emoji](https://github.com/microsoft/fluentui-emoji) by Microsoft,
optimised with SVGO. They are used unchanged in appearance.

- Licence: MIT — full text in `public/emoji/LICENSE-fluentui-emoji.txt`
- Copyright (c) Microsoft Corporation

## Fonts (bundled at build time via Fontsource)

- [Nunito](https://fonts.google.com/specimen/Nunito) by Vernon Adams and others — SIL Open Font License 1.1
- [Fredoka](https://fonts.google.com/specimen/Fredoka) by Milena Brandão and Hafontia — SIL Open Font License 1.1

The font files are served from the same origin as the app. No request goes to
Google Fonts or any other third-party server.

## Songs

The melodies in `src/core/songs.ts` – *Alle meine Entchen*, *Hänschen klein*,
*Bruder Jakob*, the melody known as *Morgen kommt der Weihnachtsmann* (*Ah !
vous dirai-je, maman*) and *Zum Geburtstag viel Glück* (*Good Morning to All* by
Mildred and Patty Hill, 1893) – are traditional or long in the public domain.
They were written down as note sequences for this project and are played with
Web Audio; no recordings are included.

## Runtime libraries

- [React](https://react.dev) and React DOM — MIT License
