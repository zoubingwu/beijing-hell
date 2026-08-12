import { describe, expect, it } from "vitest";
import { createGameStore } from "../app/store";
import { DEFAULT_HIGH_SCORES } from "./data/highScores";
import { ITEMS } from "./data/items";
import { resolveTravel } from "./engine";
import { endEarly, initialGameState, toggleLocationMode } from "./gameSlice";
import { DOMAIN_MAX, saturatingWealth } from "./numbers";
import {
  createInitialGameState,
  isValidActiveGame,
  isValidHighScores,
  parseGameState,
  parsePersistedState,
  serializeGameState,
  serializePersistedState,
  STORAGE_KEY,
} from "./persistence";
import type { GameRuntime } from "./runtime";
import { createRandomTape } from "./test/randomTape";
import type { GameState, HighScore } from "./types";

const freshState = (): GameState => structuredClone(initialGameState);
const validTimestamp = "2026-08-12T00:00:00.000Z";

const endedState = (
  endReason: "completed" | "manual" | "died",
  wealth = 100,
): GameState => {
  const state = freshState();
  state.cash = Math.max(0, wealth);
  state.savings = 0;
  state.debt = wealth < 0 ? -wealth : 0;
  state.finalWealth = wealth;
  state.endReason = endReason;
  state.status = endReason === "died" ? "lost" : wealth > 0 ? "won" : "lost";
  state.remainingTurns = endReason === "completed" ? 0 : 12;
  state.deathObserved = endReason === "died";
  if (state.deathObserved) state.hitpoint = -1;
  return state;
};

const pendingState = (
  highScores: HighScore[] = [],
  wealth = 100,
): GameState => {
  const state = endedState("manual", wealth);
  state.highScores = highScores;
  state.pendingScore = {
    id: "pending-id",
    wealth,
    health: state.hitpoint,
    fame: state.fame,
    fameLabel: "德高望重",
    completedAt: validTimestamp,
  };
  return state;
};

const serializedParts = (state: GameState, highScores: unknown): string => {
  const { highScores: _embeddedScores, ...activeGame } = state;
  return JSON.stringify({ schemaVersion: 6, activeGame, highScores });
};

const quietTurnTape = () =>
  createRandomTape([
    ...[350, 15_000, 50, 2_500, 9_000, 600, 750, 180].map(
      (maxExclusive) => ({ maxExclusive, value: 0 }),
    ),
    ...Array.from({ length: 18 }, () => ({ maxExclusive: 950, value: 1 })),
    ...Array.from({ length: 12 }, () => ({ maxExclusive: 1_000, value: 1 })),
    ...Array.from({ length: 7 }, () => ({ maxExclusive: 1_000, value: 1 })),
    { maxExclusive: 1_000, value: 1 },
  ]);

