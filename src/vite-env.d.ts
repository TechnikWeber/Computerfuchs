/// <reference types="vite/client" />

/** Versionsnummer aus package.json, beim Bauen eingesetzt. */
declare const __APP_VERSION__: string;
/** Kurzer Git-Stand, aus dem gebaut wurde (leer, wenn unbekannt). */
declare const __APP_COMMIT__: string;
/** Bauzeit als ISO-Text. */
declare const __APP_BUILT__: string;
