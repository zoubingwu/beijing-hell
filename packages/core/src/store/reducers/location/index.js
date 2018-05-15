import produce from 'immer';

import { LOCATION_CHANGE } from '../../actions/types';
import locations from '../../data/locations';
import { random } from '../../../utils';

const initialState = {
  currentLocation: locations[random(locations.length - 1)],
};

/* eslint-disable no-param-reassign */
export default function (state = initialState, action) {
  const { type, id, name } = action;

  return produce(state, (draft) => {
    switch (type) {
      case LOCATION_CHANGE: {
        draft.currentLocation = { id, name };
        break;
      }

      default:
    }
  });
}
