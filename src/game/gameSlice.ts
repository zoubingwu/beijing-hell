import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { ITEM_BY_ID } from "./data/items";
import { LOCATION_BY_SLOT } from "./data/locations";
import { createMarket } from "./random";
import { resolveTravel } from "./engine";
import { gameRuntime, type GameRuntime } from "./runtime";
import { DEFAULT_HIGH_SCORES } from "./data/highScores";
import { fameLabel, insertScore, qualifyScore } from "./scoring";
import {
  DOMAIN_MAX,
  saturatingAdd,
  saturatingMultiply,
  saturatingSignedAdd,
  saturatingSubtract,
  saturatingWealth,
  weightedAverage,
} from "./numbers";
import type {
  GameState,
  HighScore,
  PendingScore,
  InventoryEntry,
  ItemId,
  JournalTone,
  LocationSlot,
  LocationMode,
} from "./types";

const MAX_JOURNAL_ENTRIES = 80;

type GameRootState = { game: GameState };
type GameThunk = ThunkAction<void, GameRootState, GameRuntime, UnknownAction>;

interface CompletionMeta {
  scoreId: string;
  completedAt: string;
}

interface TravelResolvedPayload {
  state: GameState;
  logs: { text: string; tone?: JournalTone }[];
  destinationSlot: LocationSlot;
  outcome: "continue" | "died" | "completed";
  eventDay: number;
  completion?: CompletionMeta;
}

const getStorage = (state: GameState): number =>
  state.inventory.reduce(
    (total, item) => saturatingAdd(total, item.quantity),
    0,
  );

const getWealth = (state: GameState): number =>
  saturatingWealth(state.cash, state.savings, state.debt);

interface StorageRentQuote {
  cost: number;
  remainingCash: number;
}

export const quoteStorageRent = (cash: number): StorageRentQuote | null => {
  if (!Number.isSafeInteger(cash) || cash < 30_000) return null;

  const remainingCash = cash === 30_000
    ? 5_000
    : saturatingSubtract(Math.trunc(cash / 2), 2_000);

  return {
    cost: saturatingSubtract(cash, remainingCash),
    remainingCash,
  };
};

const addJournal = (
  state: GameState,
  text: string,
  tone: JournalTone = "info",
  day?: number,
): void => {
  if (state.nextJournalId > DOMAIN_MAX - 500) {
    state.journal = state.journal.slice(-500).map((entry, index) => ({
      ...entry,
      id: index + 1,
    }));
    state.nextJournalId = state.journal.length + 1;
  }
  state.journal.push({
    id: state.nextJournalId,
    day: Math.max(
      1,
      Math.min(40, day ?? state.totalDays - state.remainingTurns + 1),
    ),
    text,
    tone,
  });
  state.nextJournalId = saturatingAdd(state.nextJournalId, 1);
  if (state.journal.length > MAX_JOURNAL_ENTRIES) {
    state.journal.splice(0, state.journal.length - MAX_JOURNAL_ENTRIES);
  }
};

const addInventory = (
  state: GameState,
  itemId: ItemId,
  quantity: number,
  unitPrice: number,
): void => {
  const definition = ITEM_BY_ID.get(itemId);
  if (!definition || quantity <= 0) return;

  const owned = state.inventory.find((item) => item.id === itemId);
  if (owned) {
    owned.averagePrice = weightedAverage(
      owned.averagePrice,
      owned.quantity,
      unitPrice,
      quantity,
    );
    owned.quantity = saturatingAdd(owned.quantity, quantity);
    return;
  }

  state.inventory.push({
    id: itemId,
    name: definition.name,
    averagePrice: unitPrice,
    quantity,
  });
  state.inventory.sort((a, b) => a.id - b.id);
};