describe("schema 6 persistence envelope", () => {
  it("uses the production v6 storage key", () => {
    expect(STORAGE_KEY).toBe("beijing-hell:save:v6");
  });

  it("round-trips a valid active game and rankings exactly", () => {
    const state = freshState();
    state.internetCafeVisits = 2;
    expect(parseGameState(serializeGameState(state))).toEqual(state);
  });

  it("omits embedded rankings from the serialized active payload", () => {
    const serialized = JSON.parse(serializeGameState(freshState()));
    expect(serialized.activeGame).not.toHaveProperty("highScores");
    expect(serialized.highScores).toEqual(DEFAULT_HIGH_SCORES);
  });

  it("round-trips a production manual end with pending score and inventory", () => {
    const preloadedGame = freshState();
    preloadedGame.cash = 100;
    preloadedGame.debt = 0;
    preloadedGame.highScores = [];
    preloadedGame.inventory = [
      {
        id: 1,
        name: ITEMS[0].name,
        averagePrice: 5,
        quantity: 2,
      },
    ];
    const runtime: GameRuntime = {
      nextInt: () => {
        throw new Error("manual completion must not consume random values");
      },
      createId: () => "manual-id",
      now: () => validTimestamp,
    };
    const store = createGameStore({ preloadedGame, runtime });
    store.dispatch(endEarly());
    const completed = store.getState().game;

    expect(completed).toMatchObject({
      status: "won",
      endReason: "manual",
      finalWealth: 100,
      inventory: [{ quantity: 2 }],
      pendingScore: { id: "manual-id", wealth: 100 },
    });
    expect(parseGameState(serializeGameState(completed))).toEqual(completed);
  });

  it("keeps a valid active game with valid rankings", () => {
    const state = freshState();
    const parsed = parsePersistedState(
      serializePersistedState({
        activeGame: state,
        highScores: state.highScores,
      }),
    );
    expect(parsed).toEqual({ activeGame: state, highScores: state.highScores });
  });

  it.each([
    ["missing", undefined],
    ["invalid", "corrupt"],
  ])("keeps a valid active game but defaults %s rankings", (_case, scores) => {
    const state = freshState();
    const parsed = parsePersistedState(serializedParts(state, scores));
    expect(parsed?.activeGame).toEqual({
      ...state,
      highScores: DEFAULT_HIGH_SCORES,
    });
    expect(parsed?.highScores).toEqual(DEFAULT_HIGH_SCORES);
  });

  it("keeps valid rankings but drops an invalid active game", () => {
    const state = freshState();
    state.remainingTurns = -1;
    const parsed = parsePersistedState(
      serializedParts(state, DEFAULT_HIGH_SCORES),
    );
    expect(parsed).toEqual({
      activeGame: null,
      highScores: DEFAULT_HIGH_SCORES,
    });
  });

  it("defaults rankings and drops active game when both are corrupt", () => {
    const state = freshState();
    state.cash = Number.MAX_VALUE;
    const parsed = parsePersistedState(serializedParts(state, null));
    expect(parsed).toEqual({
      activeGame: null,
      highScores: DEFAULT_HIGH_SCORES,
    });
  });

  it("preserves an explicitly empty valid leaderboard", () => {
    const state = freshState();
    state.highScores = [];
    const parsed = parsePersistedState(
      serializePersistedState({ activeGame: state, highScores: [] }),
    );
    expect(parsed).toEqual({ activeGame: state, highScores: [] });
  });

  it("creates a fresh game with exact empty persisted scores", () => {
    let received: HighScore[] | undefined;
    const created = freshState();
    created.highScores = [];
    const result = createInitialGameState(
      { activeGame: null, highScores: [] },
      {
        createNewGame: (scores) => {
          received = scores;
          return { ...created, highScores: scores };
        },
      },
    );
    expect(received).toEqual([]);
    expect(result.highScores).toEqual([]);
  });

  it("creates a fresh game with cloned defaults when no save exists", () => {
    let received: HighScore[] | undefined;
    createInitialGameState(null, {
      createNewGame: (scores) => {
        received = scores;
        return { ...freshState(), highScores: scores };
      },
    });
    expect(received).toEqual(DEFAULT_HIGH_SCORES);
    expect(received).not.toBe(DEFAULT_HIGH_SCORES);
  });

  it("returns an already valid active game without invoking the factory", () => {
    const state = freshState();
    expect(
      createInitialGameState(
        { activeGame: state, highScores: state.highScores },
        {
          createNewGame: () => {
            throw new Error("factory should not run");
          },
        },
      ),
    ).toBe(state);
  });

  it("rejects malformed JSON and future schemas", () => {
    expect(parsePersistedState("{" )).toBeNull();
    expect(
      parsePersistedState(JSON.stringify({ schemaVersion: 7 })),
    ).toBeNull();
  });

  it("ignores v1 active shapes and parsing is idempotent", () => {
    const legacy = JSON.stringify({
      schemaVersion: 1,
      currentDay: 39,
      currentLocation: 19,
      lastCafeDay: 3,
      highScores: [{ wealth: 1 }],
    });
    expect(parsePersistedState(legacy)).toBeNull();
    expect(parsePersistedState(legacy)).toBeNull();
  });
});

