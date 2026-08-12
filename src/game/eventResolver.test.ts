import { describe, expect, it } from "vitest";
import {
  type EventState,
  resolveCashEvent,
  resolveHealthEvent,
  resolveMarketEvents,
} from "./eventResolver";
import { createRandomTape } from "./test/randomTape";

const state = (): EventState => ({
  prices: Object.fromEntries(
    Array.from({ length: 8 }, (_, index) => [index + 1, 100]),
  ) as EventState["prices"],
  inventory: [],
  capacity: 10,
  debt: 0,
  cash: 2099,
  savings: 0,
});

const allMiss = (count: number, maxExclusive = 950) =>
  Array.from({ length: count }, () => ({ maxExclusive, value: 1 }));

const eventTape = (values: number[]) =>
  createRandomTape(
    values.map((value) => ({ maxExclusive: 950, value })),
  );

describe("event resolver parity", () => {
  it("applies same-item events in log order", () => {
    const current = state();
    current.prices[5] = 100;
    const tape = createRandomTape([
      { maxExclusive: 950, value: 1 },
      { maxExclusive: 950, value: 0 },
      ...allMiss(6),
      { maxExclusive: 950, value: 0 },
      ...allMiss(9),
    ]);
    expect(resolveMarketEvents(current, tape).map((log) => log.index)).toEqual([
      1,
      8,
    ]);
    expect(current.prices[5]).toBe(2100);
    tape.assertConsumed();
  });

  it("logs a sold-out gate hit without applying its effect", () => {
    const current = state();
    current.prices[4] = 0;
    const tape = createRandomTape([
      { maxExclusive: 950, value: 0 },
      ...allMiss(13),
      { maxExclusive: 950, value: 0 },
      ...allMiss(3),
    ]);
    const logs = resolveMarketEvents(current, tape);
    expect(logs.map((log) => log.index)).toEqual([14]);
    expect(current.inventory).toHaveLength(1);
    tape.assertConsumed();
  });

  it("logs a full-room gift before returning, including phone debt", () => {
    const current = state();
    current.capacity = 0;
    const tape = eventTape(
      Array.from({ length: 18 }, (_, index) => index === 17 ? 0 : 1),
    );
    const logs = resolveMarketEvents(current, tape);
    expect(logs.map((log) => log.index)).toEqual([17]);
    expect(current.debt).toBe(2500);
    tape.assertConsumed();
  });

  it("logs a partial gift, then logs the later hit before returning", () => {
    const current = state();
    current.capacity = 1;
    const tape = createRandomTape([
      ...allMiss(14),
      { maxExclusive: 950, value: 0 },
      { maxExclusive: 950, value: 0 },
    ]);
    const logs = resolveMarketEvents(current, tape);
    expect(logs.map((log) => log.index)).toEqual([14, 15]);
    expect(current.inventory[0]?.quantity).toBe(1);
    tape.assertConsumed();
  });

  it("preserves average price and creates gifts with exact name, average price, and quantity", () => {
    const current = state();
    current.inventory = [{
      id: 8,
      name: "走私汽车",
      averagePrice: 1234,
      quantity: 1,
    }];
    const tape = eventTape([...Array(14).fill(1), 0, 1, 1, 1]);
    resolveMarketEvents(current, tape);
    expect(current.inventory[0]).toMatchObject({
      name: "走私汽车",
      averagePrice: 1234,
      quantity: 3,
    });
    tape.assertConsumed();

    const fresh = state();
    const freshTape = eventTape([...Array(16).fill(1), 0, 1]);
    resolveMarketEvents(fresh, freshTape);
    expect(fresh.inventory[0]).toMatchObject({
      id: 5,
      name: "假白酒(剧毒！)",
      averagePrice: 0,
      quantity: 4,
    });
    freshTape.assertConsumed();
  });

  it("resolves health first hit, later hit, and no hit", () => {
    const first = createRandomTape([{ maxExclusive: 1000, value: 0 }]);
    expect(resolveHealthEvent(first)?.index).toBe(0);
    first.assertConsumed();

    const second = createRandomTape([
      { maxExclusive: 1000, value: 1 },
      { maxExclusive: 1000, value: 0 },
    ]);
    expect(resolveHealthEvent(second)?.index).toBe(1);
    second.assertConsumed();

    const none = createRandomTape(allMiss(12, 1000));
    expect(resolveHealthEvent(none)).toBeUndefined();
    none.assertConsumed();
  });

  it("resolves cash and savings with accurate target logs", () => {
    const cash = state();
    const cashTape = createRandomTape([
      { maxExclusive: 1000, value: 0 },
      { maxExclusive: 1000, value: 1 },
    ]);
    expect(resolveCashEvent(cash, cashTape).cashEvent).toMatchObject({
      kind: "cash",
      target: "cash",
      amount: 1800,
    });
    cashTape.assertConsumed();

    const savings = state();
    savings.cash = 0;
    savings.savings = 2099;
    const savingsTape = createRandomTape([
      ...allMiss(4, 1000),
      { maxExclusive: 1000, value: 0 },
      { maxExclusive: 1000, value: 1 },
    ]);
    expect(resolveCashEvent(savings, savingsTape).cashEvent).toMatchObject({
      kind: "savings",
      target: "savings",
      amount: 1700,
    });
    savingsTape.assertConsumed();
  });

  it("breaks after a zero-savings event and only consumes the hacker gate", () => {
    const current = state();
    current.cash = 0;
    const tape = createRandomTape([
      ...allMiss(4, 1000),
      { maxExclusive: 1000, value: 0 },
      { maxExclusive: 1000, value: 0 },
    ]);
    const result = resolveCashEvent(current, tape, true);
    expect(result.cashEvent).toBeUndefined();
    expect(result.hackerEvents).toHaveLength(0);
    tape.assertConsumed();
  });

  it("adds the exact medium-bank hacker amount", () => {
    const current = state();
    current.savings = 10000;
    const tape = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 0 },
      { maxExclusive: 15, value: 0 },
    ]);
    const result = resolveCashEvent(current, tape, true);
    expect(current.savings).toBe(20000);
    expect(result.hackerEvents).toHaveLength(1);
    expect(result.hackerEvents[0]).toMatchObject({ amount: 10000 });
    tape.assertConsumed();
  });

  it("uses the corrected high-bank hacker direction and exact amounts", () => {
    const increase = state();
    increase.savings = 200000;
    const increaseTape = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 0 },
      { maxExclusive: 20, value: 0 },
      { maxExclusive: 20, value: 0 },
    ]);
    resolveCashEvent(increase, increaseTape, true);
    expect(increase.savings).toBe(300000);
    increaseTape.assertConsumed();

    const decrease = state();
    decrease.savings = 200000;
    const decreaseTape = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 0 },
      { maxExclusive: 20, value: 0 },
      { maxExclusive: 20, value: 1 },
    ]);
    resolveCashEvent(decrease, decreaseTape, true);
    expect(decrease.savings).toBe(100000);
    decreaseTape.assertConsumed();
  });

  it("logs no cash event after all cash misses and consumes hacker gate", () => {
    const missed = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 1 },
    ]);
    const result = resolveCashEvent(state(), missed, true);
    expect(result.cashEvent).toBeUndefined();
    expect(result.logs).toEqual([]);
    missed.assertConsumed();

    const disabled = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 1 },
    ]);
    const disabledResult = resolveCashEvent(state(), disabled, false);
    expect(disabledResult.cashEvent).toBeUndefined();
    expect(disabledResult.logs).toEqual([]);
    disabled.assertConsumed();
  });

  it("consumes only the hacker gate when disabled or below threshold", () => {
    const tape = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 0 },
    ]);
    resolveCashEvent(state(), tape, false);
    tape.assertConsumed();

    const low = state();
    low.savings = 500;
    const lowTape = createRandomTape([
      ...allMiss(7, 1000),
      { maxExclusive: 1000, value: 0 },
    ]);
    resolveCashEvent(low, lowTape, true);
    lowTape.assertConsumed();
  });
});