const finishGame = (
  state: GameState,
  meta: CompletionMeta,
  sellInventory: boolean,
): void => {
  if (sellInventory && state.inventory.length > 0) {
    let revenue = 0;
    for (const owned of state.inventory) {
      const quote = state.market.find((item) => item.id === owned.id);
      if (quote) {
        revenue = saturatingAdd(
          revenue,
          saturatingMultiply(quote.marketPrice, owned.quantity),
        );
      }
    }
    state.cash = saturatingAdd(state.cash, revenue);
    state.inventory = [];
    addJournal(
      state,
      `系统替俺卖掉了剩余货物，共换回 ${revenue.toLocaleString("zh-CN")} 元。`,
      "info",
    );
  }

  const wealth = getWealth(state);
  state.finalWealth = wealth;
  state.status = wealth > 0 ? "won" : "lost";
  addJournal(
    state,
    wealth > 0
      ? `四十天到了！俺带着 ${wealth.toLocaleString("zh-CN")} 元总资产回乡。`
      : `四十天过去，俺最终负债 ${Math.abs(wealth).toLocaleString("zh-CN")} 元，只能灰溜溜回乡。`,
    wealth > 0 ? "good" : "bad",
  );

  if (qualifyScore(wealth, state.highScores) && !state.pendingScore) {
    const pending: PendingScore = {
      id: meta.scoreId,
      wealth,
      health: state.hitpoint,
      fame: state.fame,
      fameLabel: fameLabel(state.fame),
      completedAt: meta.completedAt,
    };
    state.pendingScore = pending;
  }
};

export const createNewGameState = (
  runtime: GameRuntime,
  highScores: HighScore[] = structuredClone(DEFAULT_HIGH_SCORES),
): GameState => ({
  schemaVersion: 6,
  pendingScore: null,
  totalDays: 40,
  remainingTurns: 40,
  currentLocationSlot: null,
  locationMode: "subway" as LocationMode,
  cash: 2_000,
  savings: 0,
  debt: 5_500,
  hitpoint: 100,
  fame: 100,
  maxStorage: 100,
  market: createMarket(3, runtime),
  inventory: [],
  status: "playing",
  finalWealth: null,
  hackerEnabled: false,
  deathObserved: false,
  endReason: null,
  journal: [
    {
      id: 1,
      day: 1,
      tone: "info",
      text: "俺带着两千元来到北京，还欠村长五千五百元。四十天内，一定要闯出个名堂！",
    },
  ],
  nextJournalId: 2,
  highScores,
  internetCafeVisits: 0,
});

export const initialGameState = createNewGameState(gameRuntime);

