import produce from 'immer';
import findIndex from 'lodash/findIndex';

import { GOODS_BOUGHT_IN, GOODS_SELL_OUT } from '../../actions/types';
import { average } from '../../../utils';

const initialState = {
  currentOwnGoods: [],
};

/* eslint-disable no-param-reassign, object-curly-newline */
export default function (state = initialState, action) {
  const { type, id, name, price, quantity } = action;

  return produce(state, (draft) => {
    const targetIndex = findIndex(draft.currentOwnGoods, o => o.id === id);

    switch (type) {
      case GOODS_BOUGHT_IN: {
        if (targetIndex > -1) {
          const target = draft.currentOwnGoods[targetIndex];
          const averagBuyInPrice = average(
            target.price * target.quantity,
            price * quantity,
            quantity + target.quantity,
          );

          const totalQuantity = target.quantity + quantity;

          draft.currentOwnGoods[targetIndex] = {
            id,
            name,
            price: averagBuyInPrice,
            quantity: totalQuantity,
          };
        } else {
          draft.currentOwnGoods.push({ id, name, price, quantity });
        }
        break;
      }

      case GOODS_SELL_OUT: {
        if (targetIndex > -1) {
          draft.currentOwnGoods[targetIndex].quantity -= quantity;
          if (draft.currentOwnGoods[targetIndex].quantity === 0) {
            draft.currentOwnGoods.splice(targetIndex, 1);
          }
        }
        break;
      }
      default:
    }
  });
}
