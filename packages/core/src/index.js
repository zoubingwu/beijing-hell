import { createStore } from 'redux';

import rootReducer from './store';
import locations from './store/data/locations';
import * as events from './store/data/events';
import * as actions from './store/actions';
import * as utils from './utils';

const storeFactory = preloadedState => createStore(rootReducer, preloadedState);

export default storeFactory;

export {
  locations,
  events,
  actions,
  utils,
};
