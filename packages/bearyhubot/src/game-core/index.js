import storeFactory from '@beijinghell/core';
import storage from 'node-persist';
import sortBy from 'lodash/sortBy';

class Game {
  constructor() {
    this.archive = {};
    this.top10 = [];
    this.initialize();
  }

  async initialize() {
    await storage.init({
      dir: './game-archive',
    });

    const storedTop10 = await storage.getItem('top10');
    const storedStates = await storage.getItem('archive');

    this.top10 = storedTop10 || [];
    if (storedStates) {
      const keys = Object.keys(storedStates);
      if (keys.length > 0) {
        keys.forEach((key) => {
          this.archive[key] = storeFactory(storedStates[key]);
        });
      }
    }
  }

  load(id) {
    return this.archive[id];
  }

  async saveTop10(top10) {
    this.top10 = sortBy(top10, ['toalWealth']).reverse();
    await storage.setItem('top10', this.top10);
  }

  async save(id, store) {
    this.archive[id] = store;
    const storedStates = {};

    Object.keys(this.archive).forEach((key) => {
      storedStates[key] = this.archive[key].getState();
    });
    await storage.setItem('archive', storedStates);
  }
}

export default new Game();
