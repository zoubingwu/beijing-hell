import { CASH_EVENTS, FREE_ITEM_EVENTS, HEALTH_EVENTS, MARKET_EVENTS } from './data/events';
import { ITEMS } from './data/items';
import type { ItemDefinition, MarketQuote, TravelRoll } from './types';

export type RandomSource = () => number;

export function randomInt(maxExclusive: number, random: RandomSource = Math.random): number {
  return Math.floor(random() * maxExclusive);
}

export function pick<T>(values: readonly T[], random: RandomSource = Math.random): T {
  const value = values[randomInt(values.length, random)];
  if (value === undefined) {
    throw new Error('不能从空数组中随机取值');
  }
  return value;
}

function chooseDistinctItems(
  values: readonly ItemDefinition[],
  count: number,
  random: RandomSource,
): Set<number> {
  const pool = [...values];
  const selected = new Set<number>();
  while (selected.size < count && pool.length > 0) {
    const index = randomInt(pool.length, random);
    const [item] = pool.splice(index, 1);
    if (item) selected.add(item.id);
  }
  return selected;
}

export function createMarket(
  soldOutCount: number,
  random: RandomSource = Math.random,
): MarketQuote[] {
  const soldOut = chooseDistinctItems(ITEMS, soldOutCount, random);
  return ITEMS.map((item) => ({
    id: item.id,
    name: item.name,
    marketPrice: soldOut.has(item.id)
      ? 0
      : item.basePrice + randomInt(item.extraPrice, random),
  }));
}

export function createTravelRoll(
  destinationId: TravelRoll['destinationId'],
  currentDay: number,
  totalDays: number,
  random: RandomSource = Math.random,
): TravelRoll {
  const finalDayIncoming = currentDay >= totalDays - 2;
  const market = createMarket(finalDayIncoming ? 0 : 3, random);
  const availableItemIds = new Set(
    market.filter((quote) => quote.marketPrice > 0).map((quote) => quote.id),
  );
  const effectiveMarketEvents = MARKET_EVENTS.filter((event) =>
    availableItemIds.has(event.relatedItem),
  );
  const marketEvent = pick(effectiveMarketEvents, random);
  const cashEvent = pick(CASH_EVENTS, random);
  const candidateHealthEvent = pick(HEALTH_EVENTS, random);
  const healthEvent = randomInt(1000, random) % candidateHealthEvent.frequency === 0
    ? candidateHealthEvent
    : undefined;
  const freeItemEvent = random() < 0.12 ? pick(FREE_ITEM_EVENTS, random) : undefined;

  return {
    destinationId,
    market,
    marketEvent,
    cashEvent,
    healthEvent,
    freeItemEvent,
  };
}
