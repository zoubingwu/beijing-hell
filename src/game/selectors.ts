import { LOCATION_BY_ID } from './data/locations';
import type { GameState } from './types';

type RootState = { game: GameState };

export const selectGame = (state: RootState): GameState => state.game;

export const selectCurrentLocation = (state: RootState) =>
  state.game.currentLocationId === null ? undefined : LOCATION_BY_ID.get(state.game.currentLocationId);

export const selectStorageUsed = (state: RootState): number =>
  state.game.inventory.reduce((total, item) => total + item.quantity, 0);

export const selectTotalWealth = (state: RootState): number =>
  state.game.cash + state.game.savings - state.game.debt;

export const selectDayNumber = (state: RootState): number =>
  Math.min(state.game.totalDays, state.game.totalDays - state.game.remainingTurns + 1);