describe("schema 6 active-game invariants", () => {
  it.each([-1, 41])("rejects remainingTurns %s", (remainingTurns) => {
    const state = freshState();
    state.remainingTurns = remainingTurns;
    expect(isValidActiveGame(state)).toBe(false);
  });

  it("requires playing games to have positive turns and null end fields", () => {
    for (const patch of [
      { remainingTurns: 0 },
      { endReason: "manual" as const },
      { finalWealth: 1 },
      { deathObserved: true },
    ]) {
      expect(isValidActiveGame({ ...freshState(), ...patch })).toBe(false);
    }
  });

  it("accepts completed games only at zero turns with wealth-based status", () => {
    expect(isValidActiveGame(endedState("completed", 100))).toBe(true);
    expect(isValidActiveGame(endedState("completed", -1))).toBe(true);
    const wrongTurns = endedState("completed", 100);
    wrongTurns.remainingTurns = 1;
    expect(isValidActiveGame(wrongTurns)).toBe(false);
    const wrongStatus = endedState("completed", 100);
    wrongStatus.status = "lost";
    expect(isValidActiveGame(wrongStatus)).toBe(false);
  });

  it("requires observed death to have negative health globally", () => {
    const died = endedState("died", 100);
    died.hitpoint = 100;
    expect(isValidActiveGame(died)).toBe(false);
    for (const health of [0, 100]) {
      const completed = endedState("completed", 100);
      completed.deathObserved = true;
      completed.hitpoint = health;
      expect(isValidActiveGame(completed)).toBe(false);
    }
    const completed = endedState("completed", 100);
    completed.deathObserved = true;
    completed.hitpoint = -1;
    expect(isValidActiveGame(completed)).toBe(true);
    const debtBeating = freshState();
    debtBeating.hitpoint = -1;
    debtBeating.deathObserved = false;
    expect(isValidActiveGame(debtBeating)).toBe(true);
  });

  it("accepts manual ends only with 1..40 turns and no observed death", () => {
    expect(isValidActiveGame(endedState("manual", 100))).toBe(true);
    for (const remainingTurns of [0, 41]) {
      const state = endedState("manual", 100);
      state.remainingTurns = remainingTurns;
      expect(isValidActiveGame(state)).toBe(false);
    }
    const dead = endedState("manual", 100);
    dead.deathObserved = true;
    expect(isValidActiveGame(dead)).toBe(false);
  });

  it("accepts died games with positive turns even when wealth is positive", () => {
    const state = endedState("died", 100);
    expect(isValidActiveGame(state)).toBe(true);
    state.pendingScore = pendingState([], 100).pendingScore;
    expect(isValidActiveGame(state)).toBe(false);
  });

  it("rejects died games without observed death or with zero turns", () => {
    const unobserved = endedState("died", 100);
    unobserved.deathObserved = false;
    expect(isValidActiveGame(unobserved)).toBe(false);
    const noTurns = endedState("died", 100);
    noTurns.remainingTurns = 0;
    expect(isValidActiveGame(noTurns)).toBe(false);
  });

  it("requires finalWealth to equal exact saturated balances", () => {
    const state = endedState("manual", 100);
    state.finalWealth = 99;
    expect(isValidActiveGame(state)).toBe(false);

    const saturated = endedState("manual", DOMAIN_MAX);
    saturated.cash = DOMAIN_MAX;
    saturated.savings = DOMAIN_MAX;
    saturated.debt = 0;
    saturated.finalWealth = saturatingWealth(
      saturated.cash,
      saturated.savings,
      saturated.debt,
    );
    expect(isValidActiveGame(saturated)).toBe(true);
  });

  it("accepts negative safe-integer health down to the domain minimum", () => {
    for (const health of [-100, -DOMAIN_MAX]) {
      const state = freshState();
      state.hitpoint = health;
      expect(isValidActiveGame(state)).toBe(true);
    }
  });

  it.each([1.5, Number.MAX_VALUE, 101])(
    "rejects invalid active health %s",
    (health) => {
      const state = freshState();
      state.hitpoint = health;
      expect(isValidActiveGame(state)).toBe(false);
    },
  );

  it("rejects unsafe and non-finite economic balances", () => {
    for (const cash of [Number.MAX_VALUE, DOMAIN_MAX + 1, Infinity, NaN]) {
      const state = freshState();
      state.cash = cash;
      expect(isValidActiveGame(state)).toBe(false);
    }
  });

  it("requires all eight canonical market IDs and names", () => {
    const duplicate = freshState();
    duplicate.market[1].id = duplicate.market[0].id;
    expect(isValidActiveGame(duplicate)).toBe(false);

    const wrongName = freshState();
    wrongName.market[0].name = "not canonical";
    expect(isValidActiveGame(wrongName)).toBe(false);

    const missing = freshState();
    missing.market.pop();
    expect(isValidActiveGame(missing)).toBe(false);
  });

  it("requires canonical, unique inventory within capacity", () => {
    const state = freshState();
    state.inventory = [
      { id: 1, name: ITEMS[0].name, averagePrice: 1, quantity: 101 },
    ];
    expect(isValidActiveGame(state)).toBe(false);

    state.inventory = [
      { id: 1, name: ITEMS[0].name, averagePrice: 1, quantity: 1 },
      { id: 1, name: ITEMS[0].name, averagePrice: 1, quantity: 1 },
    ];
    expect(isValidActiveGame(state)).toBe(false);

    state.inventory = [
      { id: 1, name: "wrong", averagePrice: 1, quantity: 1 },
    ];
    expect(isValidActiveGame(state)).toBe(false);
  });

  it("accepts only the five reachable storage capacities", () => {
    for (const maxStorage of [100, 110, 120, 130, 140]) {
      expect(isValidActiveGame({ ...freshState(), maxStorage })).toBe(true);
    }
    expect(isValidActiveGame({ ...freshState(), maxStorage: 150 })).toBe(false);
  });

  it("rejects duplicate journals and non-increasing nextJournalId", () => {
    const duplicate = freshState();
    duplicate.journal.push({ ...duplicate.journal[0] });
    expect(isValidActiveGame(duplicate)).toBe(false);

    const nextId = freshState();
    nextId.nextJournalId = nextId.journal[0].id;
    expect(isValidActiveGame(nextId)).toBe(false);
  });
});

