import 'babel-polyfill';

import * as clients from './client';
// import logger from './apps/logger';
import commands from './apps/commands';

// logger(clients);
commands(clients);
