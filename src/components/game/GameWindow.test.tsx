// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';
import { createGameStore } from '../../app/store';
import { initialGameState } from '../../game/gameSlice';
import type { GameRuntime } from '../../game/runtime';
import { GameWindow } from './GameWindow';

const throwingRuntime: GameRuntime = {
  nextInt: () => { throw new Error('airport must not use RNG'); },
  now: () => { throw new Error('airport must not use clock'); },
  createId: () => { throw new Error('airport must not create IDs'); },
};

const roots: Root[] = [];
const containers: HTMLDivElement[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  for (const container of containers.splice(0)) container.remove();
});

describe('GameWindow airport integration', () => {
  it('opens and closes airport information without changing game state', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const store = createGameStore({
      runtime: throwingRuntime,
      preloadedGame: structuredClone(initialGameState),
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    act(() => {
      root.render(
        <Provider store={store}>
          <GameWindow onClose={() => undefined} onMinimize={() => undefined} />
        </Provider>,
      );
    });
    const before = structuredClone(store.getState().game);
    const airportButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('机场'),
    );
    expect(airportButton).toBeDefined();

    act(() => airportButton?.click());
    expect(store.getState().game).toEqual(before);
    expect(container.querySelector('[role="dialog"][aria-label="首都国际机场"]')).not.toBeNull();
    expect(container.querySelector('[role="dialog"][aria-label="游戏结束"]')).toBeNull();
    expect(container.querySelector('[role="dialog"][aria-label="结束本局"]')).toBeNull();

    const acknowledge = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '知道了',
    );
    expect(acknowledge).toBeDefined();
    act(() => acknowledge?.click());
    expect(store.getState().game).toEqual(before);
    expect(container.querySelector('[role="dialog"][aria-label="首都国际机场"]')).toBeNull();
  });
});
