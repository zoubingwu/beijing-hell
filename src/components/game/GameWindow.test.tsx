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
  it('shows a death-aware result when a completed win observed death', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const store = createGameStore({
      runtime: throwingRuntime,
      preloadedGame: {
        ...structuredClone(initialGameState),
        status: 'won',
        endReason: 'completed',
        deathObserved: true,
        pendingScore: null,
      },
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

    const heading = container.querySelector('h3');
    expect(heading?.textContent).not.toContain('恭喜！你活着离开了北京。');
    expect(heading?.textContent).toContain('没能活着离开北京');
  });

  it('opens help through the button menu sequence and shows canonical rules and item ids', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const store = createGameStore({ runtime: throwingRuntime, preloadedGame: structuredClone(initialGameState) });
    const container = document.createElement('div'); document.body.appendChild(container); containers.push(container);
    const root = createRoot(container); roots.push(root);
    act(() => { root.render(<Provider store={store}><GameWindow onClose={() => undefined} onMinimize={() => undefined} /></Provider>); });
    const help = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('帮助'));
    act(() => help?.click());
    const item = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('游戏说明'));
    act(() => item?.click());
    const text = container.textContent ?? '';
    for (const phrase of ['5,500', '10%', '1%', '低于85', '3天', '3,500', '15', '3次', '事件后', '手动结束不清仓', '机场', '盗版VCD']) expect(text).toContain(phrase);
    expect(text).toContain('现金恰好30,000元时剩5,000元，超过30,000元时剩下“现金整数除以2，再减2,000元”');
  });

  it('links the about dialog to this remake repository', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const store = createGameStore({ runtime: throwingRuntime, preloadedGame: structuredClone(initialGameState) });
    const container = document.createElement('div'); document.body.appendChild(container); containers.push(container);
    const root = createRoot(container); roots.push(root);
    act(() => { root.render(<Provider store={store}><GameWindow onClose={() => undefined} onMinimize={() => undefined} /></Provider>); });
    const help = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('帮助'));
    act(() => help?.click());
    const about = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('关于北京浮生记'));
    act(() => about?.click());
    const link = container.querySelector<HTMLAnchorElement>('.aboutRepoLink');
    expect(link?.href).toBe('https://github.com/zoubingwu/beijing-hell');
    expect(link?.textContent?.trim()).toBe('github.com/zoubingwu/beijing-hell');
    expect(container.textContent).not.toContain('chrisguo/beijing_fushengji');
  });

  it('uses end reason and observed death for result copy', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const renderResult = (patch: Partial<typeof initialGameState>) => {
      const store = createGameStore({ runtime: throwingRuntime, preloadedGame: { ...structuredClone(initialGameState), status: 'won', pendingScore: null, ...patch } });
      const container = document.createElement('div'); document.body.appendChild(container); containers.push(container);
      const root = createRoot(container); roots.push(root);
      act(() => { root.render(<Provider store={store}><GameWindow onClose={() => undefined} onMinimize={() => undefined} /></Provider>); });
      return container.textContent ?? '';
    };
    const manual = renderResult({ endReason: 'manual', deathObserved: false });
    const manualWithUnrelatedFields = renderResult({
      status: 'lost',
      endReason: 'manual',
      deathObserved: false,
      hitpoint: -99,
      cash: 0,
      debt: 999_999,
      finalWealth: -999_999,
    });
    expect(manual).toContain('俺决定提前结束，本局已按现有资产结算');
    expect(manualWithUnrelatedFields).toContain('俺决定提前结束，本局已按现有资产结算');
    const died = renderResult({ status: 'lost', endReason: 'died', deathObserved: true });
    const diedWithUnrelatedFields = renderResult({ status: 'won', endReason: 'died', deathObserved: true, cash: 999_999 });
    expect(died).toContain('健康降到零以下，本局结束');
    expect(diedWithUnrelatedFields).toContain('健康降到零以下，本局结束');
    expect(died).not.toContain('健康事件'); expect(died).not.toContain('欠债来源');
  });

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
