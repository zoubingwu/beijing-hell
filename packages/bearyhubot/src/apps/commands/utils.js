import { locations, actions, events, utils } from '@beijinghell/core';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';

import { http } from '../../client';
import { getStatusTemplate } from '../../templates';
import game from '../../game-core';

export function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time * 1000);
  });
}

/* eslint-disable no-param-reassign, object-curly-newline, prefer-destructuring, no-mixed-operators, max-len */
export const getStatus = (store) => {
  const state = store.getState();

  const time = `${state.time.currentDay + 1} / ${state.time.totalDay + 1}天`;
  const location = `${state.location.currentLocation.name}`;
  const hp = `${state.user.hitpoint}`;
  const cash = `${state.user.cash} 元`;
  const savings = `${state.user.savings} 元`;
  const debt = `${state.user.debt} 元`;
  const market = state.market.blackmarketGoods
    .map((i) => {
      if (i.marketPrice === 0) {
        return `${i.id}. ${i.name}: 这里没这东西`;
      }
      return `${i.id}. ${i.name}: ${i.marketPrice} 元`;
    })
    .join('\n');
  const storage = `${state.user.storage} / ${state.user.maxStorage} 单位`;
  const goods =
    state.goods.currentOwnGoods.length > 0
      ? state.goods.currentOwnGoods
        .map(i =>
          `${i.id}. ${i.name}\n    买入价格（平均）：${
            i.price
          } 元\n    数目: ${i.quantity}`)
        .join('\n')
      : '目前还是空空如也，家徒四壁';
  const allLocations = locations.map(i => `${i.id}. ${i.name}`).join('  ');

  return {
    time,
    location,
    hp,
    cash,
    savings,
    debt,
    market,
    storage,
    goods,
    allLocations,
  };
};

/**
 * core engine of the game, do the following things:
 * 1. generate goods price  and display them in the black market.
 * 2. handle user's cash and debt and bank savings.
 * 3. generate commerical events, health events, money-decrease events.
 * 4. test if debt is too large.
 * 5. increase the current time.
 * 6. if it is the last day, sell out user's goods if user have something left.
 *
 * @param {*} store
 * @param {*} reply
 */
export async function handleNewDay(store, reply, id) {
  let state = store.getState();
  if (state.time.currentDay >= state.time.totalDay - 1) {
    store.dispatch(actions.refreshMarket(0));
  } else {
    store.dispatch(actions.refreshMarket(3));
  }

  store.dispatch(actions.updateDebt());

  const randomMarketEvent =
    events.MARKET_EVENTS[utils.random(events.MARKET_EVENTS.length)];
  const randomCashEvent =
    events.CASH_EVENTS[utils.random(events.CASH_EVENTS.length)];

  const randomHpEvent = events.HP_EVENTS[utils.random(events.HP_EVENTS.length)];
  if (!(utils.random(1000) % randomHpEvent.freq)) {
    store.dispatch(
      actions.updateHp({
        damage: randomHpEvent.loss,
      })
    );
    reply(randomHpEvent.desc);
    await delay(2);
  }

  store.dispatch(
    actions.updateItemPrice({
      id: randomMarketEvent.relatedItem,
      factor: randomMarketEvent.factor,
    })
  );
  store.dispatch(
    actions.updateCash({
      lossPercent: randomCashEvent.lossPercent,
    })
  );

  reply(randomMarketEvent.desc);
  await delay(2);
  reply(randomCashEvent.desc);
  await delay(2);

  if (state.user.debt > 100000) {
    reply('俺欠钱太多，村长叫一群老乡揍了俺一顿！');
    await delay(2);
    store.dispatch(actions.updateHp({ damage: 30 }));
  }

  state = store.getState();
  const hp = state.user.hitpoint;

  if (hp <= 0) {
    reply('俺倒在街头,身边日记本上写着："北京，我将再来!"');
    await delay(2);
    reply('胜败乃兵家常事，英雄请重新来过！输入 `restart` 重新开始游戏');
    return true; // isEnd
  } else if (hp <= 30) {
    reply('俺的身体...好痛...快去医...');
    await delay(2);
  } else if (hp <= 60) {
    reply('由于不注意身体，俺被人发现昏迷在大街上'); // TODO make random position
    await delay(2);
  }

  if (state.time.currentDay === state.time.totalDay - 2) {
    reply('俺明天回家乡，快把全部货物卖掉。');
    await delay(2);
  }

  store.dispatch(actions.increaseTime());
  reply('又迎来了新的一天');
  await delay(2);

  state = store.getState();
  if (state.time.currentDay === state.time.totalDay) {
    const ownGoods = state.goods.currentOwnGoods;
    if (ownGoods.length > 0) {
      reply('俺已经在北京40天了，该回去结婚去了。系统替我卖了剩余货物。');
      state.goods.currentOwnGoods.forEach((i) => {
        store.dispatch(actions.sellGoods({ id: i.id }));
      });
    } else {
      reply(
        '俺已经在北京40天了，该回去结婚去了。反正货都卖掉了，直接启程回家吧。'
      );
    }

    await delay(2);
    const totalWealth = state.user.cash + state.user.savings - state.user.debt;
    reply(`游戏结束，您的总共财富为 **${totalWealth} 元**`);
    await delay(1.5);

    if (totalWealth <= 0) {
      reply('拼搏了这么多天，结果什么都没赚到，俺只能灰溜溜的回到了老家');
      return true;
    }

    const top10 = game.top10;
    if (top10.length < 10 || totalWealth > game.top10[10]) {
      const user = await http.user.info({
        user_id: id,
      });

      const name = user.full_name || user.name;
      const newTop10 = sortBy(top10.concat([{ id, totalWealth, name }]), [
        'toalWealth',
      ]).slice(0, 10).reverse();

      reply(`恭喜你, ${name}! 你进入了北京富人榜前十名！
${newTop10
    .map((u, index) => `${index + 1}. ${u.name}: ${u.totalWealth} 元`)
    .join('\n')}`);

      game.saveTop10(newTop10);
    }

    return true; // isEnd
  }

  reply(getStatusTemplate(getStatus(store)));
  return false;
}