const gameSlice = createSlice({
  name: "game",
  initialState: initialGameState,
  reducers: {
    restartGameResolved(state, action: PayloadAction<GameState>) {
      if (state.pendingScore) return;
      return { ...action.payload, highScores: state.highScores };
    },
    factoryResetResolved(_state, action: PayloadAction<GameState>) {
      return action.payload;
    },
    buy(state, action: PayloadAction<{ itemId: ItemId; quantity: number }>) {
      const { itemId, quantity } = action.payload;
      if (state.status !== "playing") return;
      if (!Number.isSafeInteger(quantity) || quantity < 0) {
        addJournal(state, "买入数量必须是非负整数。", "bad");
        return;
      }
      const quote = state.market.find((item) => item.id === itemId);
      if (!quote || quote.marketPrice <= 0) {
        addJournal(state, "黑市老板摆摆手：这里今天没这东西。", "bad");
        return;
      }
      const cost = saturatingMultiply(quote.marketPrice, quantity);
      if (cost > state.cash) {
        addJournal(state, "黑市老板鄙视地看了俺一眼：钱带够了吗？", "bad");
        return;
      }
      if (saturatingAdd(getStorage(state), quantity) > state.maxStorage) {
        addJournal(
          state,
          `出租屋太小，最多只能放 ${state.maxStorage} 件货。`,
          "bad",
        );
        return;
      }
      state.cash = saturatingSubtract(state.cash, cost);
      addInventory(state, itemId, quantity, quote.marketPrice);
      addJournal(
        state,
        `买进 ${quantity} 件${quote.name}，花了 ${cost.toLocaleString("zh-CN")} 元。`,
        "good",
      );
    },
    sell(state, action: PayloadAction<{ itemId: ItemId; quantity: number }>) {
      const { itemId, quantity } = action.payload;
      if (state.status !== "playing") return;
      if (!Number.isSafeInteger(quantity) || quantity < 0) {
        addJournal(state, "卖出数量必须是非负整数。", "bad");
        return;
      }
      const quote = state.market.find((item) => item.id === itemId);
      const owned = state.inventory.find((item) => item.id === itemId);
      if (!quote || quote.marketPrice <= 0) {
        addJournal(state, "黑市老板摆摆手：这东西今天不收。", "bad");
        return;
      }
      if (!owned || quantity > owned.quantity) {
        addJournal(state, "黑市老板一脸不耐烦：你有这么多货吗？", "bad");
        return;
      }
      const revenue = saturatingMultiply(quote.marketPrice, quantity);
      state.cash = saturatingAdd(state.cash, revenue);
      owned.quantity = saturatingSubtract(owned.quantity, quantity);
      if (owned.quantity === 0) {
        state.inventory = state.inventory.filter((item) => item.id !== itemId);
      }
      if (itemId === 7) state.fame = Math.max(0, state.fame - 7);
      if (itemId === 5) state.fame = Math.max(0, state.fame - 10);
      addJournal(
        state,
        `卖掉 ${quantity} 件${quote.name}，收回 ${revenue.toLocaleString("zh-CN")} 元。`,
        "good",
      );
    },
    deposit(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (state.status !== "playing") return;
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > state.cash) {
        addJournal(state, "银行职员说：存款数目不对，或者现金不够。", "bad");
        return;
      }
      state.cash = saturatingSubtract(state.cash, amount);
      state.savings = saturatingAdd(state.savings, amount);
      addJournal(
        state,
        `存入银行 ${amount.toLocaleString("zh-CN")} 元。`,
        "good",
      );
    },
    withdraw(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (state.status !== "playing") return;
      if (!Number.isSafeInteger(amount) || amount < 0 || amount > state.savings) {
        addJournal(state, "银行职员说：取款数目不对，或者存款不够。", "bad");
        return;
      }
      state.savings = saturatingSubtract(state.savings, amount);
      state.cash = saturatingAdd(state.cash, amount);
      addJournal(
        state,
        `从银行取出 ${amount.toLocaleString("zh-CN")} 元。`,
        "good",
      );
    },
    payDebt(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (state.status !== "playing") return;
      if (
        !Number.isSafeInteger(amount) ||
        amount < 0 ||
        amount > state.cash ||
        amount > state.debt
      ) {
        addJournal(state, "邮局职员说：还款金额不对。", "bad");
        return;
      }
      state.cash = saturatingSubtract(state.cash, amount);
      state.debt = saturatingSubtract(state.debt, amount);
      addJournal(
        state,
        `去邮局寄给村长 ${amount.toLocaleString("zh-CN")} 元。`,
        "good",
      );
    },
    heal(state, action: PayloadAction<number>) {
      const points = action.payload;
      const cost = saturatingMultiply(points, 3_500);
      if (state.status !== "playing") return;
      if (
        !Number.isSafeInteger(points) ||
        points <= 0 ||
        saturatingSignedAdd(state.hitpoint, points) > 100 ||
        cost > state.cash
      ) {
        addJournal(
          state,
          "医生说：治疗点数不对、身体不需要，或者钱不够。",
          "bad",
        );
        return;
      }
      state.cash = saturatingSubtract(state.cash, cost);
      state.hitpoint = Math.min(
        100,
        saturatingSignedAdd(state.hitpoint, points),
      );
      addJournal(
        state,
        `花 ${cost.toLocaleString("zh-CN")} 元恢复了 ${points} 点健康。`,
        "good",
      );
    },
    rentStorage(state) {
      if (state.status !== "playing") return;
      if (state.maxStorage >= 140) {
        addJournal(state, "中介说：容量已经到顶了。", "bad");
        return;
      }
      const quote = quoteStorageRent(state.cash);
      if (!quote) {
        addJournal(state, "中介说：现金不够三万元。", "bad");
        return;
      }
      state.cash = quote.remainingCash;
      state.maxStorage += 10;
      addJournal(state, `出租屋容量扩大到 ${state.maxStorage} 件。`, "good");
    },
    cafeReward(state, action: PayloadAction<number>) {
      if (state.status !== "playing" || state.internetCafeVisits >= 3 || state.cash < 15) return;
      const reward = action.payload;
      if (!Number.isSafeInteger(reward) || reward < 1 || reward > 10) return;
      state.cash = saturatingAdd(state.cash, reward);
      state.internetCafeVisits += 1;
      addJournal(state, `俺去网吧免费上了一会儿网，还赚了${reward}元广告费。`, "good");
    },
    travelRejected(state, action: PayloadAction<string>) {
      addJournal(state, action.payload, "bad");
    },
    toggleLocationMode(state) {
      state.locationMode = state.locationMode === 'subway' ? 'surface' : 'subway';
    },
    travelResolved(state, action: PayloadAction<TravelResolvedPayload>) {
      if (state.status !== "playing") return;
      const destination = LOCATION_BY_SLOT.get(action.payload.destinationSlot);
      if (
        !destination ||
        action.payload.destinationSlot === state.currentLocationSlot
      )
        return;
      const resolved = action.payload.state;
      Object.assign(state, resolved);
      state.currentLocationSlot = destination.slot;
      addJournal(
        state,
        `俺悄悄地来到了${state.locationMode === 'subway' ? destination.subway : destination.surface}。`,
        "info",
        action.payload.eventDay,
      );
      for (const log of action.payload.logs)
        addJournal(
          state,
          log.text,
          log.tone ?? "info",
          action.payload.eventDay,
        );
      if (action.payload.outcome === "completed" && action.payload.completion) {
        state.endReason = "completed";
        finishGame(state, action.payload.completion, true);
      } else if (action.payload.outcome === "died") {
        state.endReason = "died";
        state.status = "lost";
        state.finalWealth = getWealth(state);
      }
    },
    submitScoreName(state, action: PayloadAction<string>) {
      if (!state.pendingScore) return;
      const pending = state.pendingScore;
      const { fame: _fame, ...scoreFields } = pending;
      const score: HighScore = {
        ...scoreFields,
        name: action.payload.trim() || "无名氏",
      };
      state.highScores = insertScore(state.highScores, score);
      state.pendingScore = null;
    },
    endEarlyResolved(state, action: PayloadAction<CompletionMeta>) {
      if (state.status !== "playing") return;
      state.endReason = "manual";
      addJournal(state, "俺决定提前离开北京。", "warning");
      finishGame(state, action.payload, false);
    },
    clearJournal(state) {
      state.journal = [];
    },
  },
});

