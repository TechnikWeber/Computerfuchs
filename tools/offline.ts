import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

/** Alle Dateien eines Ordners, relativ zu ihm und mit / getrennt. */
function listFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full, base) : [relative(base, full).split(sep).join('/')];
  });
}

/**
 * Erzeugt dist/sw.js: einen Service Worker, der alle gebauten Dateien
 * vorab speichert. Ändert sich eine Datei, ändert sich die Versionsnummer
 * im Service Worker – und der Browser holt sich die neue Fassung.
 */
export function offline(): Plugin {
  let root = '';
  let publicDir = '';
  return {
    name: 'computerfuchs-offline',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      root = config.root;
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const template = readFileSync(resolve(root, 'tools/sw-template.js'), 'utf8');
      const hash = createHash('sha256').update(template);
      const built = Object.keys(bundle);
      const pub = publicDir ? listFiles(publicDir) : [];
      for (const name of built) {
        const item = bundle[name];
        hash.update(name);
        hash.update(item.type === 'chunk' ? item.code : item.source);
      }
      for (const name of pub) {
        hash.update(name);
        hash.update(readFileSync(join(publicDir, name)));
      }
      const files = [...new Set(['index.html', ...built, ...pub])].filter((f) => f !== 'sw.js' && !f.endsWith('.map')).sort();
      const source = template
        .replace('__VERSION__', JSON.stringify(hash.digest('hex').slice(0, 12)))
        .replace('__FILES__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
