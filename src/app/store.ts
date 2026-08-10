import { configureStore } from '@reduxjs/toolkit';
import gameReducer from '../game/gameSlice';
import { loadGameState, saveGameState } from '../game/persistence';

const persistedGame = loadGameState();

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
  preloadedState: persistedGame ? { game: persistedGame } : undefined,
});

let lastSavedGame = store.getState().game;
store.subscribe(() => {
  const nextGame = store.getState().game;
  if (nextGame !== lastSavedGame) {
    lastSavedGame = nextGame;
    saveGameState(nextGame);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
