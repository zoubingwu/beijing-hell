import { describe, expect, it } from "vitest";
import { createGameStore } from "../app/store";
import {
  buy, deposit, endEarly, heal, initialGameState, payDebt, rentStorage,
  sell, submitScoreName, toggleLocationMode, travelTo, visitInternetCafe,
  withdraw,
} from "./gameSlice";
import { parseGameState, serializeGameState } from "./persistence";
import type { GameRuntime } from "./runtime";
import type { GameState } from "./types";
import { createRandomTape, type RandomTapeEntry } from "./test/randomTape";
import { DEFAULT_HIGH_SCORES } from "./data/highScores";

const bounds = [350, 15000, 50, 2500, 9000, 600, 750, 180];
const runtime = (tape: ReturnType<typeof createRandomTape>, id = "integration-id"): GameRuntime => ({
  nextInt: tape.nextInt, createId: () => id, now: () => "2026-08-12T00:00:00.000Z",
});
const state = (patch: Partial<GameState> = {}): GameState => ({
  ...structuredClone(initialGameState), highScores: [], inventory: [], ...patch,
});
const turn = (remaining: number, options: { health?: number; hospital?: [number, number, number]; cash?: boolean; market?: number[]; hacker?: boolean } = {}): RandomTapeEntry[] => [
  ...bounds.map((maxExclusive, i) => ({ maxExclusive, value: options.market?.[i] ?? 0 })),
  ...(remaining > 2 ? Array.from({ length: 3 }, () => ({ maxExclusive: 8, value: 1 })) : []),
  ...Array.from({ length: 18 }, (_, i) => ({ maxExclusive: 950, value: options.market?.[8 + i] ?? 1 })),
  ...(options.health === undefined ? Array.from({ length: 12 }, () => ({ maxExclusive: 1000, value: 1 })) : [
    ...Array.from({ length: options.health }, () => ({ maxExclusive: 1000, value: 1 })), { maxExclusive: 1000, value: 0 },
  ]),
  ...(options.hospital ? [{ maxExclusive: 2, value: options.hospital[0] }, { maxExclusive: 29, value: options.hospital[1] }, { maxExclusive: 8500, value: options.hospital[2] }] : []),
  ...(options.cash ? [{ maxExclusive: 1000, value: 0 }] : Array.from({ length: 7 }, () => ({ maxExclusive: 1000, value: 1 }))),
  { maxExclusive: 1000, value: options.hacker ? 0 : 1 },
];
const quietTape = (start: number, count = start): ReturnType<typeof createRandomTape> => createRandomTape(Array.from({ length: count }, (_, i) => turn(start - i)) .flat());

const specialTurn = (): RandomTapeEntry[] => [
  ...bounds.map((maxExclusive) => ({ maxExclusive, value: 0 })),
  ...Array.from({ length: 3 }, () => ({ maxExclusive: 8, value: 1 })),
  ...Array.from({ length: 18 }, (_, i) => ({ maxExclusive: 950, value: i === 0 || i === 17 ? 0 : 1 })),
  { maxExclusive: 1000, value: 0 },
  { maxExclusive: 2, value: 1 }, { maxExclusive: 29, value: 0 }, { maxExclusive: 8500, value: 0 },
  ...Array.from({ length: 4 }, () => ({ maxExclusive: 1000, value: 1 })),
  { maxExclusive: 1000, value: 0 },
  { maxExclusive: 1000, value: 0 }, { maxExclusive: 20, value: 0 }, { maxExclusive: 20, value: 0 },
];

