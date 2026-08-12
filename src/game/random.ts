import {
  CASH_EVENTS,
  FREE_ITEM_EVENTS,
  HEALTH_EVENTS,
  MARKET_EVENTS,
} from './data/events';
import { ITEMS } from './data/items';
import type { GameRuntime } from './runtime';
import type { ItemDefinition, MarketQuote, TravelRoll } from './types';

export type NextInt = GameRuntime['nextInt'];
type RandomSource = Pick<GameRuntime, 'nextInt'> | NextInt;

const nextIntFrom = (random: RandomSource, maxExclusive: number): number =>
  typeof random === 'function'
    ? random(maxExclusive)
    : random.nextInt(maxExclusive);

export function randomInt(maxExclusive: number, random: RandomSource): number {
  return nextIntFrom(random, maxExclusive);
}

export function pick<T>(values: readonly T[], random: RandomSource): T {
  const value = values[randomInt(values.length, random)];
  if (value === undefined) {
    throw new Error('不能从空数组中随机取值');
  }
  return value;
}

export function createMarket(
  soldOutCount: number,
  random: RandomSource,
): MarketQuote[] {
  const prices: Record<number, number> = {};
  const order: ItemDefinition[] = [ITEMS[1], ITEMS[7], ITEMS[0], ITEMS[4], ITEMS[6], ITEMS[3], ITEMS[5], ITEMS[2]];
  for (const item of order) prices[item.id] = item.basePrice + randomInt(item.extraPrice, random);
  const cxxToTs: readonly number[] = [2, 8, 1, 5, 7, 4, 6, 3];
  for (let i = 0; i < soldOutCount; i++) prices[cxxToTs[randomInt(8, random)]] = 0;
  return ITEMS.map((item) => ({ id: item.id, name: item.name, marketPrice: prices[item.id] }));
}

export function createTravelRoll(
  destinationId: TravelRoll['destinationId'],
  currentDay: number,
  totalDays: number,
  random: RandomSource,
): TravelRoll {
  const finalDayIncoming = currentDay >= totalDays - 2;
  const market = createMarket(finalDayIncoming ? 0 : 3, random);
  // Keep the legacy travel payload until Plan 003 wires the full resolver into travel.
  const availableMarketEvents = MARKET_EVENTS.filter((event) =>
    market.some((quote) => quote.id === event.relatedItem && quote.marketPrice > 0),
  );
  const marketEvent = pick(availableMarketEvents, random);
  const cashEvent = pick(CASH_EVENTS, random);
  const candidateHealthEvent = pick(HEALTH_EVENTS, random);
  const healthEvent = randomInt(1000, random) % candidateHealthEvent.frequency === 0
    ? candidateHealthEvent
    : undefined;
  const freeItemEvent = randomInt(100, random) < 12
    ? pick(FREE_ITEM_EVENTS, random)
    : undefined;

  return {
    destinationId,
    market,
    marketEvent,
    cashEvent,
    healthEvent,
    freeItemEvent,
  };
}
