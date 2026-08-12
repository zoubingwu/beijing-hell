import { ITEMS } from './data/items';
import { LOCATIONS } from './data/locations';
import type {
  GameState,
  HighScore,
  InventoryEntry,
  JournalEntry,
  MarketQuote,
} from './types';

// Preserve v1-v3 keys for future migrations; Plan005 writes schema 4.
export const STORAGE_KEY = 'beijing-hell:save:v4';
const ITEM_IDS = new Set<number>(ITEMS.map((item) => item.id));
const LOCATION_IDS = new Set<number>(LOCATIONS.map((location) => location.slot));
const JOURNAL_TONES = new Set(['info', 'good', 'bad', 'warning']);
const GAME_STATUSES = new Set(['playing', 'won', 'lost']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isIntegerInRange = (
  value: unknown,
  minimum: number,
  maximum: number,
): value is number =>
  Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;

const isMarketQuote = (value: unknown): value is MarketQuote =>
  isRecord(value) &&
  isIntegerInRange(value.id, 1, 8) &&
  ITEM_IDS.has(value.id) &&
  typeof value.name === 'string' &&
  isIntegerInRange(value.marketPrice, 0, Number.MAX_SAFE_INTEGER);

const isInventoryEntry = (value: unknown): value is InventoryEntry =>
  isRecord(value) &&
  isIntegerInRange(value.id, 1, 8) &&
  ITEM_IDS.has(value.id) &&
  typeof value.name === 'string' &&
  isIntegerInRange(value.averagePrice, 0, Number.MAX_SAFE_INTEGER) &&
  isIntegerInRange(value.quantity, 1, Number.MAX_SAFE_INTEGER);

const isJournalEntry = (value: unknown): value is JournalEntry =>
  isRecord(value) &&
  isIntegerInRange(value.id, 1, Number.MAX_SAFE_INTEGER) &&
  isIntegerInRange(value.day, 1, 40) &&
  typeof value.text === 'string' &&
  value.text.length > 0 &&
  typeof value.tone === 'string' &&
  JOURNAL_TONES.has(value.tone);

const isHighScore = (value: unknown): value is HighScore =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  value.id.length > 0 &&
  isFiniteNumber(value.wealth) &&
  value.wealth > 0 &&
  typeof value.completedAt === 'string' &&
  Number.isFinite(Date.parse(value.completedAt));

function hasUniqueIds(values: readonly { id: number }[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length;
}

function isGameState4(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  if (
    value.schemaVersion !== 4 ||
    value.totalDays !== 40 ||
    !isIntegerInRange(value.remainingTurns, 0, 40) ||
    !(value.currentLocationSlot === null || (isIntegerInRange(value.currentLocationSlot, 1, 10) && LOCATION_IDS.has(value.currentLocationSlot))) ||
    !(value.locationMode === 'subway' || value.locationMode === 'surface') ||
    !isIntegerInRange(value.cash, 0, Number.MAX_SAFE_INTEGER) ||
    !isIntegerInRange(value.savings, 0, Number.MAX_SAFE_INTEGER) ||
    !isIntegerInRange(value.debt, 0, Number.MAX_SAFE_INTEGER) ||
    !isFiniteNumber(value.hitpoint) ||
    typeof value.hackerEnabled !== 'boolean' ||
    typeof value.deathObserved !== 'boolean' ||
    !(value.endReason === null || value.endReason === 'completed' || value.endReason === 'died' || value.endReason === 'manual') ||
    !isIntegerInRange(value.fame, 0, 100) ||
    !isIntegerInRange(value.maxStorage, 100, Number.MAX_SAFE_INTEGER) ||
    typeof value.status !== 'string' ||
    !GAME_STATUSES.has(value.status) ||
    !(value.finalWealth === null || isFiniteNumber(value.finalWealth)) ||
    !isIntegerInRange(value.nextJournalId, 1, Number.MAX_SAFE_INTEGER) ||
    !isIntegerInRange(value.internetCafeVisits, 0, 3) ||
    !Array.isArray(value.market) ||
    !Array.isArray(value.inventory) ||
    !Array.isArray(value.journal) ||
    !Array.isArray(value.highScores)
  ) {
    return false;
  }

  if (
    value.market.length !== ITEMS.length ||
    !value.market.every(isMarketQuote) ||
    !hasUniqueIds(value.market) ||
    !value.inventory.every(isInventoryEntry) ||
    !hasUniqueIds(value.inventory) ||
    !value.journal.every(isJournalEntry) ||
    value.highScores.length > 10 ||
    !value.highScores.every(isHighScore)
  ) {
    return false;
  }

  const usedStorage = value.inventory.reduce(
    (total: number, item: InventoryEntry) => total + item.quantity,
    0,
  );
  const largestJournalId = value.journal.reduce(
    (largest: number, entry: JournalEntry) => Math.max(largest, entry.id),
    0,
  );
  return usedStorage <= value.maxStorage && value.nextJournalId > largestJournalId;
}

export function parseGameState(raw: string): GameState | null {
  try {
    const value: unknown = JSON.parse(raw);
    return isGameState4(value) ? value : null;
  } catch {
    return null;
  }
}

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

export function loadGameState(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseGameState(raw) : null;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeGameState(state));
  } catch {
    // 存储空间不可用时，游戏仍可在当前页面继续。
  }
}

export function clearGameState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
