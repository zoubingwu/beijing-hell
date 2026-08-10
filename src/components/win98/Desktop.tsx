import type { PointerEventHandler, ReactNode } from 'react';

interface DesktopProps {
  children: ReactNode;
  onPointerDown?: PointerEventHandler<HTMLElement>;
}

export function Desktop({ children, onPointerDown }: DesktopProps) {
  return (
    <main className="desktop" onPointerDown={onPointerDown}>
      {children}
    </main>
  );
}
