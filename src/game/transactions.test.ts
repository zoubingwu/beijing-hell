import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import reducer, { buy, deposit, payDebt, sell, withdraw } from './gameSlice';
import { initialGameState } from './gameSlice';
import { DOMAIN_MAX } from './numbers';
import type { GameRuntime } from './runtime';
import type { GameState, ItemId } from './types';

const noRuntime: GameRuntime = {
  nextInt: () => { throw new Error('交易不得消费 RNG'); },
  now: () => 'now',
  createId: () => 'id',
};

const stateFactory = (patch: Partial<GameState> = {}): GameState => ({
  ...structuredClone(initialGameState),
  market: Array.from({ length: 8 }, (_, index) => ({ id: (index + 1) as ItemId, name: `商品${index + 1}`, marketPrice: 100 })),
  ...patch,
});
const storeFactory = (patch: Partial<GameState> = {}) => configureStore({
  reducer: { game: reducer },
  preloadedState: { game: stateFactory(patch) },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument: noRuntime } }),
});
const numeric = (state: GameState) => ({ cash: state.cash, savings: state.savings, debt: state.debt, fame: state.fame, hitpoint: state.hitpoint, maxStorage: state.maxStorage, remainingTurns: state.remainingTurns });

// The transaction reducers are deliberately tested with a throwing runtime: none are allowed to use randomness.
describe('交易 reducers', () => {
  it('buys cash, capacity, and weighted average price', () => {
    const store = storeFactory({ cash: 1_000, market: [{ id: 1, name: '商品1', marketPrice: 201 }], inventory: [{ id: 1, name: '商品1', averagePrice: 100, quantity: 3 }] });
    store.dispatch(buy({ itemId: 1, quantity: 2 }));
    expect(store.getState().game.cash).toBe(598);
    expect(store.getState().game.inventory[0]).toMatchObject({ quantity: 5, averagePrice: 140 });
  });
  it('rejects unsafe integer transaction actions', () => {
    const store = storeFactory({ cash: DOMAIN_MAX, savings: DOMAIN_MAX, debt: DOMAIN_MAX });
    const before = numeric(store.getState().game);
    store.dispatch(buy({ itemId: 1, quantity: DOMAIN_MAX + 1 }));
    store.dispatch(sell({ itemId: 1, quantity: DOMAIN_MAX + 1 }));
    store.dispatch(deposit(DOMAIN_MAX + 1));
    store.dispatch(withdraw(DOMAIN_MAX + 1));
    store.dispatch(payDebt(DOMAIN_MAX + 1));
    expect(numeric(store.getState().game)).toEqual(before);
  });
  it('saturates sale cash at the safe-integer maximum', () => {
    const store = storeFactory({ cash: DOMAIN_MAX - 50, inventory: [{ id: 1, name: '商品1', averagePrice: 1, quantity: 1 }] });
    store.dispatch(sell({ itemId: 1, quantity: 1 }));
    expect(store.getState().game.cash).toBe(DOMAIN_MAX);
  });
  it('rejects combined cash and capacity limits without changing numeric state', () => {
    const store = storeFactory({ cash: 150, maxStorage: 3, inventory: [{ id: 1, name: '商品1', averagePrice: 100, quantity: 3 }] });
    const before = numeric(store.getState().game);
    store.dispatch(buy({ itemId: 1, quantity: 1 }));
    expect(numeric(store.getState().game)).toEqual(before);
  });
  it('rejects insufficient cash and max capacity without changing numeric state', () => {
    const cashStore = storeFactory({ cash: 50 });
    const cashBefore = numeric(cashStore.getState().game);
    cashStore.dispatch(buy({ itemId: 1, quantity: 1 }));
    expect(numeric(cashStore.getState().game)).toEqual(cashBefore);
    const capacityStore = storeFactory({ cash: 500, maxStorage: 3, inventory: [{ id: 1, name: '商品1', averagePrice: 100, quantity: 3 }] });
    const capacityBefore = numeric(capacityStore.getState().game);
    capacityStore.dispatch(buy({ itemId: 1, quantity: 1 }));
    expect(numeric(capacityStore.getState().game)).toEqual(capacityBefore);
  });
  it('buy zero is a numeric no-op', () => {
    const store = storeFactory({ cash: 321 }); const before = numeric(store.getState().game);
    store.dispatch(buy({ itemId: 1, quantity: 0 }));
    expect(numeric(store.getState().game)).toEqual(before);
  });
  it('rejects unavailable quote and overselling, including quote zero, preserving fame', () => {
    const unavailable = storeFactory({ market: [{ id: 1, name: '商品1', marketPrice: 0 }], inventory: [{ id: 1, name: '商品1', averagePrice: 100, quantity: 2 }] });
    const unavailableBefore = numeric(unavailable.getState().game);
    unavailable.dispatch(sell({ itemId: 1, quantity: 1 }));
    expect(numeric(unavailable.getState().game)).toEqual(unavailableBefore);
    expect(unavailable.getState().game.fame).toBe(100);
    const store = storeFactory({ inventory: [{ id: 1, name: '商品1', averagePrice: 100, quantity: 2 }] });
    const oversellBefore = numeric(store.getState().game);
    store.dispatch(sell({ itemId: 1, quantity: 3 }));
    expect(numeric(store.getState().game)).toEqual(oversellBefore);
  });
  it('item seven penalty is independent of quantity, split sales stack, and sell zero still penalizes', () => {
    const one = storeFactory({ cash: 10, fame: 50, inventory: [{ id: 7, name: '商品7', averagePrice: 1, quantity: 1 }] });
    one.dispatch(sell({ itemId: 7, quantity: 1 }));
    expect(one.getState().game.fame).toBe(43);
    const twenty = storeFactory({ cash: 10, fame: 50, inventory: [{ id: 7, name: '商品7', averagePrice: 1, quantity: 20 }] });
    twenty.dispatch(sell({ itemId: 7, quantity: 20 }));
    expect(twenty.getState().game.fame).toBe(43);
    expect(twenty.getState().game.cash).toBe(2010);
    const split = storeFactory({ cash: 10, fame: 50, inventory: [{ id: 7, name: '商品7', averagePrice: 1, quantity: 2 }] });
    split.dispatch(sell({ itemId: 7, quantity: 0 }));
    split.dispatch(sell({ itemId: 7, quantity: 1 }));
    split.dispatch(sell({ itemId: 7, quantity: 1 }));
    expect(split.getState().game.fame).toBe(29);
  });
  it('ordinary item sale adds exact cash without changing fame', () => {
    const store = storeFactory({ cash: 10, fame: 50, inventory: [{ id: 1, name: '商品1', averagePrice: 1, quantity: 2 }] });
    store.dispatch(sell({ itemId: 1, quantity: 2 }));
    expect(store.getState().game.cash).toBe(210);
    expect(store.getState().game.fame).toBe(50);
  });
  it('item five penalty is ten and clamps fame at zero; split sales apply twice', () => {
    const store = storeFactory({ fame: 20, inventory: [{ id: 5, name: '商品5', averagePrice: 1, quantity: 2 }] });
    store.dispatch(sell({ itemId: 5, quantity: 1 })); store.dispatch(sell({ itemId: 5, quantity: 0 }));
    store.dispatch(sell({ itemId: 5, quantity: 1 }));
    expect(store.getState().game.fame).toBe(0);
  });
  it.each([
    ['deposit', deposit, 'cash', 500], ['withdraw', withdraw, 'savings', 500], ['payDebt', payDebt, 'debt', 500],
  ] as const)('%s zero is accepted as a numeric no-op', (_name, action, _field, _amount) => {
    const store = storeFactory({ cash: 500, savings: 500, debt: 500 }); const before = numeric(store.getState().game);
    store.dispatch(action(0));
    expect(numeric(store.getState().game)).toEqual(before);
  });
  it('debt payment is limited by available cash', () => {
    const store = storeFactory({ cash: 30, debt: 100 });
    const before = numeric(store.getState().game);
    store.dispatch(payDebt(100));
    expect(numeric(store.getState().game)).toEqual(before);
    store.dispatch(payDebt(30));
    expect(store.getState().game).toMatchObject({ cash: 0, debt: 70 });
  });
  it('deposit, withdraw, and debt payment enforce max bounds', () => {
    const store = storeFactory({ cash: 100, savings: 80, debt: 70 });
    store.dispatch(deposit(100)); expect(store.getState().game).toMatchObject({ cash: 0, savings: 180 });
    store.dispatch(withdraw(180)); expect(store.getState().game).toMatchObject({ cash: 180, savings: 0 });
    store.dispatch(payDebt(70)); expect(store.getState().game).toMatchObject({ cash: 110, debt: 0 });
    const before = numeric(store.getState().game); store.dispatch(payDebt(1));
    expect(numeric(store.getState().game)).toEqual(before);
  });
  it.each([deposit, withdraw, payDebt])('rejects negative and fractional amounts', (action) => {
    const store = storeFactory({ cash: 100, savings: 100, debt: 100 }); const before = numeric(store.getState().game);
    store.dispatch(action(-1)); store.dispatch(action(1.5));
    expect(numeric(store.getState().game)).toEqual(before);
  });
});
