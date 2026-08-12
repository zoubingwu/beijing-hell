import { createMarket } from './random';
import {
  resolveCashEvent,
  resolveHealthEvent,
  resolveMarketEvents,
  type EventState,
} from './eventResolver';
import type { GameRuntime } from './runtime';
import type { GameState, LocationSlot, JournalTone } from './types';

export interface TurnLogDraft {
  text: string;
  tone?: JournalTone;
}

export interface TravelResolution {
  state: GameState;
  logs: TurnLogDraft[];
  outcome: 'continue' | 'died' | 'completed';
  eventDay: number;
}

/** Pure one-day turn resolver. Runtime is used only for injected randomness. */
export function resolveTravel(
  input: GameState,
  destinationSlot: LocationSlot,
  runtime: Pick<GameRuntime, 'nextInt'>,
): TravelResolution {
  const state: GameState = structuredClone(input);
  const logs: TurnLogDraft[] = [];
  const eventDay = Math.min(40, state.totalDays - state.remainingTurns + 1);
  state.currentLocationSlot = destinationSlot;
  const leaveout = state.remainingTurns <= 2 ? 0 : 3;
  state.market = createMarket(leaveout, runtime);
  if (state.debt > 0) state.debt += Math.floor(state.debt * 0.1);
  state.savings += Math.floor(state.savings * 0.01);

  const prices = Object.fromEntries(
    state.market.map((q) => [q.id, q.marketPrice]),
  ) as EventState['prices'];
  let eventState: EventState = {
    prices,
    inventory: state.inventory,
    capacity: state.maxStorage,
    debt: state.debt,
    cash: state.cash,
    savings: state.savings,
  };
  for (const event of resolveMarketEvents(eventState, runtime)) {
    logs.push({ text: event.description, tone: 'warning' });
  }
  state.market = state.market.map((q) => ({ ...q, marketPrice: prices[q.id] }));
  state.inventory = eventState.inventory;
  state.debt = eventState.debt;

  const healthEvent = resolveHealthEvent(runtime);
  if (healthEvent) {
    state.hitpoint -= healthEvent.loss;
    logs.push({ text: healthEvent.description, tone: 'bad' });
  }
  if (state.hitpoint < 85 && state.remainingTurns > 3) {
    const delay = 1 + runtime.nextInt(2);
    runtime.nextInt(29);
    const loan = delay * (1000 + runtime.nextInt(8500));
    state.debt += loan;
    state.hitpoint = Math.min(100, state.hitpoint + 10);
    state.remainingTurns -= delay;
    logs.push({
      text: `俺被送进医院，欠款增加 ${loan} 元，住院 ${delay} 天，健康恢复到 ${state.hitpoint}。`,
      tone: 'bad',
    });
  } else if (state.hitpoint < 0) {
    // The final day settles the game even when an event leaves health below
    // zero; death only interrupts a game that still has another day to play.
    state.deathObserved = true;
    logs.push({
      text: '俺倒在街头，日记本上写着：“北京，我将再来！”',
      tone: 'bad',
    });
  }
  if (state.hitpoint > 0 && state.hitpoint < 20) {
    logs.push({
      text: `俺的健康只剩 ${state.hitpoint} 点，小心别倒下！`,
      tone: 'warning',
    });
  }

  eventState = {
    prices,
    inventory: state.inventory,
    capacity: state.maxStorage,
    debt: state.debt,
    cash: state.cash,
    savings: state.savings,
  };
  const cash = resolveCashEvent(eventState, runtime, state.hackerEnabled);
  state.cash = eventState.cash;
  state.savings = eventState.savings;
  state.debt = eventState.debt;
  for (const event of cash.logs) {
    const tone: JournalTone =
      event.kind === 'hacker'
        ? event.description.includes('增加')
          ? 'good'
          : 'bad'
        : 'bad';
    logs.push({ text: event.description, tone });
  }
  if (state.debt > 100000) {
    state.hitpoint -= 30;
    logs.push({
      text: '俺欠钱太多，村长叫一群老乡揍了俺一顿！（损失30点健康）',
      tone: 'bad',
    });
  }
  state.remainingTurns -= 1;
  if (state.remainingTurns === 1)
    logs.push({
      text: '俺明天就要回乡了，快把全部货物卖掉！',
      tone: 'warning',
    });
  const outcome =
    state.remainingTurns === 0
      ? 'completed'
      : state.deathObserved
        ? 'died'
        : 'continue';
  return { state, logs, outcome, eventDay };
}
