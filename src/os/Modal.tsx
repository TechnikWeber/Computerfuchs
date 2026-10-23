import { useEffect, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  /** Beschriftung für Vorleseprogramme */
  label: string;
}

/** Ein Hinweis über allem. Esc oder ein Klick daneben schließt ihn, wenn onClose gesetzt ist. */
export function Modal({ children, onClose, className, label }: Props) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={className ? `modal ${className}` : 'modal'} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
