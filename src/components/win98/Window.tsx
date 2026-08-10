import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

interface WindowProps {
  title: string;
  icon?: string;
  maximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  children: ReactNode;
}

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

export function Window({
  title,
  icon,
  maximized,
  onMinimize,
  onToggleMaximize,
  onClose,
  children,
}: WindowProps) {
  const windowRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [position, setPosition] = useState(() => ({
    x: Math.max(4, Math.floor((window.innerWidth - 720) / 2)),
    y: Math.max(4, Math.floor((window.innerHeight - 650) / 2)),
  }));

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const maxX = Math.max(4, window.innerWidth - 160);
      const maxY = Math.max(4, window.innerHeight - 56);
      setPosition({
        x: Math.min(maxX, Math.max(4, event.clientX - drag.offsetX)),
        y: Math.min(maxY, Math.max(4, event.clientY - drag.offsetY)),
      });
    };
    const stop = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized || event.button !== 0) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  };

  return (
    <section
      ref={windowRef}
      className={`win98Window${maximized ? ' maximized' : ''}`}
      style={maximized ? undefined : { left: position.x, top: position.y }}
      role="dialog"
      aria-label={title}
    >
      <div
        className="titleBar"
        onPointerDown={startDrag}
        onDoubleClick={onToggleMaximize}
      >
        <div className="titleBarText">
          {icon ? <img src={icon} alt="" /> : null}
          <strong>{title}</strong>
        </div>
        <div className="windowControls" onDoubleClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={onMinimize} aria-label="最小化">_</button>
          <button type="button" onClick={onToggleMaximize} aria-label={maximized ? '还原' : '最大化'}>
            {maximized ? '❐' : '□'}
          </button>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </div>
      </div>
      <div className="windowBody">{children}</div>
    </section>
  );
}
