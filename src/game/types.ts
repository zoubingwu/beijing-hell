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

export interface MarketEvent {
  description: string;
  relatedItem: ItemId;
  factor: number;
}

export interface CashEvent {
  description: string;
  lossPercent: number;
}

export interface HealthEvent {
  description: string;
  loss: number;
  frequency: number;
}

export interface FreeItemEvent {
  description: string;
  relatedItem: ItemId;
  quantity: number;
}

export interface TravelRoll {
  destinationId: LocationId;
  market: MarketQuote[];
  marketEvent: MarketEvent;
  cashEvent: CashEvent;
  healthEvent?: HealthEvent;
  freeItemEvent?: FreeItemEvent;
}

export type GameStatus = 'playing' | 'won' | 'lost';
export type JournalTone = 'info' | 'good' | 'bad' | 'warning';

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
  schemaVersion: 1;
  currentDay: number;
  totalDays: number;
  currentLocationId: LocationId;
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
  journal: JournalEntry[];
  nextJournalId: number;
  highScores: HighScore[];
  lastCafeDay: number | null;
}

export interface StoragePlan {
  capacity: number;
  price: number;
  label: string;
}
