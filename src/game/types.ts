export type ItemId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type LocationId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19;

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  basePrice: number;
  extraPrice: number;
}

export interface LocationDefinition {
  id: LocationId;
  name: string;
}

export interface MarketQuote {
  id: ItemId;
  name: string;
  marketPrice: number;
}

export interface InventoryEntry {
  id: ItemId;
  name: string;
  averagePrice: number;
  quantity: number;
}

export type MarketEffect =
  | { kind: "multiply"; itemId: ItemId; value: number }
  | { kind: "divide"; itemId: ItemId; value: number }
  | { kind: "gift"; itemId: ItemId; quantity: number; debtIncrease?: number };

export interface MarketEventDefinition {
  frequency: number;
  description: string;
  effect: MarketEffect;
}

export interface CashEvent {
  description: string;
  lossPercent: number;
  target: "cash" | "savings";
  frequency: number;
}

export interface HealthEvent {
  description: string;
  loss: number;
  frequency: number;
}

export type GameStatus = "playing" | "won" | "lost";
export type JournalTone = "info" | "good" | "bad" | "warning";

export interface JournalEntry {
  id: number;
  day: number;
  text: string;
  tone: JournalTone;
}

export interface HighScore {
  id: string;
  wealth: number;
  completedAt: string;
}

export interface GameState {
  schemaVersion: 3;
  totalDays: number;
  remainingTurns: number;
  currentLocationId: LocationId | null;
  cash: number;
  savings: number;
  debt: number;
  hitpoint: number;
  fame: number;
  maxStorage: number;
  market: MarketQuote[];
  inventory: InventoryEntry[];
  status: GameStatus;
  finalWealth: number | null;
  hackerEnabled: boolean;
  deathObserved: boolean;
  endReason: "completed" | "died" | "manual" | null;
  journal: JournalEntry[];
  nextJournalId: number;
  highScores: HighScore[];
  internetCafeVisits: number;
}