export const handleBuyItem = ({ id, quantity, reply, store }) => {
  const state = store.getState();
  const market = state.market.blackmarketGoods;
  const ownGoods = state.goods.currentOwnGoods;
  const marketTarget = find(market, i => i.id === id);

  if (!marketTarget) {
    reply('黑市老板一脸不耐烦：这里没这东西傻缺。');
    return;
  }

  const { name, marketPrice: price } = marketTarget;

  if (price === 0) {
    reply('黑市老板一脸不耐烦：都说了这里不卖这个东西啦');
    return;
  }

  if (!quantity) {
    quantity = Math.floor(state.user.cash / price);
    if (quantity > state.user.maxStorage) {
      quantity = state.user.maxStorage;
    }
  }

  if (quantity <= 0) {
    reply('黑市老板鄙视的看我了一眼：也不撒泡尿照照自己，瞎凑啥热闹');
    return;
  }

  const totalPrice = price * quantity;
  if (totalPrice > state.user.cash) {
    reply('黑市老板鄙视的看我了一眼：你丫钱带够了么？');
    return;
  }

  const totalQuantity =
    ownGoods.map(i => i.quantity).reduce((acc, cur) => acc + cur, 0) + quantity;
  if (totalQuantity > state.user.maxStorage) {
    reply(`可惜！俺租的房子太小，只能放${state.user.maxStorage}个物品`);
    return;
  }

  store.dispatch(actions.buyGoods({ id, name, price, quantity }));
  store.dispatch(actions.updateCash({ loss: totalPrice }));
  store.dispatch(actions.updateStorage({ quantity }));
  reply(`买进了${quantity}单位的${name}`);
};

export const handleSellItem = ({ id, quantity, reply, store }) => {
  const state = store.getState();
  const market = state.market.blackmarketGoods;
  const ownGoods = state.goods.currentOwnGoods;
  const marketTarget = find(market, i => i.id === id);
  const ownTarget = find(ownGoods, i => i.id === id);

  if (!marketTarget) {
    reply('黑市老板一脸不耐烦：这里不收这个东西啦');
    return;
  }

  if (!ownTarget) {
    reply('黑市老板一脸不耐烦：你有这东西吗？');
    return;
  }

  const { name, marketPrice: price } = marketTarget;

  if (price === 0) {
    reply('黑市老板一脸不耐烦：都说了这里不收这个东西啦');
    return;
  }

  if (!quantity) {
    quantity = ownTarget.quantity;
  }

  if (quantity > ownTarget.quantity) {
    reply('黑市老板一脸不耐烦：你有这么多货吗？');
    return;
  }

  store.dispatch(actions.sellGoods({ id, name, price, quantity }));
  store.dispatch(actions.updateCash({ gain: price * quantity }));
  store.dispatch(actions.updateStorage({ quantity: 0 - quantity }));
  reply(`卖掉了${quantity}单位的${name}`);
};
