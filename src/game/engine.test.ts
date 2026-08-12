import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { createNewGameState, travelTo } from "./gameSlice";
import reducer from "./gameSlice";
import { resolveTravel } from "./engine";
import { createRandomTape, type RandomTapeEntry } from "./test/randomTape";
import type { GameRuntime } from "./runtime";
import type { GameState } from "./types";

const marketEntries = (soldOut = 3, value = 0): RandomTapeEntry[] => [
  ...Array.from({ length: 8 }, (_, i) => ({ maxExclusive: [350, 15000, 50, 2500, 9000, 600, 750, 180][i], value })),
  ...Array.from({ length: soldOut }, () => ({ maxExclusive: 8, value: 1 })),
];
const runtime = (tape: ReturnType<typeof createRandomTape>): GameRuntime => ({
  nextInt: tape.nextInt, now: () => "2026-01-01T00:00:00.000Z", createId: () => "test-id",
});
const turnTape = (remaining: number, opts: { health?: number; hospital?: [number, number, number]; cash?: boolean; phone?: boolean } = {}) => {
  const soldOut = remaining <= 2 ? 0 : 3;
  const market = marketEntries(soldOut);
  const marketEvents = Array.from({ length: 18 }, () => ({ maxExclusive: 950, value: 1 }));
  if (opts.phone) marketEvents[17] = { maxExclusive: 950, value: 0 };
  const health = opts.health === undefined
    ? Array.from({ length: 12 }, () => ({ maxExclusive: 1000, value: 1 }))
    : [...Array.from({ length: opts.health }, () => ({ maxExclusive: 1000, value: 1 })), { maxExclusive: 1000, value: 0 }];
  const cash = opts.cash ? [{ maxExclusive: 1000, value: 0 }] : Array.from({ length: 7 }, () => ({ maxExclusive: 1000, value: 1 }));
  return createRandomTape([...market, ...marketEvents, ...health, ...(opts.hospital ? [
    { maxExclusive: 2, value: opts.hospital[0] }, { maxExclusive: 29, value: opts.hospital[1] }, { maxExclusive: 8500, value: opts.hospital[2] },
  ] : []), ...cash, { maxExclusive: 1000, value: 1 }]);
};
const fresh = (setup: ReturnType<typeof createRandomTape>, patch: Partial<GameState> = {}) => ({ ...createNewGameState(runtime(setup)), ...patch });

