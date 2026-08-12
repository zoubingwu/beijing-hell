import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameStore } from '../app/store';
import { endEarly } from './gameSlice';
import { gameRuntime, type GameRuntime } from './runtime';
import { createRandomTape } from './test/randomTape';
import { initialGameState } from './gameSlice';

const NEW_GAME_TAPE = [
  { maxExclusive: 350, value: 0 },
  { maxExclusive: 15000, value: 0 },
  { maxExclusive: 50, value: 0 },
  { maxExclusive: 2500, value: 1000 },
  { maxExclusive: 9000, value: 8999 },
  { maxExclusive: 600, value: 42 },
  { maxExclusive: 750, value: 42 },
  { maxExclusive: 180, value: 179 },
  { maxExclusive: 8, value: 0 },
  { maxExclusive: 8, value: 0 },
  { maxExclusive: 8, value: 0 },
] as const;

function createFixedRuntime(): GameRuntime & { assertConsumed(): void } {
  const tape = createRandomTape(NEW_GAME_TAPE);
  return {
    nextInt: tape.nextInt,
    now: () => '2026-08-12T00:00:00.000Z',
    createId: () => 'fixed-score-id',
    assertConsumed: tape.assertConsumed,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('production runtime', () => {
  it('returns both valid integer boundaries', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9999999999999999);

    expect(gameRuntime.nextInt(8)).toBe(0);
    expect(gameRuntime.nextInt(8)).toBe(7);
  });

  it.each([0, -1, 1.5])('rejects an invalid upper bound: %s', (maxExclusive) => {
    expect(() => gameRuntime.nextInt(maxExclusive)).toThrow('正整数');
  });
});

describe('strict integer random tape', () => {
  it('reports exhaustion', () => {
    const tape = createRandomTape([{ maxExclusive: 8, value: 3 }]);
    expect(tape.nextInt(8)).toBe(3);
    expect(() => tape.nextInt(8)).toThrow('已耗尽');
  });

  it('reports an unexpected upper bound', () => {
    const tape = createRandomTape([{ maxExclusive: 8, value: 3 }]);
    expect(() => tape.nextInt(7)).toThrow('上界不匹配');
  });

  it.each([0, -1, 1.5])('rejects an invalid actual upper bound: %s', (maxExclusive) => {
    const tape = createRandomTape([{ maxExclusive: 8, value: 3 }]);
    expect(() => tape.nextInt(maxExclusive)).toThrow('正整数');
  });

  it.each([0, -1, 1.5])('rejects an invalid expected upper bound: %s', (maxExclusive) => {
    expect(() => createRandomTape([{ maxExclusive, value: 0 }])).toThrow('正整数');
  });

  it('reports an out-of-range value', () => {
    const tape = createRandomTape([{ maxExclusive: 8, value: 8 }]);
    expect(() => tape.nextInt(8)).toThrow('值越界');
  });

  it('reports unconsumed entries', () => {
    const tape = createRandomTape([{ maxExclusive: 8, value: 3 }]);
    expect(() => tape.assertConsumed()).toThrow('仍有 1 项未消费');
  });
});

describe('injected runtime', () => {
  it('uses injected time and ID metadata when a positive-wealth game ends', () => {
    const makeRuntime = (id: string, completedAt: string): GameRuntime => ({
      nextInt: () => { throw new Error('unexpected random call'); },
      now: () => completedAt,
      createId: () => id,
    });
    const preloadedGame = {
      ...initialGameState,
      cash: 10_000,
      debt: 0,
      savings: 0,
      highScores: [],
      inventory: [],
    };
    const firstStore = createGameStore({
      runtime: makeRuntime('first-id', '2026-08-12T00:00:00.000Z'),
      preloadedGame,
    });
    const secondStore = createGameStore({
      runtime: makeRuntime('second-id', '2026-08-13T00:00:00.000Z'),
      preloadedGame,
    });

    firstStore.dispatch(endEarly());
    secondStore.dispatch(endEarly());

    expect(firstStore.getState().game.highScores[0]).toMatchObject({
      id: 'first-id',
      completedAt: '2026-08-12T00:00:00.000Z',
    });
    expect(secondStore.getState().game.highScores[0]).toMatchObject({
      id: 'second-id',
      completedAt: '2026-08-13T00:00:00.000Z',
    });
    expect(firstStore.getState().game).not.toEqual(secondStore.getState().game);
  });

  it('produces deeply equal new games from the same random, time, and ID inputs', () => {
    const firstRuntime = createFixedRuntime();
    const secondRuntime = createFixedRuntime();
    const firstStore = createGameStore({ runtime: firstRuntime });
    const secondStore = createGameStore({ runtime: secondRuntime });

    firstStore.dispatch(endEarly());
    secondStore.dispatch(endEarly());

    expect(firstStore.getState().game).toEqual(secondStore.getState().game);
    firstRuntime.assertConsumed();
    secondRuntime.assertConsumed();
  });
});
