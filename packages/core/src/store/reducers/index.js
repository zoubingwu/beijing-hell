import { combineReducers } from 'redux';

import goodsReducer from './goods';
import marketReducer from './market';
import timeReducer from './time';
import userReducer from './user';
import locationReducer from './location';

export default combineReducers({
  goods: goodsReducer,
  market: marketReducer,
  time: timeReducer,
  user: userReducer,
  location: locationReducer,
});

