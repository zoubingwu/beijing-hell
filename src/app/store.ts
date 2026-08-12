import { configureStore } from '@reduxjs/toolkit';
import gameReducer, {
  createNewGameState,
  initialGameState,
} from '../game/gameSlice';
import { loadGameState, saveGameState } from '../game/persistence';
import { gameRuntime, type GameRuntime } from '../game/runtime';
import type { GameState } from '../game/types';

interface CreateGameStoreOptions {
  runtime?: GameRuntime;
  preloadedGame?: GameState;
  persist?: boolean;
}

export function createGameStore({
  runtime = gameRuntime,
  preloadedGame,
  persist = false,
}: CreateGameStoreOptions = {}) {
  const initialGame = preloadedGame ?? (
    runtime === gameRuntime ? initialGameState : createNewGameState(runtime)
  );
  const gameStore = configureStore({
    reducer: {
      game: gameReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: runtime },
      }),
    preloadedState: { game: initialGame },
  });

  if (persist) {
    let lastSavedGame = gameStore.getState().game;
    gameStore.subscribe(() => {
      const nextGame = gameStore.getState().game;
      if (nextGame !== lastSavedGame) {
        lastSavedGame = nextGame;
        saveGameState(nextGame);
      }
    });
  }

  return gameStore;
}

export const store = createGameStore({
  preloadedGame: loadGameState() ?? undefined,
  persist: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
