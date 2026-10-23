import { Emoji } from './Emoji';
import { ByteIcon } from './Icon';
import type { ToastInput } from './osContext';

export interface Toast extends ToastInput {
  id: number;
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.bytes ? <ByteIcon size={44} /> : t.icon ? <Emoji name={t.icon} size={44} /> : null}
          <div className="toast-text">
            <strong>{t.title}</strong>
            {t.text && <span>{t.text}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
