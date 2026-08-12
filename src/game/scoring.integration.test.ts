import { describe, expect, it } from 'vitest';
import { createGameStore } from '../app/store';
import { endEarly, factoryReset, initialGameState, restartGame, submitScoreName, travelTo } from './gameSlice';
import { serializeGameState, parseGameState } from './persistence';
import type { GameRuntime } from './runtime';
import type { GameState, HighScore } from './types';
import { createRandomTape } from './test/randomTape';

const runtime = (nextInt: GameRuntime['nextInt'], id = 'score-id', now = '2026-08-12T00:00:00.000Z'): GameRuntime => ({ nextInt, createId: () => id, now: () => now });
const newGameTape = () => createRandomTape([
  { maxExclusive: 350, value: 0 }, { maxExclusive: 15000, value: 0 }, { maxExclusive: 50, value: 0 }, { maxExclusive: 2500, value: 0 },
  { maxExclusive: 9000, value: 0 }, { maxExclusive: 600, value: 0 }, { maxExclusive: 750, value: 0 }, { maxExclusive: 180, value: 0 },
  { maxExclusive: 8, value: 0 }, { maxExclusive: 8, value: 0 }, { maxExclusive: 8, value: 0 },
]);
const state = (patch: Partial<GameState> = {}): GameState => ({ ...structuredClone(initialGameState), highScores: [], inventory: [], ...patch });
const quietTape = (remaining: 1 | 2): ReturnType<typeof createRandomTape> => createRandomTape([
  ...Array.from({ length: 8 }, (_, i) => ({ maxExclusive: [350, 15000, 50, 2500, 9000, 600, 750, 180][i], value: 0 })),
  ...(remaining > 2 ? Array.from({ length: 3 }, () => ({ maxExclusive: 8, value: 1 })) : []),
  ...Array.from({ length: 18 }, () => ({ maxExclusive: 950, value: 1 })),
  ...Array.from({ length: 12 }, () => ({ maxExclusive: 1000, value: 1 })),
  ...Array.from({ length: 7 }, () => ({ maxExclusive: 1000, value: 1 })),
  { maxExclusive: 1000, value: 1 },
]);
const scores = (wealth: number): HighScore[] => [{ id: 'old', name: '旧榜', wealth, health: 50, fameLabel: '差' }];