// Production store/thunks, with one strict tape spanning every random operation.
describe("Plan008 production integration", () => {
  it("completes forty quiet travels, alternates destinations, and creates one pending score", () => {
    const tape = quietTape(40);
    const store = createGameStore({ preloadedGame: state({ remainingTurns: 40, cash: 100, debt: 0 }), runtime: runtime(tape) });
    for (let i = 0; i < 40; i++) store.dispatch(travelTo((i % 2 ? 2 : 1) as 1 | 2));
    expect(store.getState().game).toMatchObject({ remainingTurns: 0, status: "won", endReason: "completed", finalWealth: 100, pendingScore: { wealth: 100 } });
    expect(store.getState().game.journal.filter(x => x.text.includes("四十天到了")).length).toBe(1);
    tape.assertConsumed();
  });

  it("accounts for a first-turn two-day hospital stay and compounded debt", () => {
    const entries = [...turn(40, { health: 0, hospital: [1, 0, 0], cash: false }), ...Array.from({ length: 37 }, (_, i) => turn(37 - i)).flat()];
    const tape = createRandomTape(entries);
    const store = createGameStore({ preloadedGame: state({ remainingTurns: 40, cash: 100, debt: 0, hitpoint: 86 }), runtime: runtime(tape) });
    store.dispatch(travelTo(1));
    let travels = 1;
    for (let i = 0; i < 37; i++) {
      store.dispatch(travelTo((i % 2 ? 1 : 2) as 1 | 2));
      travels++;
    }
    expect(travels).toBe(38);
    let debt = 2000; for (let i = 0; i < 37; i++) debt += Math.floor(debt / 10); // C++ debt-interest formula, with the hospital loan applied first.
    const game = store.getState().game;
    expect(game).toMatchObject({ remainingTurns: 0, status: "lost", hitpoint: 93, debt, finalWealth: 100 - debt });
    expect(game.journal.some(x => x.text.includes("住院 2 天"))).toBe(true);
    tape.assertConsumed();
  });

  it("resolves dense market, health, cash, phone, hacker, and beating events", () => {
    const tape = createRandomTape([...turn(10, { health: 0, hospital: [0, 0, 100], cash: true, hacker: true, market: Array.from({ length: 26 }, (_, i) => i === 8 || i === 25 ? 0 : 1) }), { maxExclusive: 20, value: 0 }, { maxExclusive: 20, value: 0 }]);
    const store = createGameStore({ preloadedGame: state({ remainingTurns: 10, debt: 100000, hitpoint: 50, cash: 1000, savings: 120000, hackerEnabled: true }), runtime: runtime(tape) });
    store.dispatch(travelTo(1));
    const game = store.getState().game;
    // Savings interest: 120,000 -> 121,200, then hacker adds 60,600 = 181,800.
    expect(game).toMatchObject({ debt: 113600, cash: 900, savings: 181800, hitpoint: 27, remainingTurns: 8 });
    const journal = game.journal.map((entry) => entry.text);
    const expectedInOrder = ["专家提议", "媒体报道", "俺被送进医院", "老太太", "黑客", "欠钱太多"];
    let previous = -1;
    for (const phrase of expectedInOrder) {
      const index = journal.findIndex((text, i) => i > previous && text.includes(phrase));
      expect(index, `missing ordered journal phrase: ${phrase}`).toBeGreaterThan(previous);
      previous = index;
    }
    tape.assertConsumed();
  });

  it("runs the hand-derived forty-day mixed C++ trace through settlement, Top 10, and reload", () => {
    const market = structuredClone(initialGameState.market).map((quote) => quote.id === 1 ? { ...quote, marketPrice: 100 } : quote);
    const tape = createRandomTape([
      { maxExclusive: 10, value: 4 },
      ...specialTurn(),
      ...Array.from({ length: 37 }, (_, i) => turn(37 - i)).flat(),
    ]);
    const store = createGameStore({
      preloadedGame: state({
        remainingTurns: 40, currentLocationSlot: null, cash: 100000, savings: 200000,
        debt: 0, hitpoint: 86, fame: 100, hackerEnabled: true, maxStorage: 100, highScores: structuredClone(DEFAULT_HIGH_SCORES), inventory: [], market,
      }),
      runtime: runtime(tape),
    });
    store.dispatch(buy({ itemId: 1, quantity: 2 }));
    store.dispatch(sell({ itemId: 1, quantity: 1 }));
    store.dispatch(deposit(10000));
    store.dispatch(withdraw(1000));
    store.dispatch(payDebt(0));
    store.dispatch(heal(1));
    store.dispatch(rentStorage());
    store.dispatch(visitInternetCafe());
    store.dispatch(travelTo(1));
    store.dispatch(payDebt(4500));
    let successfulTravels = 1;
    for (let i = 0; i < 37; i++) {
      store.dispatch(travelTo((i % 2 === 0 ? 2 : 1) as 1 | 2));
      successfulTravels += 1;
    }
    expect(successfulTravels).toBe(38);
    const settled = store.getState().game;
    // C++ trace: 209,000 + 1% = 211,090; savings loss = trunc(211,090/100)*85 = 179,350;
    // hacker adds 179,350/(2+0) = 89,675; then 37 daily 1% truncations reach 388,741.
    expect(settled).toMatchObject({
      remainingTurns: 0, status: "won", endReason: "completed", currentLocationSlot: 2,
      locationMode: "subway", cash: 37960, savings: 388741, debt: 0, hitpoint: 94,
      fame: 100, maxStorage: 110, internetCafeVisits: 1, hackerEnabled: true,
      deathObserved: false, finalWealth: 426701, inventory: [], pendingScore: {
        id: "integration-id", wealth: 426701, health: 94, fame: 100, fameLabel: "德高望重", completedAt: "2026-08-12T00:00:00.000Z",
      },
    });
    store.dispatch(submitScoreName("整局验收"));
    const expectedScores = [
      DEFAULT_HIGH_SCORES[0], DEFAULT_HIGH_SCORES[1], DEFAULT_HIGH_SCORES[2],
      { id: "integration-id", name: "整局验收", wealth: 426701, health: 94, fameLabel: "德高望重", completedAt: "2026-08-12T00:00:00.000Z" },
      ...DEFAULT_HIGH_SCORES.slice(3, 9),
    ];
    expect(store.getState().game.highScores).toEqual(expectedScores);
    expect(store.getState().game.highScores.map((entry) => entry.id)).toEqual([
      "default-1", "default-2", "default-3", "integration-id", "default-4", "default-5", "default-6", "default-7", "default-8", "default-9",
    ]);
    const saved = serializeGameState(store.getState().game);
    const reloaded = createGameStore({ preloadedGame: parseGameState(saved)!, runtime: runtime(createRandomTape([])) });
    expect(reloaded.getState().game).toEqual(store.getState().game);
    tape.assertConsumed();
  });

  it("runs the complete facility/action sequence against production reducers", () => {
    const tape = createRandomTape([{ maxExclusive: 10, value: 4 }]);
    const market = structuredClone(initialGameState.market).map(q => q.id === 1 ? { ...q, marketPrice: 100 } : q);
    const store = createGameStore({ preloadedGame: state({ market, cash: 100000, debt: 5000, hitpoint: 90 }), runtime: runtime(tape) });
    store.dispatch(buy({ itemId: 1, quantity: 2 })); store.dispatch(sell({ itemId: 1, quantity: 1 }));
    store.dispatch(deposit(10000)); store.dispatch(withdraw(1000)); store.dispatch(payDebt(1000)); store.dispatch(heal(2));
    store.dispatch(rentStorage()); store.dispatch(visitInternetCafe()); store.dispatch(toggleLocationMode());
    expect(store.getState().game).toMatchObject({ cash: 39455, savings: 9000, debt: 4000, hitpoint: 92, maxStorage: 110, internetCafeVisits: 1, locationMode: "surface", inventory: [{ id: 1, quantity: 1, averagePrice: 100 }] });
    tape.assertConsumed();
  });

  it("liquidates the final market and round-trips submitted persistence", () => {
            const tape = createRandomTape(turn(1, { market: [0, 0, 0, 0, 0, 0, 0, 0, ...Array.from({ length: 18 }, (_, i) => i === 3 ? 0 : 1)] }));
    const store = createGameStore({ preloadedGame: state({ remainingTurns: 1, cash: 100, debt: 0, inventory: [{ id: 1, name: "盗版VCD、游戏", averagePrice: 5, quantity: 2 }] }), runtime: runtime(tape) });
    store.dispatch(travelTo(1)); store.dispatch(submitScoreName("终局"));
    const game = store.getState().game;
    expect(game).toMatchObject({ status: "won", finalWealth: 140, cash: 140, inventory: [], highScores: [{ id: "integration-id", name: "终局", wealth: 140 }] });
    expect(parseGameState(serializeGameState(game))).toEqual(game); tape.assertConsumed();
  });

  it("manual exit does not liquidate, while ordinary observed death does", () => {
    const manualTape = createRandomTape([]);
    const manual = createGameStore({ preloadedGame: state({ cash: 100, debt: 0, hitpoint: -1, inventory: [{ id: 1, name: "盗版VCD、游戏", averagePrice: 5, quantity: 2 }] }), runtime: runtime(manualTape) });
    manual.dispatch(endEarly());
    manualTape.assertConsumed();
    expect(manual.getState().game).toMatchObject({ status: "won", endReason: "manual", finalWealth: 100, inventory: [{ quantity: 2 }] });
    const tape = createRandomTape(turn(2));
    const ordinary = createGameStore({ preloadedGame: state({ remainingTurns: 2, hitpoint: -1, cash: 100 }), runtime: runtime(tape) });
    ordinary.dispatch(travelTo(1));
    expect(ordinary.getState().game).toMatchObject({ status: "lost", endReason: "died", deathObserved: true, pendingScore: null }); tape.assertConsumed();
  });
});
