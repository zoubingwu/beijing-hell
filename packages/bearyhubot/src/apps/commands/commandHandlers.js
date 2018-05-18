import storeFactory, { locations, actions } from '@beijinghell/core';
import find from 'lodash/find';
import isFinite from 'lodash/isFinite';

import {
  getStatus,
  handleNewDay,
  handleBuyItem,
  handleSellItem,
  delay,
} from './utils';
import game from '../../game-core';

import {
  INTRODUCTION_TEMPLATE,
  COMMANDS_TEMPLATE,
  START_TEMPLATE,
  getStatusTemplate,
} from '../../templates';

const commandHandlers = {
  help(options, reply) {
    reply(INTRODUCTION_TEMPLATE);
  },

  cmd(options, reply) {
    reply(COMMANDS_TEMPLATE);
  },

  start(options, reply) {
    const message = this;
    const id = message.uid;

    if (game.load(id)) {
      reply('发现旧的存档，已经自动载入，请输入命令继续游戏。或输入 `cmd` 查看所有可用的命令。');
      return;
    }

    game.save(id, storeFactory());
    reply(START_TEMPLATE);
  },

  restart(options, reply) {
    const message = this;
    const id = message.uid;

    game.save(id, storeFactory());
    reply('游戏已经重置');
  },

  async status(options, reply) {
    const message = this;
    let store = game.load(message.uid);

    if (!store) {
      reply('未检测到存档，自动开启新的存档');
      await game.save(message.uid, storeFactory());
      reply(START_TEMPLATE);
      store = game.load(message.uid);
    }

    const state = getStatus(store);
    reply(getStatusTemplate(state));
  },

  async goto(options, reply) {
    const locationId = parseInt(options[0], 10);

    if (!isFinite(locationId)) {
      reply('不好意思，没听说过这地儿');
      return;
    }

    if (locationId >= locations.length || locationId < 0) {
      reply('不好意思，没听说过这地儿');
      return;
    }

    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    const state = store.getState();

    if (locationId === state.location.currentLocation.id) {
      reply('俺现在就在这地儿呀');
      return;
    }

    const location = find(locations, i => i.id === locationId);
    store.dispatch(actions.changeLocation(location));
    reply(`俺悄悄的来到了${location.name}`);
    await delay(2);
    const isEnd = await handleNewDay(store, reply, message.uid);
    if (isEnd) {
      await game.save(message.uid, storeFactory());
    } else {
      await game.save(message.uid, store);
    }
  },

  buy(options, reply) {
    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    let [id, quantity] = options;
    id = parseInt(id, 10);
    quantity = quantity ? parseInt(quantity, 10) : quantity;

    if (!isFinite(id) || (quantity && !isFinite(quantity))) {
      reply('这个命令有点问题啊');
      return;
    }

    handleBuyItem({
      id,
      quantity,
      reply,
      store,
    });
  },

  sell(options, reply) {
    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    let [id, quantity] = options;
    id = parseInt(id, 10);
    quantity = quantity ? parseInt(quantity, 10) : quantity;

    if (!isFinite(id) || (quantity && !isFinite(quantity))) {
      reply('这个命令有点问题啊');
      return;
    }

    handleSellItem({
      id,
      quantity,
      reply,
      store,
    });
  },

  deposit(options, reply) {
    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    let [deposit] = options;
    deposit = parseInt(deposit, 10);

    if (deposit < 0 || !isFinite(deposit)) {
      reply('能不能好好存钱，别瞎b输命令。');
      return;
    }

    const state = store.getState();
    if (deposit <= state.user.cash) {
      store.dispatch(actions.updateSavings({ deposit }));
    } else {
      reply('你带这么多钱了吗？');
    }
  },

  withdraw(options, reply) {
    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    let [withdraw] = options;
    withdraw = parseInt(withdraw, 10);

    if (withdraw < 0 || !isFinite(withdraw)) {
      reply('能不能好好取钱，别瞎b输命令。');
      return;
    }

    const state = store.getState();
    if (withdraw <= state.user.savings) {
      store.dispatch(actions.updateSavings({ withdraw }));
    } else {
      reply('你带这么多钱了吗？');
    }
  },

  hospital(options, reply) {
    const message = this;
    const store = game.load(message.uid);
    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }
    const state = store.getState();
    if (state.user.hitpoint === 100) {
      reply('小护士笑咪咪地望着俺："大哥！神经科这边挂号');
    } else {
      reply(`来到医院了，黑心医生笑嘻嘻的对我说，来看病呀，我看看，你有 ${100 - state.user.hitpoint} 健康值需要回复，每点 2500 RMB，童叟无欺哦。`);
    }
  },

  heal(options, reply) {
    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    let [heal] = options;
    heal = parseInt(heal, 10);

    const state = store.getState();
    if (heal < 0 || !isFinite(heal)) {
      reply('你说啥？');
      return;
    }

    if (2500 * heal > state.user.cash) {
      reply('医生说，“钱不够哎! 拒绝治疗。”');
      return;
    }

    if (heal + state.user.hitpoint > 100) {
      reply('大哥，你用不着治疗这么多');
      return;
    }

    reply(`回复了 ${heal} 点健康值`);
    store.dispatch(actions.updateHp({ heal }));
    store.dispatch(actions.updateCash({ loss: 2500 * heal }));
  },

  pay(options, reply) {
    const message = this;
    const store = game.load(message.uid);

    if (!store) {
      reply('需要开始游戏后才能使用这个命令');
      return;
    }

    let [payback] = options;
    payback = parseInt(payback, 10);
    if (!isFinite(payback)) {
      reply('这个命令有点问题啊');
      return;
    }

    const state = store.getState();
    if (payback <= 0) {
      reply('你这个数目有点问题啊');
      return;
    }
    if (payback > state.user.cash) {
      reply('你好像没带这么多钱');
      return;
    }
    if (payback > state.user.debt) {
      reply('居然还有人要多还钱，你是不是傻啊');
      return;
    }

    store.dispatch(actions.updateCash({ loss: payback }));
    store.dispatch(actions.updateDebt(payback));
    reply(`去邮局寄钱还给了村长 ${payback} 元`);
  },

  top10(options, reply) {
    const { top10 } = game;

    reply(`北京富人榜前十名如下：
${top10.map((u, index) => `${index + 1}. ${u.name}: ${u.totalWealth} 元`).join('\n')}`);
  },
};

export default commandHandlers;