describe("rankings and pending-score invariants", () => {
  it("accepts safe negative ranking health and rejects fractional or unsafe health", () => {
    const valid = structuredClone(DEFAULT_HIGH_SCORES);
    valid[0].health = -100;
    expect(isValidHighScores(valid)).toBe(true);
    for (const health of [1.5, Number.MAX_VALUE, 101]) {
      const invalid = structuredClone(DEFAULT_HIGH_SCORES);
      invalid[0].health = health;
      expect(isValidHighScores(invalid)).toBe(false);
    }
  });

  it("rejects eleven, unsorted, and duplicate ranking IDs", () => {
    const eleven = [
      ...DEFAULT_HIGH_SCORES,
      { ...DEFAULT_HIGH_SCORES[9], id: "extra", wealth: 1 },
    ];
    expect(isValidHighScores(eleven)).toBe(false);

    const unsorted = structuredClone(DEFAULT_HIGH_SCORES);
    [unsorted[0], unsorted[1]] = [unsorted[1], unsorted[0]];
    expect(isValidHighScores(unsorted)).toBe(false);

    const duplicate = structuredClone(DEFAULT_HIGH_SCORES);
    duplicate[1].id = duplicate[0].id;
    expect(isValidHighScores(duplicate)).toBe(false);
  });

  it("rejects invalid ranking completion timestamps", () => {
    const scores = structuredClone(DEFAULT_HIGH_SCORES);
    scores[0].completedAt = "not-a-date";
    expect(isValidHighScores(scores)).toBe(false);
    scores[0].completedAt = validTimestamp;
    expect(isValidHighScores(scores)).toBe(true);
  });

  it("requires an exact pending snapshot and valid timestamp", () => {
    const state = pendingState();
    expect(isValidActiveGame(state)).toBe(true);
    for (const pendingPatch of [
      { wealth: 99 },
      { health: 99 },
      { fame: 99 },
      { fameLabel: "差" as const },
      { completedAt: "bad-date" },
    ]) {
      const invalid = pendingState();
      invalid.pendingScore = { ...invalid.pendingScore!, ...pendingPatch };
      expect(isValidActiveGame(invalid)).toBe(false);
    }
  });

  it("requires pending ID uniqueness when rankings are valid", () => {
    const state = pendingState(structuredClone(DEFAULT_HIGH_SCORES), DOMAIN_MAX);
    state.pendingScore!.id = DEFAULT_HIGH_SCORES[0].id;
    expect(isValidActiveGame(state)).toBe(false);
  });

  it("requires pending wealth to qualify when rankings are valid", () => {
    const state = pendingState(structuredClone(DEFAULT_HIGH_SCORES), 1);
    expect(isValidActiveGame(state)).toBe(false);
  });

  it.each([
    ["nonqualifying pending", 1, "orphan-id"],
    ["colliding pending", DOMAIN_MAX, DEFAULT_HIGH_SCORES[0].id],
  ])("replaces invalid rankings and drops %s pending score", (_label, wealth, id) => {
    const state = pendingState([], wealth);
    state.pendingScore!.id = id;
    const parsed = parsePersistedState(serializedParts(state, undefined));
    expect(parsed?.highScores).toEqual(DEFAULT_HIGH_SCORES);
    expect(parsed?.activeGame).not.toBeNull();
    expect(parsed?.activeGame?.pendingScore).toBeNull();
    expect(parsed?.activeGame && isValidActiveGame(parsed.activeGame)).toBe(true);
    expect(parseGameState(serializeGameState(parsed!.activeGame!))).toEqual(parsed!.activeGame);
  });

  it("preserves a qualifying noncolliding pending score with fallback rankings", () => {
    const state = pendingState([], DOMAIN_MAX);
    state.pendingScore!.id = "orphan-id";
    const parsed = parsePersistedState(serializedParts(state, undefined));
    expect(parsed?.activeGame?.pendingScore).toEqual(state.pendingScore);
    expect(isValidActiveGame(parsed?.activeGame)).toBe(true);
    expect(parseGameState(serializeGameState(parsed!.activeGame!))).toEqual(parsed!.activeGame);
  });

  it("rejects pending scores on playing, lost, or died games", () => {
    const pending = pendingState().pendingScore;
    const playing = freshState();
    playing.pendingScore = pending;
    expect(isValidActiveGame(playing)).toBe(false);

    const lost = endedState("completed", -1);
    lost.pendingScore = pending;
    expect(isValidActiveGame(lost)).toBe(false);

    const died = endedState("died", 100);
    died.pendingScore = pending;
    expect(isValidActiveGame(died)).toBe(false);
  });
});

