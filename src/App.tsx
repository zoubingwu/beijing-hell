import { useState } from 'react';
import earthIcon from './assets/earth.ico';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { GameWindow } from './components/game/GameWindow';
import { Desktop } from './components/win98/Desktop';
import { Shortcut } from './components/win98/Shortcut';
import { StartMenu } from './components/win98/StartMenu';
import { Taskbar } from './components/win98/Taskbar';
import { Window } from './components/win98/Window';
import { restartGame } from './game/gameSlice';
import { selectDayNumber, selectGame } from './game/selectors';

export default function App() {
  const dispatch = useAppDispatch();
  const game = useAppSelector(selectGame);
  const day = useAppSelector(selectDayNumber);
  const [gameOpen, setGameOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [startOpen, setStartOpen] = useState(false);

  const openGame = () => {
    setGameOpen(true);
    setMinimized(false);
    setStartOpen(false);
  };

  const startNewGame = () => {
    dispatch(restartGame());
    openGame();
  };

  return (
    <Desktop
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setStartOpen(false);
      }}
    >
      <div className="desktopIcons">
        <Shortcut title="北京浮生记" icon={earthIcon} onOpen={openGame} />
      </div>

      {gameOpen && !minimized ? (
        <Window
          title={`北京浮生记（${day}/${game.totalDays}天）`}
          icon={earthIcon}
          maximized={maximized}
          onMinimize={() => setMinimized(true)}
          onToggleMaximize={() => setMaximized((value) => !value)}
          onClose={() => setGameOpen(false)}
        >
          <GameWindow
            onClose={() => setGameOpen(false)}
            onMinimize={() => setMinimized(true)}
          />
        </Window>
      ) : null}

      <StartMenu
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onOpenGame={openGame}
        onNewGame={startNewGame}
      />
      <Taskbar
        gameOpen={gameOpen}
        gameMinimized={minimized}
        startOpen={startOpen}
        onToggleStart={() => setStartOpen((value) => !value)}
        onToggleGame={() => {
          if (!gameOpen) openGame();
          else setMinimized((value) => !value);
        }}
      />
    </Desktop>
  );
}
