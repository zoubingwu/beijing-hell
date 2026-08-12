import { describe, expect, it } from 'vitest';
import { createGameStore } from '../app/store';
import { initialGameState, toggleLocationMode, travelTo } from './gameSlice';
import { LOCATIONS } from './data/locations';
import type { GameRuntime } from './runtime';
import { createRandomTape } from './test/randomTape';

describe('Plan005 location slots', () => {
  it('matches the exact subway/surface mapping', () => {
    expect(LOCATIONS).toEqual([
      { slot: 1, subway: '建国门', surface: '永安里' },
      { slot: 2, subway: '北京站', surface: '方庄' },
      { slot: 3, subway: '西直门', surface: '海淀大街' },
      { slot: 4, subway: '崇文门', surface: '永定门' },
      { slot: 5, subway: '东直门', surface: '三元西桥' },
      { slot: 6, subway: '复兴门', surface: '府右街' },
      { slot: 7, subway: '积水潭', surface: '亚运村' },
      { slot: 8, subway: '长椿街', surface: '玉泉营' },
      { slot: 9, subway: '公主坟', surface: '翠微路' },
      { slot: 10, subway: '苹果园', surface: '八角西路' },
    ]);
  });

  it('toggles mode without changing any other state or consuming runtime', () => {
    const runtime: GameRuntime = { nextInt: () => { throw new Error('toggle must not use RNG'); }, now: () => { throw new Error('toggle must not use clock'); }, createId: () => { throw new Error('toggle must not create IDs'); } };
    const store = createGameStore({ runtime, preloadedGame: initialGameState });
    const before = store.getState().game;
    store.dispatch(toggleLocationMode());
    const after = store.getState().game;
    expect(after.locationMode).toBe('surface');
    expect({ ...after, locationMode: before.locationMode }).toEqual(before);
  });

  it('slot 3 toggle then travel to 3 is a true no-op', () => {
    const runtime: GameRuntime = { nextInt: () => { throw new Error('same-location travel must not use RNG'); }, now: () => { throw new Error('same-location travel must not use clock'); }, createId: () => { throw new Error('same-location travel must not create IDs'); } };
    const preloadedGame = { ...initialGameState, currentLocationSlot: 3 as const };
    const store = createGameStore({ runtime, preloadedGame });
    const before = store.getState().game;
    store.dispatch(toggleLocationMode());
    store.dispatch(travelTo(3));
    expect(store.getState().game).toEqual({ ...before, locationMode: 'surface' });
  });

  it('travel to slot 4 advances with a strict turn tape', () => {
    const tape = createRandomTape([
      ...[350, 15000, 50, 2500, 9000, 600, 750, 180].map((maxExclusive) => ({ maxExclusive, value: 0 })),
      ...Array.from({ length: 3 }, () => ({ maxExclusive: 8, value: 1 })),
      ...[350, 15000, 50, 2500, 9000, 600, 750, 180].map((maxExclusive) => ({ maxExclusive, value: 0 })),
      ...Array.from({ length: 3 }, () => ({ maxExclusive: 8, value: 1 })),
      ...Array.from({ length: 18 }, () => ({ maxExclusive: 950, value: 1 })),
      ...Array.from({ length: 12 }, () => ({ maxExclusive: 1000, value: 1 })),
      ...Array.from({ length: 8 }, () => ({ maxExclusive: 1000, value: 1 })),
    ]);
    const store = createGameStore({ runtime: { ...tape, now: () => '2020-01-01T00:00:00.000Z', createId: () => 'location-test' } });
    store.dispatch(travelTo(4));
    expect(store.getState().game.currentLocationSlot).toBe(4);
    expect(store.getState().game.remainingTurns).toBe(39);
    tape.assertConsumed();
  });
});
