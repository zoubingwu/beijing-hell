// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameStore } from "../app/store";
import { buy, endEarly, initialGameState } from "./gameSlice";
import {
  clearGameState,
  loadPersistedState,
  parsePersistedState,
  saveGameState,
  serializeGameState,
  STORAGE_KEY,
} from "./persistence";

const legacyKeys = [
  "beijing-hell:save:v1",
  "beijing-hell:save:v2",
  "beijing-hell:save:v3",
  "beijing-hell:save:v4",
  "beijing-hell:save:v5",
] as const;

const storageMethod = (name: "getItem" | "setItem" | "removeItem") =>
  vi.spyOn(Storage.prototype, name);

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("browser persistence schema 6 key isolation", () => {
  it("preserves v1-v5 sentinels while saving and clearing only v6", () => {
    const sentinels = [
      "legacy-v1",
      "legacy-v2",
      "legacy-v3",
      "legacy-v4",
      "legacy-v5",
    ];
    legacyKeys.forEach((key, index) =>
      window.localStorage.setItem(key, sentinels[index]),
    );

    const state = structuredClone(initialGameState);
    saveGameState(state);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      serializeGameState(state),
    );
    legacyKeys.forEach((key, index) => {
      expect(window.localStorage.getItem(key)).toBe(sentinels[index]);
    });

    clearGameState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    legacyKeys.forEach((key, index) => {
      expect(window.localStorage.getItem(key)).toBe(sentinels[index]);
    });
  });

  it("returns null rather than throwing when Storage.getItem fails", () => {
    storageMethod("getItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(loadPersistedState()).toBeNull();
  });

  it("does not throw when Storage.setItem fails", () => {
    storageMethod("setItem").mockImplementation(() => {
      throw new DOMException("full");
    });
    expect(() => saveGameState(structuredClone(initialGameState))).not.toThrow();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("does not throw when Storage.removeItem fails", () => {
    window.localStorage.setItem(STORAGE_KEY, "sentinel");
    storageMethod("removeItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(() => clearGameState()).not.toThrow();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("sentinel");
  });

  it("persists an actual manual end and reloads exact result", () => {
    const preloadedGame = structuredClone(initialGameState);
    preloadedGame.cash = 1_000_000_000;
    preloadedGame.inventory = [{ id: 1, name: "盗版VCD、游戏", averagePrice: 5, quantity: 2 }];
    const runtime = { nextInt: () => { throw new Error("manual end must not consume random"); }, now: () => "2026-08-12T00:00:00.000Z", createId: () => "browser-manual-id" };
    const store = createGameStore({ preloadedGame, runtime, persist: true });
    store.dispatch(endEarly());
    const saved = window.localStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();
    const reloaded = parsePersistedState(saved!);
    expect(reloaded?.activeGame).toEqual(store.getState().game);
    expect(reloaded?.activeGame).toMatchObject({ endReason: "manual", pendingScore: { id: "browser-manual-id" }, inventory: preloadedGame.inventory });
  });

  it("persists a manually dispatched store update and parses it exactly", () => {
    const preloadedGame = structuredClone(initialGameState);
    preloadedGame.cash = 1_000;
    preloadedGame.market = preloadedGame.market.map((quote) => ({
      ...quote,
      marketPrice: quote.id === 1 ? 100 : quote.marketPrice,
    }));
    const store = createGameStore({ preloadedGame, persist: true });

    store.dispatch(buy({ itemId: 1, quantity: 2 }));

    const saved = window.localStorage.getItem(STORAGE_KEY);
    expect(saved).not.toBeNull();
    expect(parsePersistedState(saved!)).toEqual({
      activeGame: store.getState().game,
      highScores: store.getState().game.highScores,
    });
  });
});
