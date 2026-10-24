import { describe, expect, it } from 'vitest';
import {
  blobToDataUrl, dataUrlToBlob, loadPicture, newPictureId, picturesForExport, savePicture, storeImportedPictures, sweepPictures,
} from './pictures';
import { isPictureId } from './files';

// In Node gibt es keine IndexedDB – die Bilder landen dann im Arbeitsspeicher, genau wie im Notfall im Browser.

const png = () => new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])], { type: 'image/png' });

describe('Gemalte Bilder', () => {
  it('bekommen gültige, eindeutige IDs', () => {
    const a = newPictureId();
    const b = newPictureId();
    expect(isPictureId(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(isPictureId('pic-../../böse')).toBe(false);
    expect(isPictureId(42)).toBe(false);
  });

  it('werden als Text verpackt und wieder ausgepackt', async () => {
    const url = await blobToDataUrl(png());
    expect(url).toMatch(/^data:image\/png;base64,/);
    const back = dataUrlToBlob(url);
    expect(back?.type).toBe('image/png');
    expect(new Uint8Array(await back!.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]));
    expect(dataUrlToBlob('data:text/html;base64,PGI+')).toBeNull();
    expect(dataUrlToBlob('javascript:alert(1)')).toBeNull();
  });

  it('werden gespeichert, geladen und mitgenommen', async () => {
    const id = newPictureId();
    // Ohne IndexedDB: nicht dauerhaft, aber bis zum Schließen da.
    expect(await savePicture(id, png())).toBe(false);
    expect((await loadPicture(id))?.size).toBe(11);
    expect(await loadPicture(newPictureId())).toBeNull();
    const out = await picturesForExport([id, newPictureId()]);
    expect(Object.keys(out)).toEqual([id]);
  });

  it('kommen aus einer Spielstand-Datei zurück – nur gültige', async () => {
    const id = newPictureId();
    const url = await blobToDataUrl(png());
    expect(await storeImportedPictures({ [id]: url, 'kaputt/../id': url, [newPictureId()]: 'data:text/plain;base64,aGk=' })).toBe(1);
    expect(await loadPicture(id)).not.toBeNull();
  });

  it('werden aufgeräumt, wenn keine Datei mehr auf sie zeigt', async () => {
    const keep = newPictureId();
    const gone = newPictureId();
    await savePicture(keep, png());
    await savePicture(gone, png());
    // Frische Bilder bleiben erst einmal liegen.
    await sweepPictures(new Set([keep]), new Set());
    expect(await loadPicture(gone)).not.toBeNull();
    await sweepPictures(new Set([keep]), new Set(), -1);
    expect(await loadPicture(gone)).toBeNull();
    expect(await loadPicture(keep)).not.toBeNull();
  });
});
