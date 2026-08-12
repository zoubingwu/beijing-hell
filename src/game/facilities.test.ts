import { describe, expect, it } from 'vitest';
import { createGameStore } from '../app/store';
import { createNewGameState, heal, rentStorage, restartGame, visitInternetCafe } from './gameSlice';
import type { GameRuntime } from './runtime';
import type { GameState } from './types';

const runtime = (random: number, onRandom?: () => void, expectedMax?: number): GameRuntime => ({
  nextInt: (maxExclusive) => {
    if (expectedMax !== undefined && maxExclusive !== expectedMax) throw new Error(`unexpected maxExclusive ${maxExclusive}`);
    onRandom?.(); return random;
  },
  now: () => 'now',
  createId: () => 'id',
});
const stateFactory = (patch: Partial<GameState> = {}) => ({ ...structuredClone(createNewGameState(runtime(0))), ...patch });
const storeFactory = (patch: Partial<GameState>, random = 0, onRandom?: () => void, expectedMax?: number) => createGameStore({ preloadedGame: stateFactory(patch), runtime: runtime(random, onRandom, expectedMax) });
const numeric = (state: GameState) => ({ cash: state.cash, hitpoint: state.hitpoint, maxStorage: state.maxStorage, internetCafeVisits: state.internetCafeVisits, remainingTurns: state.remainingTurns });

describe('设施 reducers and thunk guards', () => {
  it('heals three points for 10500, including negative health', () => {
    const store = storeFactory({ cash: 20_000, hitpoint: -1 });
    store.dispatch(heal(3));
    expect(store.getState().game).toMatchObject({ cash: 9_500, hitpoint: 2 });
  });
  it('rejects hospital treatment with one yuan short, at full health, or negative points', () => {
    for (const patch of [{ cash: 10_499, hitpoint: 0 }, { cash: 20_000, hitpoint: 100 }, { cash: 20_000, hitpoint: 50 }]) {
      const store = storeFactory(patch); const before = numeric(store.getState().game);
      store.dispatch(heal(patch.hitpoint === 50 ? -1 : 3));
      expect(numeric(store.getState().game)).toEqual(before);
    }
  });
  it.each([
    [29_999, 100, 29_999], [30_000, 100, 5_000], [30_001, 100, 13_000], [100_001, 100, 48_000],
  ])('rent boundary cash %i at capacity %i gives cash %i', (cash, capacity, expectedCash) => {
    const store = storeFactory({ cash, maxStorage: capacity }); store.dispatch(rentStorage());
    if (cash < 30_000) expect(store.getState().game).toMatchObject({ cash, maxStorage: capacity });
    else expect(store.getState().game).toMatchObject({ cash: expectedCash, maxStorage: capacity + 10 });
  });
  it('rejects rent at max capacity', () => {
    const store = storeFactory({ cash: 1_000_000, maxStorage: 140 }); const before = numeric(store.getState().game);
    store.dispatch(rentStorage()); expect(numeric(store.getState().game)).toEqual(before);
  });
  it.each([14, 15])('cafe cash boundary %i', (cash) => {
    let calls = 0; const store = storeFactory({ cash }, 0, () => { calls += 1; }, 10); const beforeTurns = store.getState().game.remainingTurns;
    store.dispatch(visitInternetCafe());
    if (cash === 14) expect(store.getState().game).toMatchObject({ cash, internetCafeVisits: 0 });
    else expect(store.getState().game).toMatchObject({ cash: 16, internetCafeVisits: 1 });
    expect(calls).toBe(cash === 14 ? 0 : 1); expect(store.getState().game.remainingTurns).toBe(beforeTurns);
  });
  it('cafe rewards RNG zero as one and RNG nine as ten, then caps at three without RNG', () => {
    let calls = 0; const store = storeFactory({ cash: 15 }, 9, () => { calls += 1; }, 10);
    store.dispatch(visitInternetCafe()); expect(store.getState().game.cash).toBe(25);
    store.dispatch(visitInternetCafe()); store.dispatch(visitInternetCafe()); expect(store.getState().game.internetCafeVisits).toBe(3);
    const before = calls; store.dispatch(visitInternetCafe()); expect(calls).toBe(before);
  });
  it('restart thunk resets cafe visits with deterministic initial market', () => {
    const store = storeFactory({ cash: 15, internetCafeVisits: 3 });
    store.dispatch(restartGame());
    expect(store.getState().game).toMatchObject({ internetCafeVisits: 0, remainingTurns: 40, cash: 2_000 });
  });
});
