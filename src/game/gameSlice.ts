import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import { STORAGE_PLANS } from './data/events';
import { ITEM_BY_ID } from './data/items';
import { LOCATIONS, LOCATION_BY_ID } from './data/locations';
import { clamp } from './format';
import { createMarket, createTravelRoll, pick } from './random';
import type {
  GameState,
  HighScore,
  InventoryEntry,
  ItemId,
  JournalTone,
  LocationId,
  TravelRoll,
} from './types';

const MAX_JOURNAL_ENTRIES = 80;

type GameRootState = { game: GameState };
type GameThunk = ThunkAction<void, GameRootState, unknown, UnknownAction>;

interface CompletionMeta {
  scoreId: string;
  completedAt: string;
}

interface ResolvedTravel extends TravelRoll, CompletionMeta {}

const getStorage = (state: GameState): number =>
  state.inventory.reduce((total, item) => total + item.quantity, 0);

const getWealth = (state: GameState): number =>
  state.cash + state.savings - state.debt;

const addJournal = (
  state: GameState,
  text: string,
  tone: JournalTone = 'info',
): void => {
  state.journal.push({
    id: state.nextJournalId,
    day: state.currentDay + 1,
    text,
    tone,
  });
  state.nextJournalId += 1;
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
    owned.averagePrice = Math.floor(
      (owned.averagePrice * owned.quantity + unitPrice * quantity) /
        (owned.quantity + quantity),
    );
    owned.quantity += quantity;
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
      if (quote) revenue += quote.marketPrice * owned.quantity;
    }
    state.cash += revenue;
    state.inventory = [];
    addJournal(
      state,
      `系统替俺卖掉了剩余货物，共换回 ${revenue.toLocaleString('zh-CN')} 元。`,
      'info',
    );
  }

  const wealth = getWealth(state);
  state.finalWealth = wealth;
  state.status = wealth > 0 ? 'won' : 'lost';
  addJournal(
    state,
    wealth > 0
      ? `四十天到了！俺带着 ${wealth.toLocaleString('zh-CN')} 元总资产回乡。`
      : `四十天过去，俺最终负债 ${Math.abs(wealth).toLocaleString('zh-CN')} 元，只能灰溜溜回乡。`,
    wealth > 0 ? 'good' : 'bad',
  );

  if (wealth > 0) {
    const score: HighScore = {
      id: meta.scoreId,
      wealth,
      completedAt: meta.completedAt,
    };
    state.highScores = [...state.highScores, score]
      .sort((a, b) => b.wealth - a.wealth)
      .slice(0, 10);
  }
};

export const createNewGameState = (highScores: HighScore[] = []): GameState => ({
  schemaVersion: 1,
  currentDay: 0,
  totalDays: 40,
  currentLocationId: pick(LOCATIONS).id,
  cash: 2_000,
  savings: 0,
  debt: 5_500,
  hitpoint: 100,
  fame: 100,
  maxStorage: 100,
  market: createMarket(3),
  inventory: [],
  status: 'playing',
  finalWealth: null,
  journal: [
    {
      id: 1,
      day: 1,
      tone: 'info',
      text: '俺带着两千元来到北京，还欠村长五千五百元。四十天内，一定要闯出个名堂！',
    },
  ],
  nextJournalId: 2,
  highScores,
  lastCafeDay: null,
});