describe("pure original turn engine", () => {
  it("starts with forty turns and no location", () => {
    const tape = createRandomTape(marketEntries());
    expect(createNewGameState(runtime(tape))).toMatchObject({ cash: 2000, savings: 0, debt: 5500, remainingTurns: 40, currentLocationId: null });
    tape.assertConsumed();
  });
  it("does not mutate input and applies debt interest before decrement", () => {
    const setup = createRandomTape(marketEntries()); const input = createNewGameState(runtime(setup)); setup.assertConsumed();
    const tape = turnTape(40); const before = structuredClone(input); const result = resolveTravel(input, 1, runtime(tape));
    expect(input).toEqual(before); expect(result.state.debt).toBe(6050); expect(result.state.savings).toBe(0); expect(result.state.remainingTurns).toBe(39); tape.assertConsumed();
  });
  it("applies savings interest deterministically", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { savings: 12345 }); setup.assertConsumed();
    const tape = turnTape(10); const result = resolveTravel(state, 2, runtime(tape)); expect(result.state.savings).toBe(12468); tape.assertConsumed();
  });
  it("logs phone, health, hospital, cash, beating in exact order and amount", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { debt: 100000, hitpoint: 50, cash: 1000, remainingTurns: 10 }); setup.assertConsumed();
    const tape = turnTape(10, { phone: true, health: 0, hospital: [0, 0, 100], cash: true });
    const result = resolveTravel(state, 3, runtime(tape));
    expect(result.logs.map(x => x.text)).toEqual([
      "媒体报道：又有日本出口到中国的产品出事了! 出事后日本人死不认帐,拒绝赔偿。村长得知此消息，托人把他用的水货手机（无任何厂商标识）硬卖给您，收您2500元。",
      "大街上两个流氓打了俺!", "俺被送进医院，欠款增加 1100 元，住院 1 天，健康恢复到 57。",
      "俺怜悯地铁口扮演成乞丐的老太太。", "俺欠钱太多，村长叫一群老乡揍了俺一顿！（损失30点健康）",
    ]);
    expect(result.state.debt).toBe(113600); expect(result.state.cash).toBe(900); expect(result.state.remainingTurns).toBe(8); tape.assertConsumed();
  });
  it("health exactly 84 enters hospital", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: 84, remainingTurns: 5 }); setup.assertConsumed();
    const tape = turnTape(5, { hospital: [0, 0, 0] }); const r = resolveTravel(state, 1, runtime(tape));
    expect(r.logs.some((log) => log.text.includes("住院 1 天"))).toBe(true);
    expect(r.state.hitpoint).toBe(94); tape.assertConsumed();
  });
  it("negative health with remaining 3 dies without hospital", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: -1, remainingTurns: 3 }); setup.assertConsumed();
    const tape = turnTape(3); const r = resolveTravel(state, 1, runtime(tape));
    expect(r.outcome).toBe("died"); expect(r.state.deathObserved).toBe(true);
    expect(r.logs.some((log) => log.text.includes("住院"))).toBe(false); tape.assertConsumed();
  });
  it("identical state and strict tape produce identical resolution", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { remainingTurns: 10, hitpoint: 50 }); setup.assertConsumed();
    const firstTape = turnTape(10, { phone: true, health: 0, hospital: [0, 0, 100], cash: true });
    const secondTape = turnTape(10, { phone: true, health: 0, hospital: [0, 0, 100], cash: true });
    const first = resolveTravel(state, 3, runtime(firstTape));
    const second = resolveTravel(state, 3, runtime(secondTape));
    expect(first).toEqual(second); firstTape.assertConsumed(); secondTape.assertConsumed();
  });
  it("hospital delay 1 consumes RNG in order and restores health", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: 50, remainingTurns: 10 }); setup.assertConsumed();
    const tape = turnTape(10, { health: 0, hospital: [0, 0, 100] }); const r = resolveTravel(state, 1, runtime(tape));
    expect(r.state).toMatchObject({ hitpoint: 57, debt: 7150, remainingTurns: 8 }); tape.assertConsumed();
  });
  it("hospital delay 2 consumes RNG in order", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: 50, remainingTurns: 10 }); setup.assertConsumed();
    const tape = turnTape(10, { health: 0, hospital: [1, 5, 200] }); const r = resolveTravel(state, 1, runtime(tape));
    expect(r.state).toMatchObject({ hitpoint: 57, debt: 8450, remainingTurns: 7 }); tape.assertConsumed();
  });
  it("remaining 3 does not enter hospital", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: 50, remainingTurns: 3 }); setup.assertConsumed();
    const tape = turnTape(3, { health: 0 }); const r = resolveTravel(state, 1, runtime(tape)); expect(r.state.remainingTurns).toBe(2); expect(r.state.debt).toBe(6050); tape.assertConsumed();
  });
  it("remaining 4 with delay 2 enters hospital and leaves 1", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: 50, remainingTurns: 4 }); setup.assertConsumed();
    const tape = turnTape(4, { health: 0, hospital: [1, 0, 0] }); const r = resolveTravel(state, 1, runtime(tape)); expect(r.state.remainingTurns).toBe(1); tape.assertConsumed();
  });
  it("health zero survives", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: 0, remainingTurns: 3 }); setup.assertConsumed();
    const tape = turnTape(3); const r = resolveTravel(state, 1, runtime(tape)); expect(r.outcome).toBe("continue"); expect(r.state.deathObserved).toBe(false); tape.assertConsumed();
  });
  it("negative health above three enters hospital", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: -1, remainingTurns: 5 }); setup.assertConsumed();
    const tape = turnTape(5, { hospital: [0, 0, 0] }); const r = resolveTravel(state, 1, runtime(tape)); expect(r.state.deathObserved).toBe(false); expect(r.state.hitpoint).toBe(9); tape.assertConsumed();
  });
  it("negative health remaining two dies after outer cash and turn", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: -1, remainingTurns: 2 }); setup.assertConsumed();
    const tape = turnTape(2); const r = resolveTravel(state, 1, runtime(tape)); expect(r.outcome).toBe("died"); expect(r.state.deathObserved).toBe(true); expect(r.state.remainingTurns).toBe(1); tape.assertConsumed();
  });
  it("negative health remaining one observes death but completes", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { hitpoint: -1, remainingTurns: 1 }); setup.assertConsumed();
    const tape = turnTape(1); const r = resolveTravel(state, 1, runtime(tape)); expect(r.outcome).toBe("completed"); expect(r.state.deathObserved).toBe(true); tape.assertConsumed();
  });
  it("debt beating can drive health below zero without observing death", () => {
    const setup = createRandomTape(marketEntries());
    const state = fresh(setup, { debt: 100000, hitpoint: 20, remainingTurns: 3 });
    setup.assertConsumed();
    const tape = turnTape(3);
    const r = resolveTravel(state, 1, runtime(tape));
    expect(r.state.hitpoint).toBe(-10);
    expect(r.state.deathObserved).toBe(false);
    expect(r.outcome).toBe("continue");
    tape.assertConsumed();
  });

  it.each([2, 1])("remaining %i consumes only eight market prices", (remaining) => {
    const setup = createRandomTape(marketEntries());
    const state = fresh(setup, { remainingTurns: remaining });
    setup.assertConsumed();
    const tape = turnTape(remaining);
    const result = resolveTravel(state, 1, runtime(tape));
    expect(tape.calls).toBe(8 + 18 + 12 + 7 + 1);
    expect(result.state.remainingTurns).toBe(remaining - 1);
    expect(result.outcome).toBe(remaining === 1 ? "completed" : "continue");
    if (remaining === 2) {
      expect(result.logs.some((log) => log.tone === "warning")).toBe(true);
    }
    tape.assertConsumed();
  });

  it("resolves forty quiet turns without negative remaining turns", () => {
    const setup = createRandomTape(marketEntries());
    let state = fresh(setup, { debt: 0 });
    setup.assertConsumed();
    let travels = 0;
    const quiet: GameRuntime = { nextInt: (max) => Math.min(1, max - 1), now: () => "now", createId: () => "id" };
    while (state.remainingTurns > 0) {
      const result = resolveTravel(state, 1, quiet);
      state = result.state;
      travels += 1;
      expect(state.remainingTurns).toBeGreaterThanOrEqual(0);
    }
    expect(travels).toBe(40);
  });

  it("counts a two-day hospital delay before thirty-eight quiet turns", () => {
    const setup = createRandomTape(marketEntries());
    let state = fresh(setup, { hitpoint: 80, debt: 0 });
    setup.assertConsumed();
    let calls = 0;
    let healthCalls = 0;
    let travels = 0;
    let successfulTravels = 0;
    const hospitalThenQuiet: GameRuntime = {
      nextInt: (max) => {
        calls += 1;
        if (max === 1000) {
          healthCalls += 1;
          return healthCalls === 1 ? 0 : 1;
        }
        return Math.min(1, max - 1);
      },
      now: () => "now",
      createId: () => "id",
    };
    while (state.remainingTurns > 0) {
      const result = resolveTravel(state, 1, hospitalThenQuiet);
      const previousRemaining = state.remainingTurns;
      state = result.state;
      travels += 1;
      if (state.remainingTurns < previousRemaining) successfulTravels += 1;
      expect(state.remainingTurns).toBeGreaterThanOrEqual(0);
    }
    expect(travels).toBe(38);
    expect(successfulTravels).toBe(38);
    expect(state.remainingTurns).toBe(0);
  });
});

