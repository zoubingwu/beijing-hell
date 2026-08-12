// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { initialGameState } from './gameSlice';
import { clearGameState, saveGameState, STORAGE_KEY } from './persistence';

const legacyKeys = [
  'beijing-hell:save:v1',
  'beijing-hell:save:v2',
  'beijing-hell:save:v3',
  'beijing-hell:save:v4',
] as const;

afterEach(() => {
  window.localStorage.clear();
});

describe('browser persistence schema 5 key isolation', () => {
  it('preserves legacy sentinels while saving and clearing only v5', () => {
    const sentinels = ['legacy-one', 'legacy-two', 'legacy-three', 'legacy-four'];
    legacyKeys.forEach((key, index) => window.localStorage.setItem(key, sentinels[index]));

    const state = structuredClone(initialGameState);
    saveGameState(state);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state));
    legacyKeys.forEach((key, index) => {
      expect(window.localStorage.getItem(key)).toBe(sentinels[index]);
    });

    clearGameState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    legacyKeys.forEach((key, index) => {
      expect(window.localStorage.getItem(key)).toBe(sentinels[index]);
    });
  });
});
