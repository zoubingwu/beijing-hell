import { describe, expect, it } from 'vitest';
import { initialGameState } from './gameSlice';
import { parseGameState, serializeGameState, STORAGE_KEY } from './persistence';

describe('save schema 3 parser', () => {
  it('round-trips internet cafe visits without browser storage', () => {
    const state = { ...structuredClone(initialGameState), internetCafeVisits: 2 };
    const parsed = parseGameState(serializeGameState(state));
    expect(STORAGE_KEY).toBe('beijing-hell:save:v3');
    expect(parsed).toEqual(state);
  });

  it('rejects the schema 2 lastCafeDay shape for Plan007 migration', () => {
    const legacy = { ...structuredClone(initialGameState), schemaVersion: 2 as 2, lastCafeDay: null };
    expect(parseGameState(JSON.stringify(legacy))).toBeNull();
  });
});
