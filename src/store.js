import createStore from 'reackt';

import events from './models/events';
import time from './models/time';

const store = createStore(
  {
    models: { events, time },
    onError: e => alert(e.message),
  },
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