describe("travel thunk guards and metadata", () => {
  const throwingMeta = (): GameRuntime => ({ nextInt: () => { throw new Error("unexpected RNG"); }, now: () => { throw new Error("unexpected now"); }, createId: () => { throw new Error("unexpected id"); } });
  it("same location uses no runtime and does not decrement", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { currentLocationId: 1 }); setup.assertConsumed();
    const store = configureStore({ reducer: { game: reducer }, middleware: g => g({ thunk: { extraArgument: throwingMeta() } }) });
    store.dispatch({ type: "game/restartGameResolved", payload: state });
    const before = store.getState().game;
    store.dispatch(travelTo(1));
    const after = store.getState().game;
    expect(after).toEqual(before);
  });
  it("valid nonfinal travel does not call metadata", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup); setup.assertConsumed(); const tape = turnTape(40);
    const store = configureStore({ reducer: { game: reducer }, middleware: g => g({ thunk: { extraArgument: { ...throwingMeta(), nextInt: tape.nextInt } } }) }); store.dispatch({ type: "game/restartGameResolved", payload: state }); store.dispatch(travelTo(1)); expect(store.getState().game.remainingTurns).toBe(39); tape.assertConsumed();
  });
  it("final completion calls metadata and auto-liquidates", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { debt: 0, fame: 37, remainingTurns: 1, inventory: [{ id: 1, name: "手机", averagePrice: 1, quantity: 2 }] }); setup.assertConsumed(); const tape = turnTape(1); let now = 0, ids = 0;
    const store = configureStore({ reducer: { game: reducer }, middleware: g => g({ thunk: { extraArgument: { nextInt: tape.nextInt, now: () => { now++; return "now"; }, createId: () => { ids++; return "id"; } } } }) });
    store.dispatch({ type: "game/restartGameResolved", payload: state });
    store.dispatch(travelTo(1));
    const result = store.getState().game;
    expect(result).toMatchObject({ status: "won", endReason: "completed", remainingTurns: 0 });
    expect(result.inventory).toEqual([]);
    expect(result.cash).toBeGreaterThan(2000);
    expect(result.fame).toBe(37);
    expect(result.journal.filter((entry) => entry.day === 40).length).toBeGreaterThanOrEqual(2);
    expect({ now, ids }).toEqual({ now: 1, ids: 1 });
    tape.assertConsumed();
  });
  it("died travel does not call metadata", () => {
    const setup = createRandomTape(marketEntries()); const state = fresh(setup, { remainingTurns: 2, hitpoint: -1 }); setup.assertConsumed(); const tape = turnTape(2);
    const store = configureStore({ reducer: { game: reducer }, middleware: g => g({ thunk: { extraArgument: { ...throwingMeta(), nextInt: tape.nextInt } } }) });
    store.dispatch({ type: "game/restartGameResolved", payload: state });
    store.dispatch(travelTo(1));
    const result = store.getState().game;
    expect(result).toMatchObject({ status: "lost", endReason: "died", deathObserved: true, remainingTurns: 1 });
    expect(result.highScores).toEqual(state.highScores);
    expect(result.inventory).toEqual(state.inventory);
    expect(result.journal.length).toBeGreaterThan(state.journal.length);
    tape.assertConsumed();
  });
});
