import startIcon from '../../assets/start.png';
import earthIcon from '../../assets/earth.ico';
import { useClock } from '../../hooks/useClock';

interface TaskbarProps {
  gameOpen: boolean;
  gameMinimized: boolean;
  startOpen: boolean;
  onToggleStart: () => void;
  onToggleGame: () => void;
}

export function Taskbar({
  gameOpen,
  gameMinimized,
  startOpen,
  onToggleStart,
  onToggleGame,
}: TaskbarProps) {
  const time = useClock();
  const clock = `${String(time.getHours()).padStart(2, '0')}:${String(
    time.getMinutes(),
  ).padStart(2, '0')}`;

  return (
    <footer
      className="taskbar"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={`win98Button startButton${startOpen ? ' pressed' : ''}`}
        onClick={onToggleStart}
        aria-expanded={startOpen}
      >
        <img src={startIcon} alt="" />
        <b>开始</b>
      </button>
      <div className="taskbarDivider" />
      <div className="taskbarTasks">
        {gameOpen ? (
          <button
            type="button"
            className={`win98Button taskButton${!gameMinimized ? ' active' : ''}`}
            onClick={onToggleGame}
          >
            <img src={earthIcon} alt="" />
            北京浮生记
          </button>
        ) : null}
      </div>
      <div className="tray" title={time.toLocaleString('zh-CN')}>
        <span aria-hidden="true">▰</span>
        <time>{clock}</time>
      </div>
    </footer>
  );
}
