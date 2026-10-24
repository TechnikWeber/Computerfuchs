import { SYSTEM_FOLDERS, type FileNode } from '../../core/files';
import { usePictureUrl } from '../../core/pictures';
import { cursorPreview } from '../../os/cursors';
import { Emoji } from '../../os/Emoji';
import { Wallpaper } from '../../os/Wallpaper';

/** Vorschau eines gemalten Bildes */
function Painting({ picture }: { picture: string }) {
  const url = usePictureUrl(picture);
  return url ? <img src={url} alt="" draggable={false} /> : null;
}

/** Symbol für einen Eintrag – Bilder zeigen sich selbst, wie die Vorschau an einem echten Computer. */
export function FileIcon({ node, systemId, size = 64 }: { node?: FileNode; systemId?: string; size?: number }) {
  if (systemId) {
    const sys = SYSTEM_FOLDERS.find((f) => f.id === systemId);
    return (
      <span className="file-icon is-folder" style={{ width: size, height: size }}>
        <Emoji name="file-folder" size={size} />
        {sys && sys.id !== 'root' && (
          <span className="file-badge">
            <Emoji name={sys.icon} size={size * 0.42} />
          </span>
        )}
      </span>
    );
  }
  if (!node) return null;
  if (node.folder) {
    return (
      <span className="file-icon is-folder" style={{ width: size, height: size }}>
        <Emoji name="file-folder" size={size} />
      </span>
    );
  }
  const c = node.content;
  if (!c) return null;
  switch (c.type) {
    case 'bild':
    case 'sticker':
      return (
        <span className="file-icon is-picture" style={{ width: size, height: size }}>
          <Emoji name={c.emoji} size={size * 0.78} />
        </span>
      );
    case 'gemalt':
      return (
        <span className="file-icon is-painting" style={{ width: size * 1.2, height: size * 0.75 }}>
          <Painting picture={c.picture} />
        </span>
      );
    case 'hintergrund':
      return (
        <span className="file-icon is-wallpaper" style={{ width: size * 1.2, height: size * 0.8 }}>
          <Wallpaper id={c.wallpaper} />
        </span>
      );
    case 'zeiger':
      return (
        <span className="file-icon is-picture" style={{ width: size, height: size }}>
          <img src={cursorPreview(c.cursor, Math.round(size * 0.7))} width={size * 0.7} height={size * 0.7} alt="" />
        </span>
      );
    case 'musik':
      return (
        <span className="file-icon" style={{ width: size, height: size }}>
          <Emoji name="musical-notes" size={size * 0.85} />
        </span>
      );
    case 'text':
      return (
        <span className="file-icon" style={{ width: size, height: size }}>
          <Emoji name="memo" size={size * 0.85} />
        </span>
      );
  }
}
