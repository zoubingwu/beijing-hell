import produce from 'immer';
import findIndex from 'lodash/findIndex';

import {
  MARKET_REFRESH_ALL_PRICE,
  MARKET_UPDATE_ITEM_PRICE,
} from '../../actions/types';
import items from '../../data/items';
import { random } from '../../../utils';

/* eslint-disable no-param-reassign, object-curly-newline, no-plusplus, function-paren-newline */
function initMarket(soldout) {
  const blackmarketGoods = items.map(({ id, name, desc, basePrice, extraPrice }) => ({
    id,
    name,
    desc,
    marketPrice: random(extraPrice) + basePrice,
  }));

  for (let i = 0; i < soldout; i++) {
    blackmarketGoods[random(blackmarketGoods.length - 1)].marketPrice = 0;
  }

  return blackmarketGoods;
}

const intialState = {
  blackmarketGoods: initMarket(3),
};

export default function (state = intialState, action) {
  const { type, soldout, name, factor, id } = action;

  return produce(state, (draft) => {
    switch (type) {
      case MARKET_REFRESH_ALL_PRICE: {
        draft.blackmarketGoods = initMarket(soldout);
        break;
      }

      case MARKET_UPDATE_ITEM_PRICE: {
        const targetIndex = findIndex(
          draft.blackmarketGoods,
          i => i.name === name || i.id === id,
        );

        if (targetIndex > -1) {
          draft.blackmarketGoods[targetIndex].marketPrice = Math.floor(
            draft.blackmarketGoods[targetIndex].marketPrice * factor,
          );
        }
        break;
      }

      default:
    }
  });
}
