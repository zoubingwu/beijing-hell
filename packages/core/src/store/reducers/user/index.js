import produce from 'immer';

import {
  USER_UPDATE_DEBT,
  USER_UPDATE_CASH,
  USER_UPDATE_HP,
  USER_UPDATE_STORAGE,
} from '../../actions/types';

const initialState = {
  storage: 0,
  maxStorage: 100,
  hitpoint: 100,
  fame: 100,
  debt: 5500,
  cash: 2000,
  savings: 0,
};

/* eslint-disable no-param-reassign */
export default function (state = initialState, action) {
  const { type } = action;

  return produce(state, (draft) => {
    switch (type) {
      case USER_UPDATE_DEBT: {
        const { payback } = action;

        if (payback && payback <= draft.debt) {
          draft.debt -= payback;
          return;
        }

        if (draft.debt !== 0) {
          draft.debt = Math.floor(draft.debt * 1.1);
        }
        break;
      }

      case USER_UPDATE_HP: {
        const { damage, heal } = action;
        if (damage) {
          draft.hitpoint -= damage;
        } else if (heal) {
          draft.hitpoint += heal;
        }
        break;
      }

      case USER_UPDATE_STORAGE: {
        const { quantity } = action;
        draft.storage += quantity;
        break;
      }

      case USER_UPDATE_CASH: {
        const { lossPercent, gain, loss } = action;

        if (lossPercent) {
          draft.cash = Math.floor(draft.cash * ((100 - lossPercent) / 100));
        } else if (loss) {
          draft.cash -= loss;
        } else if (gain) {
          draft.cash += gain;
        }
        break;
      }
      default:
    }
  });
}