describe('production scoring flow', () => {
  it('manual qualifying end preserves inventory and computes exact pending score', () => {
    const store = createGameStore({ preloadedGame: state({ cash: 100, savings: 30, debt: 20, hitpoint: 77, fame: 88, inventory: [{ id: 1, name: '盗版VCD、游戏', averagePrice: 5, quantity: 2 }] }), runtime: runtime(() => { throw new Error('no random'); }) });
    store.dispatch(endEarly());
    expect(store.getState().game).toMatchObject({ status: 'won', endReason: 'manual', finalWealth: 110, inventory: [{ quantity: 2 }], pendingScore: { id: 'score-id', completedAt: '2026-08-12T00:00:00.000Z', wealth: 110, health: 77, fame: 88, fameLabel: '一般般' } });
  });
  it('empty high score board still creates a pending score', () => {
    const store = createGameStore({ preloadedGame: state({ cash: 1, debt: 0 }), runtime: runtime(() => { throw new Error('no random'); }) });
    store.dispatch(endEarly());
    expect(store.getState().game.pendingScore?.wealth).toBe(1);
  });
  it.each([1, 2])('positive wealth %i does not qualify against default tail', (wealth) => {
    const store = createGameStore({ preloadedGame: state({ cash: wealth, highScores: scores(wealth + 1) }), runtime: runtime(() => { throw new Error('no random'); }) });
    store.dispatch(endEarly()); expect(store.getState().game.pendingScore).toBeNull();
  });
  it.each([0, -1])('nonpositive wealth %i does not qualify', (wealth) => {
    const store = createGameStore({ preloadedGame: state({ cash: Math.max(0, wealth), debt: wealth < 0 ? 1 : 0 }), runtime: runtime(() => { throw new Error('no random'); }) });
    store.dispatch(endEarly()); expect(store.getState().game.pendingScore).toBeNull();
  });
  it('submitting whitespace uses 无名氏, strips fame, and is idempotent', () => {
    const store = createGameStore({ preloadedGame: state({ cash: 10, debt: 0 }), runtime: runtime(() => { throw new Error('no random'); }) });
    store.dispatch(endEarly()); store.dispatch(submitScoreName('  '));
    const row = store.getState().game.highScores.find(x => x.id === 'score-id');
    expect(row).toEqual({ id: 'score-id', name: '无名氏', wealth: 10, health: 100, fameLabel: '德高望重', completedAt: '2026-08-12T00:00:00.000Z' });
    expect(row).not.toHaveProperty('fame'); expect(store.getState().game.pendingScore).toBeNull();
    const before = structuredClone(store.getState().game.highScores); store.dispatch(submitScoreName('again')); expect(store.getState().game.highScores).toEqual(before);
  });
  it('restart is a no-op while pending and consumes no runtime', () => {
    const store = createGameStore({ preloadedGame: state({ cash: 10, debt: 0 }), runtime: runtime(() => { throw new Error('no random'); }) }); store.dispatch(endEarly()); const before = store.getState().game;
    store.dispatch(restartGame()); expect(store.getState().game).toEqual(before);
  });
  it('normal restart preserves scores and factory reset restores exact defaults', () => {
    const tape = newGameTape();
    const old = scores(99); const store = createGameStore({ preloadedGame: state({ highScores: old, cash: 999 }), runtime: runtime(tape.nextInt) });
    store.dispatch(restartGame()); expect(store.getState().game.highScores).toEqual(old); expect(store.getState().game.cash).toBe(2000); tape.assertConsumed();
    const resetTape = newGameTape();
    const resetStore = createGameStore({ preloadedGame: state({ highScores: old }), runtime: runtime(resetTape.nextInt) }); resetStore.dispatch(factoryReset());
    expect(resetStore.getState().game).toMatchObject({ cash: 2000, debt: 5500, highScores: initialGameState.highScores, pendingScore: null, status: 'playing', remainingTurns: 40 }); resetTape.assertConsumed();
  });
  it('manual end excludes inventory while automatic final travel liquidates it', () => {
    const manual = createGameStore({ preloadedGame: state({ cash: 100, debt: 0, inventory: [{ id: 1, name: '盗版VCD、游戏', averagePrice: 5, quantity: 2 }] }), runtime: runtime(() => { throw new Error('no random'); }) }); manual.dispatch(endEarly());
    const tape = quietTape(1); const automatic = createGameStore({ preloadedGame: state({ cash: 100, debt: 0, remainingTurns: 1, inventory: [{ id: 1, name: '盗版VCD、游戏', averagePrice: 5, quantity: 2 }] }), runtime: runtime(tape.nextInt) }); automatic.dispatch(travelTo(1));
    expect(manual.getState().game.inventory).toHaveLength(1); expect(manual.getState().game.finalWealth).toBe(100);
    expect(automatic.getState().game).toMatchObject({ status: 'won', finalWealth: 110, inventory: [], pendingScore: { wealth: 110 } }); tape.assertConsumed();
  });
  it('ordinary death with two turns left loses without pending score', () => {
    const tape = quietTape(2); const store = createGameStore({ preloadedGame: state({ remainingTurns: 2, hitpoint: -1, cash: 100 }), runtime: runtime(tape.nextInt) }); store.dispatch(travelTo(1));
    expect(store.getState().game).toMatchObject({ status: 'lost', endReason: 'died', deathObserved: true, pendingScore: null }); expect(store.getState().game.inventory).toEqual([]); tape.assertConsumed();
  });
  it('final-day health death completes, submits, and round-trips persistence', () => {
    const tape = createRandomTape([...Array.from({ length: 8 }, (_, i) => ({ maxExclusive: [350,15000,50,2500,9000,600,750,180][i], value: 0 })), ...Array.from({ length: 18 }, () => ({ maxExclusive: 950, value: 1 })), { maxExclusive: 1000, value: 0 }, ...Array.from({ length: 7 }, () => ({ maxExclusive: 1000, value: 1 })), { maxExclusive: 1000, value: 1 }]);
    const store = createGameStore({ preloadedGame: state({ remainingTurns: 1, hitpoint: 2, cash: 100, debt: 0 }), runtime: runtime(tape.nextInt) }); store.dispatch(travelTo(1)); const game = store.getState().game;
    expect(game).toMatchObject({ status: 'won', endReason: 'completed', deathObserved: true, finalWealth: 100, pendingScore: { health: -1 } }); store.dispatch(submitScoreName('终局')); expect(parseGameState(serializeGameState(store.getState().game))).toEqual(store.getState().game); tape.assertConsumed();
  });
  it('final debt beating completes without observing death and does not qualify', () => {
    const tape = quietTape(1); const store = createGameStore({ preloadedGame: state({ remainingTurns: 1, debt: 100001, hitpoint: 20, cash: 100 }), runtime: runtime(tape.nextInt) }); store.dispatch(travelTo(1));
    expect(store.getState().game).toMatchObject({ status: 'lost', endReason: 'completed', debt: 110001, hitpoint: -10, deathObserved: false, pendingScore: null }); tape.assertConsumed();
  });
  it('final market event adjusts liquidation quote exactly', () => {
    const tape = createRandomTape([...Array.from({ length: 8 }, (_, i) => ({ maxExclusive: [350,15000,50,2500,9000,600,750,180][i], value: 0 })), ...Array.from({ length: 18 }, (_, i) => ({ maxExclusive: 950, value: i === 3 ? 0 : 1 })), ...Array.from({ length: 12 }, () => ({ maxExclusive: 1000, value: 1 })), ...Array.from({ length: 7 }, () => ({ maxExclusive: 1000, value: 1 })), { maxExclusive: 1000, value: 1 }]);
    const store = createGameStore({ preloadedGame: state({ remainingTurns: 1, cash: 100, debt: 0, inventory: [{ id: 1, name: '盗版VCD、游戏', averagePrice: 5, quantity: 2 }] }), runtime: runtime(tape.nextInt) }); store.dispatch(travelTo(1));
    expect(store.getState().game).toMatchObject({ finalWealth: 140, cash: 140, inventory: [], pendingScore: { wealth: 140 } }); tape.assertConsumed();
  });
});
