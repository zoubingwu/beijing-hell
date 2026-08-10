import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: 'small' | 'medium' | 'large';
}

const FOCUSABLE = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Win98Dialog({
  title,
  children,
  onClose,
  width = 'medium',
}: DialogProps) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div className="dialogBackdrop" role="presentation">
      <section
        ref={dialogRef}
        className={`win98Dialog ${width}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
      >
        <div className="titleBar dialogTitleBar">
          <strong>{title}</strong>
          <div className="windowControls">
            <button type="button" onClick={onClose} aria-label="关闭">×</button>
          </div>
        </div>
        <div className="dialogContent">{children}</div>
      </section>
    </div>
  );
}
