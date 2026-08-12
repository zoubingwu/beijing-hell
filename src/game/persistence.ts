import { DEFAULT_HIGH_SCORES } from "./data/highScores";
import { ITEM_BY_ID, ITEMS } from "./data/items";
import { LOCATIONS } from "./data/locations";
import {
  isDomainInteger,
  saturatingAdd,
  saturatingWealth,
} from "./numbers";
import { fameLabel, qualifyScore } from "./scoring";
import type {
  GameState,
  HighScore,
  InventoryEntry,
  JournalEntry,
  MarketQuote,
  PendingScore,
} from "./types";

export const STORAGE_KEY = "beijing-hell:save:v6";
export const legacyKeys = [
  "beijing-hell:save:v1",
  "beijing-hell:save:v2",
  "beijing-hell:save:v3",
  "beijing-hell:save:v4",
  "beijing-hell:save:v5",
] as const;

const ITEM_IDS = new Set(ITEMS.map((item) => item.id));
const LOCATION_IDS = new Set(LOCATIONS.map((location) => location.slot));
const JOURNAL_TONES = new Set(["info", "good", "bad", "warning"]);
const FAME_LABELS = new Set([
  "德高望重",
  "杰出青年",
  "一般般",
  "不佳",
  "争议人物",
  "差",
  "很差",
  "江湖唾弃",
]);
const STORAGE_CAPACITIES = new Set([100, 110, 120, 130, 140]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isSafeInteger = (value: unknown): value is number =>
  isDomainInteger(value);

const isParsedDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const hasUniqueIds = (
  values: readonly { id: number | string }[],
): boolean => new Set(values.map((value) => value.id)).size === values.length;

const hasCanonicalItem = (value: Record<string, unknown>): boolean => {
  if (!isSafeInteger(value.id) || !ITEM_IDS.has(value.id as never)) return false;
  return value.name === ITEM_BY_ID.get(value.id as never)?.name;
};

const isMarketQuote = (value: unknown): value is MarketQuote =>
  isRecord(value) &&
  hasCanonicalItem(value) &&
  isSafeInteger(value.marketPrice) &&
  value.marketPrice >= 0;

const isInventoryEntry = (value: unknown): value is InventoryEntry =>
  isRecord(value) &&
  hasCanonicalItem(value) &&
  isSafeInteger(value.averagePrice) &&
  value.averagePrice >= 0 &&
  isSafeInteger(value.quantity) &&
  value.quantity > 0;

const isJournalEntry = (value: unknown): value is JournalEntry =>
  isRecord(value) &&
  isSafeInteger(value.id) &&
  value.id > 0 &&
  isSafeInteger(value.day) &&
  value.day >= 1 &&
  value.day <= 40 &&
  typeof value.text === "string" &&
  value.text.length > 0 &&
  typeof value.tone === "string" &&
  JOURNAL_TONES.has(value.tone);

const hasValidHealth = (value: unknown): value is number =>
  isSafeInteger(value) && value <= 100;

const isHighScore = (value: unknown): value is HighScore =>
  isRecord(value) &&
  typeof value.id === "string" &&
  value.id.length > 0 &&
  typeof value.name === "string" &&
  isSafeInteger(value.wealth) &&
  value.wealth > 0 &&
  hasValidHealth(value.health) &&
  typeof value.fameLabel === "string" &&
  FAME_LABELS.has(value.fameLabel) &&
  (value.completedAt === undefined || isParsedDate(value.completedAt));

const isPendingScore = (value: unknown): value is PendingScore =>
  isRecord(value) &&
  typeof value.id === "string" &&
  value.id.length > 0 &&
  isSafeInteger(value.wealth) &&
  value.wealth > 0 &&
  hasValidHealth(value.health) &&
  isSafeInteger(value.fame) &&
  value.fame >= 0 &&
  value.fame <= 100 &&
  typeof value.fameLabel === "string" &&
  FAME_LABELS.has(value.fameLabel) &&
  isParsedDate(value.completedAt);

export function isValidHighScores(value: unknown): value is HighScore[] {
  return (
    Array.isArray(value) &&
    value.length <= 10 &&
    value.every(isHighScore) &&
    hasUniqueIds(value) &&
    value.every(
      (score, index) => index === 0 || value[index - 1].wealth >= score.wealth,
    )
  );
}

function isValidActiveGameCore(value: unknown): value is GameState {
  if (!isRecord(value) || value.schemaVersion !== 6 || value.totalDays !== 40) {
    return false;
  }
  if (
    !isSafeInteger(value.remainingTurns) ||
    value.remainingTurns < 0 ||
    value.remainingTurns > 40
  ) {
    return false;
  }
  if (
    !(
      value.currentLocationSlot === null ||
      (isSafeInteger(value.currentLocationSlot) &&
        LOCATION_IDS.has(value.currentLocationSlot as never))
    )
  ) {
    return false;
  }
  if (value.locationMode !== "subway" && value.locationMode !== "surface") {
    return false;
  }
  if (
    ![value.cash, value.savings, value.debt].every(
      (balance) => isSafeInteger(balance) && balance >= 0,
    ) ||
    !hasValidHealth(value.hitpoint) ||
    !isSafeInteger(value.fame) ||
    value.fame < 0 ||
    value.fame > 100 ||
    !isSafeInteger(value.maxStorage) ||
    !STORAGE_CAPACITIES.has(value.maxStorage)
  ) {
    return false;
  }
  if (
    typeof value.hackerEnabled !== "boolean" ||
    typeof value.deathObserved !== "boolean" ||
    (value.deathObserved && value.hitpoint >= 0) ||
    !(
      value.endReason === null ||
      value.endReason === "completed" ||
      value.endReason === "died" ||
      value.endReason === "manual"
    ) ||
    !(
      value.status === "playing" ||
      value.status === "won" ||
      value.status === "lost"
    ) ||
    !(value.finalWealth === null || isSafeInteger(value.finalWealth))
  ) {
    return false;
  }
  if (
    !isSafeInteger(value.nextJournalId) ||
    value.nextJournalId <= 0 ||
    !isSafeInteger(value.internetCafeVisits) ||
    value.internetCafeVisits < 0 ||
    value.internetCafeVisits > 3 ||
    !Array.isArray(value.market) ||
    !Array.isArray(value.inventory) ||
    !Array.isArray(value.journal) ||
    !Array.isArray(value.highScores) ||
    !isValidHighScores(value.highScores) ||
    !(value.pendingScore === null || isPendingScore(value.pendingScore))
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
    !hasUniqueIds(value.journal)
  ) {
    return false;
  }

  const usedStorage = value.inventory.reduce(
    (total, entry) => saturatingAdd(total, entry.quantity),
    0,
  );
  const largestJournalId = value.journal.reduce(
    (largest, entry) => Math.max(largest, entry.id),
    0,
  );
  if (
    usedStorage > value.maxStorage ||
    value.nextJournalId <= largestJournalId
  ) {
    return false;
  }

  if (value.status === "playing") {
    return (
      value.remainingTurns > 0 &&
      value.endReason === null &&
      value.finalWealth === null &&
      value.pendingScore === null &&
      !value.deathObserved
    );
  }

  if (
    value.endReason === null ||
    value.finalWealth === null ||
    value.finalWealth !==
      saturatingWealth(
        value.cash as number,
        value.savings as number,
        value.debt as number,
      )
  ) {
    return false;
  }

  if (value.endReason === "completed") {
    if (
      value.remainingTurns !== 0 ||
      value.status !== (value.finalWealth > 0 ? "won" : "lost")
    ) {
      return false;
    }
  } else if (value.endReason === "manual") {
    if (
      value.remainingTurns < 1 ||
      value.remainingTurns > 40 ||
      value.deathObserved ||
      value.status !== (value.finalWealth > 0 ? "won" : "lost")
    ) {
      return false;
    }
  } else if (
    value.remainingTurns <= 0 ||
    !value.deathObserved ||
    value.status !== "lost" ||
    value.pendingScore !== null
  ) {
    return false;
  }

  if (value.pendingScore !== null) {
    const pending = value.pendingScore;
    if (
      (value.endReason !== "completed" && value.endReason !== "manual") ||
      value.status !== "won" ||
      pending.wealth !== value.finalWealth ||
      pending.health !== value.hitpoint ||
      pending.fame !== value.fame ||
      pending.fameLabel !== fameLabel(value.fame)
    ) {
      return false;
    }
    if (
      value.highScores.some((score) => score.id === pending.id) ||
      !qualifyScore(pending.wealth, value.highScores)
    ) {
      return false;
    }
  }

  return true;
}

/** Validates a complete in-memory game, including its embedded rankings. */
export function isValidActiveGame(value: unknown): value is GameState {
  return isValidActiveGameCore(value);
}

export interface PersistedData {
  activeGame: GameState | null;
  highScores: HighScore[];
}

export interface RuntimeBootstrap {
  createNewGame: (highScores: HighScore[]) => GameState;
}

export function createInitialGameState(
  persisted: PersistedData | null,
  runtime: RuntimeBootstrap,
): GameState {
  if (persisted?.activeGame) return persisted.activeGame;
  const highScores = persisted
    ? structuredClone(persisted.highScores)
    : structuredClone(DEFAULT_HIGH_SCORES);
  return runtime.createNewGame(highScores);
}

export function parsePersistedState(raw: string): PersistedData | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== 6) return null;

    const highScores: HighScore[] = isValidHighScores(value.highScores)
      ? (value.highScores as HighScore[])
      : structuredClone(DEFAULT_HIGH_SCORES);

    let activeGame: GameState | null = null;
    if (isRecord(value.activeGame)) {
      const candidate = { ...value.activeGame, highScores } as GameState;
      // A missing/corrupt board is replaced by defaults. Drop only an orphaned
      // pending score that no longer qualifies against that deterministic board.
      if (
        candidate.pendingScore &&
        (highScores.some((score) => score.id === candidate.pendingScore!.id) ||
          !qualifyScore(candidate.pendingScore!.wealth, highScores))
      ) {
        candidate.pendingScore = null;
      }
      if (isValidActiveGameCore(candidate)) activeGame = candidate;
    }

    return { activeGame, highScores };
  } catch {
    return null;
  }
}

export function serializePersistedState(data: PersistedData): string {
  const activeGame = data.activeGame
    ? (({ highScores: _highScores, ...serializedGame }) => serializedGame)(
        data.activeGame,
      )
    : null;
  return JSON.stringify({
    schemaVersion: 6,
    activeGame,
    highScores: data.highScores,
  });
}

export function parseGameState(raw: string): GameState | null {
  return parsePersistedState(raw)?.activeGame ?? null;
}

export function serializeGameState(state: GameState): string {
  return serializePersistedState({
    activeGame: state,
    highScores: state.highScores,
  });
}

export function loadPersistedState(): PersistedData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : parsePersistedState(raw);
  } catch {
    return null;
  }
}

export function loadGameState(): GameState | null {
  return loadPersistedState()?.activeGame ?? null;
}

export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeGameState(state));
  } catch {
    // Storage is optional; the current in-memory game remains playable.
  }
}

export function clearGameState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is optional; clearing a save must not break the current game.
  }
}
