import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// Relative Basis: Die Seite läuft so unter /Computerfuchs/ auf GitHub Pages,
// aber genauso auf einem Schulserver oder als lokale Kopie auf einem Kiosk-Laptop.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
