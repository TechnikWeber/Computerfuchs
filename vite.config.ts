import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { offline } from './tools/offline.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** Welcher Stand gebaut wurde – so sieht man in den Einstellungen, ob ein Update schon da ist. */
function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

// Relative Basis: Die Seite läuft so unter /Computerfuchs/ auf GitHub Pages,
// aber genauso auf einem Schulserver oder als lokale Kopie auf einem Kiosk-Laptop.
export default defineConfig({
  base: './',
  plugins: [react(), offline()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commit()),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
