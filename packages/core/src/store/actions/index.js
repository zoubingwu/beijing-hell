import * as actionTypes from './types';

const create = (type, payload) => ({
  type,
  ...payload,
});

/* eslint-disable object-curly-newline */

/**
 * MARKET RELATED
 */
export const refreshMarket = soldout =>
  create(actionTypes.MARKET_REFRESH_ALL_PRICE, { soldout });

export const updateItemPrice = ({ id, factor }) =>
  create(actionTypes.MARKET_UPDATE_ITEM_PRICE, { id, factor });

/**
 * TIME RELATED
 */
export const increaseTime = () => create(actionTypes.TIME_INCREMENT);

export const resetTime = () => create(actionTypes.TIME_RESET);

/**
 * USER OWN GOODS RELATED
 */
export const buyGoods = ({ id, name, price, quantity }) =>
  create(actionTypes.GOODS_BOUGHT_IN, { id, name, price, quantity });

export const sellGoods = ({ id, quantity }) =>
  create(actionTypes.GOODS_SELL_OUT, { id, quantity });

/**
 * LOCATION RELATED
 */
export const changeLocation = ({ id, name }) =>
  create(actionTypes.LOCATION_CHANGE, { id, name });

/**
 * USER OWN STATUS RELATED
 */
export const updateCash = ({ lossPercent, gain, loss }) =>
  create(actionTypes.USER_UPDATE_CASH, { lossPercent, gain, loss });

export const updateStorage = ({ quantity }) =>
  create(actionTypes.USER_UPDATE_STORAGE, { quantity });

export const updateDebt = payback => create(actionTypes.USER_UPDATE_DEBT, { payback });

export const updateHp = ({ damage, heal }) => create(actionTypes.USER_UPDATE_HP, { damage, heal });

export const updateSavings = ({ deposit, withdraw }) =>
  create(actionTypes.USER_UPDATE_SAVINGS, { deposit, withdraw });