export const toggleLocationMode = () => gameSlice.actions.toggleLocationMode();

export const restartGame = (): GameThunk => (dispatch, getState, runtime) => {
  if (getState().game.pendingScore) return;
  dispatch(gameSlice.actions.restartGameResolved(createNewGameState(runtime)));
};

export const factoryReset = (): GameThunk => (dispatch, _getState, runtime) => {
  dispatch(
    gameSlice.actions.factoryResetResolved(createNewGameState(runtime)),
  );
};

export const endEarly = (): GameThunk => (dispatch, _getState, runtime) => {
  dispatch(
    gameSlice.actions.endEarlyResolved({
      scoreId: runtime.createId(),
      completedAt: runtime.now(),
    }),
  );
};

export const travelTo =
  (destinationSlot: LocationSlot): GameThunk =>
  (dispatch, getState, runtime) => {
    const state = getState().game;
    if (state.status !== "playing") {
      dispatch(
        gameSlice.actions.travelRejected("这一局已经结束，请开始新游戏。"),
      );
      return;
    }
    if (!LOCATION_BY_SLOT.has(destinationSlot)) {
      dispatch(gameSlice.actions.travelRejected("不好意思，没听说过这地儿。"));
      return;
    }
    // Same-location travel is a true no-op: do not dispatch or consume runtime metadata.
    if (destinationSlot === state.currentLocationSlot) return;
    const resolution = resolveTravel(state, destinationSlot, runtime);
    const completion =
      resolution.outcome === "completed"
        ? { scoreId: runtime.createId(), completedAt: runtime.now() }
        : undefined;
    dispatch(
      gameSlice.actions.travelResolved({
        state: resolution.state,
        logs: resolution.logs,
        destinationSlot,
        outcome: resolution.outcome,
        eventDay: resolution.eventDay,
        completion,
      }),
    );
  };

export const {
  buy,
  cafeReward,
  clearJournal,
  deposit,
  heal,
  payDebt,
  rentStorage,
  sell,
  withdraw,
  submitScoreName,
} = gameSlice.actions;

export const visitInternetCafe = (): GameThunk => (dispatch, getState, runtime) => {
  const state = getState().game;
  if (state.status !== "playing" || state.internetCafeVisits >= 3 || state.cash < 15) {
    return;
  }
  dispatch(cafeReward(1 + runtime.nextInt(10)));
};

export default gameSlice.reducer;

export type { InventoryEntry };
