import {
  CASH_EVENTS,
  HEALTH_EVENTS,
  MARKET_EVENT_DEFINITIONS,
} from "./data/events";
import type { GameRuntime } from "./runtime";
import type { InventoryEntry, ItemId } from "./types";
import { ITEM_BY_ID } from "./data/items";
import {
  saturatingAdd,
  saturatingMultiply,
  saturatingSubtract,
} from "./numbers";

type Random = Pick<GameRuntime, "nextInt">;
export interface EventState {
  prices: Record<ItemId, number>;
  inventory: InventoryEntry[];
  capacity: number;
  debt: number;
  cash: number;
  savings: number;
}

export interface EventLog {
  index: number;
  description: string;
  kind: string;
  itemId?: ItemId;
  value?: number;
  target?: "cash" | "savings";
  amount?: number;
}

export interface CashResolution {
  cashEvent?: EventLog;
  hackerEvents: EventLog[];
  logs: EventLog[];
}

const inv = (state: EventState, id: ItemId) =>
  state.inventory.find((entry) => entry.id === id);

const used = (state: EventState) =>
  state.inventory.reduce(
    (total, entry) => saturatingAdd(total, entry.quantity),
    0,
  );

export function resolveMarketEvents(
  state: EventState,
  random: Random,
): EventLog[] {
  const logs: EventLog[] = [];
  for (let index = 0; index < MARKET_EVENT_DEFINITIONS.length; index++) {
    const event = MARKET_EVENT_DEFINITIONS[index];
    if (random.nextInt(950) % event.frequency !== 0) continue;
    const effect = event.effect;
    if (state.prices[effect.itemId] === 0) continue;
    if (effect.kind === "multiply" || effect.kind === "divide") {
      const oldPrice = state.prices[effect.itemId];
      state.prices[effect.itemId] = effect.kind === "multiply"
        ? saturatingMultiply(oldPrice, effect.value)
        : Math.trunc(oldPrice / effect.value);
      logs.push({
        index,
        description: event.description,
        kind: effect.kind,
        itemId: effect.itemId,
        value: effect.value,
      });
      continue;
    }
    if (effect.debtIncrease) {
      state.debt = saturatingAdd(state.debt, effect.debtIncrease);
    }

    const log: EventLog = {
      index,
      description: event.description,
      kind: effect.kind,
      itemId: effect.itemId,
      value: effect.quantity,
      amount: effect.quantity,
    };
    logs.push(log);

    const remaining = Math.max(0, state.capacity - used(state));
    if (remaining === 0) return logs;

    const quantity = Math.min(effect.quantity, remaining);
    const owned = inv(state, effect.itemId);
    if (owned) {
      owned.quantity = saturatingAdd(owned.quantity, quantity);
    } else {
      state.inventory.push({
        id: effect.itemId,
        name: ITEM_BY_ID.get(effect.itemId)?.name ?? "",
        averagePrice: 0,
        quantity,
      });
    }
  }
  return logs;
}

export function resolveHealthEvent(
  random: Random,
): { loss: number; index: number; description: string } | undefined {
  for (let index = 0; index < HEALTH_EVENTS.length; index++) {
    const event = HEALTH_EVENTS[index];
    if (random.nextInt(1000) % event.frequency === 0) {
      return { loss: event.loss, index, description: event.description };
    }
  }
  return undefined;
}

export function resolveCashEvent(
  state: EventState,
  random: Random,
  hackerEnabled = false,
): CashResolution {
  let cashEvent: EventLog | undefined;
  const logs: EventLog[] = [];
  for (let index = 0; index < CASH_EVENTS.length; index++) {
    const event = CASH_EVENTS[index];
    if (random.nextInt(1000) % event.frequency !== 0) continue;
    const balance = event.target === "cash" ? state.cash : state.savings;
    if (event.target === "cash" || balance > 0) {
      const after = Math.trunc(balance / 100) * (100 - event.lossPercent);
      if (event.target === "cash") state.cash = after;
      else state.savings = after;
      cashEvent = {
        index,
        description: event.description,
        kind: event.target,
        target: event.target,
        value: event.lossPercent,
        amount: after,
      };
      logs.push(cashEvent);
    }
    break;
  }
  const hackerEvents: EventLog[] = [];
  const gate = random.nextInt(1000);
  if (hackerEnabled && gate % 25 === 0 && state.savings >= 1000) {
    if (state.savings > 100000) {
      const amount = Math.trunc(state.savings / (2 + random.nextInt(20)));
      const increase = random.nextInt(20) % 3 === 0;
      if (increase) {
        state.savings = saturatingAdd(state.savings, amount);
      } else {
        state.savings = saturatingSubtract(state.savings, amount);
      }
      hackerEvents.push({
        index: -1,
        description: increase
          ? "黑客入侵银行网络，疯狂修改数据库，我的存款增加了"
          : "黑客入侵银行网络，疯狂修改数据库，我的存款减少了",
        kind: "hacker",
        target: "savings",
        amount,
      });
    } else {
      const amount = Math.trunc(state.savings / (1 + random.nextInt(15)));
      state.savings = saturatingAdd(state.savings, amount);
      hackerEvents.push({
        index: -1,
        description: "黑客入侵银行网络，疯狂修改数据库，我的存款增加了",
        kind: "hacker",
        target: "savings",
        amount,
      });
    }
    logs.push(...hackerEvents);
  }
  return { cashEvent, hackerEvents, logs };
}
