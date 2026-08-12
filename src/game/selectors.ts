import { LOCATION_BY_SLOT } from './data/locations';
import { saturatingAdd, saturatingWealth } from './numbers';
import type { GameState } from './types';

type RootState = { game: GameState };

export const selectGame = (state: RootState): GameState => state.game;

export const selectCurrentLocation = (state: RootState) =>
  state.game.currentLocationSlot === null ? undefined : LOCATION_BY_SLOT.get(state.game.currentLocationSlot);

export const selectStorageUsed = (state: RootState): number =>
  state.game.inventory.reduce(
    (total, item) => saturatingAdd(total, item.quantity),
    0,
  );

export const selectTotalWealth = (state: RootState): number =>
  saturatingWealth(state.game.cash, state.game.savings, state.game.debt);

export const selectDayNumber = (state: RootState): number =>
  Math.min(state.game.totalDays, state.game.totalDays - state.game.remainingTurns + 1);
