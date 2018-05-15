import produce from 'immer';
import { TIME_INCREMENT, TIME_RESET } from '../../actions/types';

const initialState = {
  currentDay: 0,
  totalDay: 39,
};

/* eslint-disable no-param-reassign */
export default function (state = initialState, action) {
  return produce(state, (draft) => {
    switch (action.type) {
      case TIME_INCREMENT: {
        if (draft.currentDay < draft.totalDay) {
          draft.currentDay += 1;
        }
        break;
      }

      case TIME_RESET: {
        draft.currentDay = 0;
        break;
      }

      default:
    }
  });
}
