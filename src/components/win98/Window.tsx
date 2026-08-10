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

interface ResizeState {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  left: number;
  top: number;
}

interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TASKBAR_HEIGHT = 30;

const clampSize = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, Math.min(minimum, maximum)), maximum);

const createInitialGeometry = (): WindowGeometry => {
  const width = Math.min(720, window.innerWidth - 8);
  const height = Math.min(650, window.innerHeight - TASKBAR_HEIGHT - 8);
  return {
    x: Math.max(4, Math.floor((window.innerWidth - width) / 2)),
    y: Math.max(4, Math.floor((window.innerHeight - TASKBAR_HEIGHT - height) / 2)),
    width,
    height,
  };
};

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
  const resizeRef = useRef<ResizeState | null>(null);
  const [geometry, setGeometry] = useState(createInitialGeometry);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const resize = resizeRef.current;
      if (resize && event.pointerId === resize.pointerId) {
        const maximumWidth = Math.max(1, window.innerWidth - resize.left - 4);
        const maximumHeight = Math.max(
          1,
          window.innerHeight - TASKBAR_HEIGHT - resize.top - 4,
        );
        setGeometry((current) => ({
          ...current,
          width: clampSize(
            resize.startWidth + event.clientX - resize.startX,
            540,
            maximumWidth,
          ),
          height: clampSize(
            resize.startHeight + event.clientY - resize.startY,
            470,
            maximumHeight,
          ),
        }));
        return;
      }

      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const maxX = Math.max(4, window.innerWidth - 160);
      const maxY = Math.max(4, window.innerHeight - 56);
      setGeometry((current) => ({
        ...current,
        x: Math.min(maxX, Math.max(4, event.clientX - drag.offsetX)),
        y: Math.min(maxY, Math.max(4, event.clientY - drag.offsetY)),
      }));
    };
    const stop = () => {
      dragRef.current = null;
      resizeRef.current = null;
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

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized || event.button !== 0) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      left: rect.left,
      top: rect.top,
    };
  };

  return (
    <section
      ref={windowRef}
      className={`win98Window${maximized ? ' maximized' : ''}`}
      style={
        maximized
          ? undefined
          : {
              left: geometry.x,
              top: geometry.y,
              width: geometry.width,
              height: geometry.height,
            }
      }
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
      <div
        className="windowResizeHandle"
        onPointerDown={startResize}
        aria-hidden="true"
      />
    </section>
  );
}