describe("maximum safe-integer engine persistence", () => {
  it("rebases near-maximum journal IDs before appending", () => {
    const state = freshState();
    state.journal[0].id = DOMAIN_MAX - 2;
    state.nextJournalId = DOMAIN_MAX - 1;
    const store = createGameStore({ preloadedGame: state });

    store.dispatch(toggleLocationMode());
    store.dispatch({ type: "game/travelRejected", payload: "invalid route" });

    expect(store.getState().game.journal.map((entry) => entry.id)).toEqual([1, 2]);
    expect(store.getState().game.nextJournalId).toBe(3);
    expect(isValidActiveGame(store.getState().game)).toBe(true);
  });

  it("saturates a quiet engine transition and round-trips it", () => {
    const input = freshState();
    input.cash = DOMAIN_MAX;
    input.savings = DOMAIN_MAX;
    input.debt = DOMAIN_MAX;
    input.remainingTurns = 2;
    const tape = quietTurnTape();

    const result = resolveTravel(input, 1, { nextInt: tape.nextInt });

    expect(result.state).toMatchObject({
      cash: DOMAIN_MAX,
      savings: DOMAIN_MAX,
      debt: DOMAIN_MAX,
      hitpoint: 70,
      remainingTurns: 1,
    });
    expect(parseGameState(serializeGameState(result.state))).toEqual(
      result.state,
    );
    tape.assertConsumed();
  });
});