const initialState = createNewGameState();

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    restartGame: {
      reducer(state, action: PayloadAction<GameState>) {
        return { ...action.payload, highScores: state.highScores };
      },
      prepare() {
        return { payload: createNewGameState() };
      },
    },
    factoryReset: {
      reducer(_state, action: PayloadAction<GameState>) {
        return action.payload;
      },
      prepare() {
        return { payload: createNewGameState([]) };
      },
    },
    buy(state, action: PayloadAction<{ itemId: ItemId; quantity: number }>) {
      const { itemId, quantity } = action.payload;
      if (state.status !== 'playing') return;
      if (!Number.isInteger(quantity) || quantity <= 0) {
        addJournal(state, '买入数量必须是大于零的整数。', 'bad');
        return;
      }
      const quote = state.market.find((item) => item.id === itemId);
      if (!quote || quote.marketPrice <= 0) {
        addJournal(state, '黑市老板摆摆手：这里今天没这东西。', 'bad');
        return;
      }
      const cost = quote.marketPrice * quantity;
      if (cost > state.cash) {
        addJournal(state, '黑市老板鄙视地看了俺一眼：钱带够了吗？', 'bad');
        return;
      }
      if (getStorage(state) + quantity > state.maxStorage) {
        addJournal(state, `出租屋太小，最多只能放 ${state.maxStorage} 件货。`, 'bad');
        return;
      }
      state.cash -= cost;
      addInventory(state, itemId, quantity, quote.marketPrice);
      addJournal(
        state,
        `买进 ${quantity} 件${quote.name}，花了 ${cost.toLocaleString('zh-CN')} 元。`,
        'good',
      );
    },
    sell(state, action: PayloadAction<{ itemId: ItemId; quantity: number }>) {
      const { itemId, quantity } = action.payload;
      if (state.status !== 'playing') return;
      if (!Number.isInteger(quantity) || quantity <= 0) {
        addJournal(state, '卖出数量必须是大于零的整数。', 'bad');
        return;
      }
      const quote = state.market.find((item) => item.id === itemId);
      const owned = state.inventory.find((item) => item.id === itemId);
      if (!quote || quote.marketPrice <= 0) {
        addJournal(state, '黑市老板摆摆手：这东西今天不收。', 'bad');
        return;
      }
      if (!owned || quantity > owned.quantity) {
        addJournal(state, '黑市老板一脸不耐烦：你有这么多货吗？', 'bad');
        return;
      }
      const revenue = quote.marketPrice * quantity;
      state.cash += revenue;
      owned.quantity -= quantity;
      if (owned.quantity === 0) {
        state.inventory = state.inventory.filter((item) => item.id !== itemId);
      }
      addJournal(
        state,
        `卖掉 ${quantity} 件${quote.name}，收回 ${revenue.toLocaleString('zh-CN')} 元。`,
        'good',
      );
    },
    deposit(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (state.status !== 'playing') return;
      if (!Number.isInteger(amount) || amount <= 0 || amount > state.cash) {
        addJournal(state, '银行职员说：存款数目不对，或者现金不够。', 'bad');
        return;
      }
      state.cash -= amount;
      state.savings += amount;
      addJournal(state, `存入银行 ${amount.toLocaleString('zh-CN')} 元。`, 'good');
    },
    withdraw(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (state.status !== 'playing') return;
      if (!Number.isInteger(amount) || amount <= 0 || amount > state.savings) {
        addJournal(state, '银行职员说：取款数目不对，或者存款不够。', 'bad');
        return;
      }
      state.savings -= amount;
      state.cash += amount;
      addJournal(state, `从银行取出 ${amount.toLocaleString('zh-CN')} 元。`, 'good');
    },
    payDebt(state, action: PayloadAction<number>) {
      const amount = action.payload;
      if (state.status !== 'playing') return;
      if (
        !Number.isInteger(amount) ||
        amount <= 0 ||
        amount > state.cash ||
        amount > state.debt
      ) {
        addJournal(state, '邮局职员说：还款金额不对。', 'bad');
        return;
      }
      state.cash -= amount;
      state.debt -= amount;
      addJournal(state, `去邮局寄给村长 ${amount.toLocaleString('zh-CN')} 元。`, 'good');
    },
    heal(state, action: PayloadAction<number>) {
      const points = action.payload;
      const cost = points * 2_500;
      if (state.status !== 'playing') return;
      if (
        !Number.isInteger(points) ||
        points <= 0 ||
        state.hitpoint + points > 100 ||
        cost > state.cash
      ) {
        addJournal(state, '医生说：治疗点数不对、身体不需要，或者钱不够。', 'bad');
        return;
      }
      state.cash -= cost;
      state.hitpoint += points;
      addJournal(state, `花 ${cost.toLocaleString('zh-CN')} 元恢复了 ${points} 点健康。`, 'good');
    },
    rentStorage(state, action: PayloadAction<number>) {
      const capacity = action.payload;
      const plan = STORAGE_PLANS.find((entry) => entry.capacity === capacity);
      if (state.status !== 'playing') return;
      if (!plan || plan.capacity <= state.maxStorage) {
        addJournal(state, '中介说：这套房不比你现在的出租屋大。', 'bad');
        return;
      }
      if (plan.price > state.cash) {
        addJournal(state, '中介掐指一算：你带的钱还不够。', 'bad');
        return;
      }
      state.cash -= plan.price;
      state.maxStorage = plan.capacity;
      addJournal(
        state,
        `租下${plan.label}，出租屋容量扩大到 ${plan.capacity} 件。`,
        'good',
      );
    },
    visitInternetCafe(state) {
      if (state.status !== 'playing') return;
      if (state.lastCafeDay === state.currentDay) {
        addJournal(state, '网吧老板说：今天的广告你已经点过了。', 'warning');
        return;
      }
      state.lastCafeDay = state.currentDay;
      state.cash += 3;
      addJournal(state, '俺去网吧免费上了一会儿网，还赚了3元广告费。', 'good');
    },
    travelRejected(state, action: PayloadAction<string>) {
      addJournal(state, action.payload, 'bad');
    },
    travelResolved(state, action: PayloadAction<ResolvedTravel>) {
      if (state.status !== 'playing') return;
      const destination = LOCATION_BY_ID.get(action.payload.destinationId);
      if (!destination || action.payload.destinationId === state.currentLocationId) return;

      state.currentLocationId = destination.id;
      state.market = action.payload.market;
      addJournal(state, `俺悄悄地来到了${destination.name}。`, 'info');

      if (state.debt > 0) {
        state.debt = Math.floor(state.debt * 1.1);
      }

      if (action.payload.healthEvent) {
        state.hitpoint = clamp(
          state.hitpoint - action.payload.healthEvent.loss,
          0,
          100,
        );
        addJournal(state, action.payload.healthEvent.description, 'bad');
      }

      const affectedQuote = state.market.find(
        (item) => item.id === action.payload.marketEvent.relatedItem,
      );
      if (affectedQuote) {
        affectedQuote.marketPrice = Math.floor(
          affectedQuote.marketPrice * action.payload.marketEvent.factor,
        );
      }
      addJournal(state, action.payload.marketEvent.description, 'warning');

      state.cash = Math.floor(
        state.cash * ((100 - action.payload.cashEvent.lossPercent) / 100),
      );
      addJournal(state, action.payload.cashEvent.description, 'bad');

      if (action.payload.freeItemEvent) {
        const available = state.maxStorage - getStorage(state);
        const received = Math.min(available, action.payload.freeItemEvent.quantity);
        if (received > 0) {
          addInventory(
            state,
            action.payload.freeItemEvent.relatedItem,
            received,
            0,
          );
          addJournal(
            state,
            `${action.payload.freeItemEvent.description}（得到 ${received} 件）`,
            'good',
          );
        } else {
          addJournal(
            state,
            `${action.payload.freeItemEvent.description} 可惜出租屋已经塞满了。`,
            'warning',
          );
        }
      }

      if (state.debt > 100_000) {
        state.hitpoint = clamp(state.hitpoint - 30, 0, 100);
        addJournal(state, '俺欠钱太多，村长叫一群老乡揍了俺一顿！（损失30点健康）', 'bad');
      }

      if (state.hitpoint <= 0) {
        state.status = 'lost';
        state.finalWealth = getWealth(state);
        addJournal(state, '俺倒在街头，日记本上写着：“北京，我将再来！”', 'bad');
        return;
      }

      state.currentDay = Math.min(state.currentDay + 1, state.totalDays - 1);
      addJournal(state, '又迎来了新的一天。', 'info');

      if (state.currentDay === state.totalDays - 2) {
        addJournal(state, '俺明天就要回乡了，快把全部货物卖掉！', 'warning');
      }
      if (state.hitpoint <= 30) {
        addJournal(state, '俺的身体……好痛……快去医院。', 'warning');
      } else if (state.hitpoint <= 60) {
        addJournal(state, '俺身体很虚弱，再不治疗就危险了。', 'warning');
      }

      if (state.currentDay >= state.totalDays - 1) {
        finishGame(state, action.payload, true);
      }
    },
    endEarly: {
      reducer(state, action: PayloadAction<CompletionMeta>) {
        if (state.status !== 'playing') return;
        addJournal(state, '俺决定提前离开北京。', 'warning');
        finishGame(state, action.payload, true);
      },
      prepare() {
        return {
          payload: {
            scoreId: crypto.randomUUID(),
            completedAt: new Date().toISOString(),
          },
        };
      },
    },
    clearJournal(state) {
      state.journal = [];
    },
  },
});

export const travelTo = (destinationId: LocationId): GameThunk =>
  (dispatch, getState) => {
    const state = getState().game;
    if (state.status !== 'playing') {
      dispatch(gameSlice.actions.travelRejected('这一局已经结束，请开始新游戏。'));
      return;
    }
    if (!LOCATION_BY_ID.has(destinationId)) {
      dispatch(gameSlice.actions.travelRejected('不好意思，没听说过这地儿。'));
      return;
    }
    if (destinationId === state.currentLocationId) {
      dispatch(gameSlice.actions.travelRejected('俺现在就在这地儿呀。'));
      return;
    }
    dispatch(
      gameSlice.actions.travelResolved({
        ...createTravelRoll(
          destinationId,
          state.currentDay,
          state.totalDays,
        ),
        scoreId: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
      }),
    );
  };

export const {
  buy,
  clearJournal,
  deposit,
  endEarly,
  factoryReset,
  heal,
  payDebt,
  rentStorage,
  restartGame,
  sell,
  visitInternetCafe,
  withdraw,
} = gameSlice.actions;

export default gameSlice.reducer;

export type { InventoryEntry };
