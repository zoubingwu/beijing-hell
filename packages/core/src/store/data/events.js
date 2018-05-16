export const MARKET_EVENTS = [
  {
    desc: '专家提议提高大学生“动手素质”。（玩具价格飞涨！）',
    relatedItem: 4,
    factor: 2,
  },
  {
    desc: '有人说：生病不用打针吃药，喝假白酒（剧毒）就可以！（假白酒价格暴涨）',
    relatedItem: 5,
    factor: 3,
  },
  {
    desc: '医院的秘密报告：“《上海小宝贝》功效甚过伟哥”！（禁书已经卖疯啦）',
    relatedItem: 7,
    factor: 4,
  },
  {
    desc: '文盲说：“2000年诺贝尔文学奖？呸！不如盗版VCD港台片。”（VCD 风靡市场）',
    relatedItem: 1,
    factor: 4,
  },
  {
    desc: '《北京经济小报》社论：“走私汽车大力推进汽车消费!”（汽车价格暴增）',
    relatedItem: 8,
    factor: 3,
  },
  {
    desc: '《北京真理报》社论：“提倡爱美，落到实处”（化妆品价格开始走高）',
    relatedItem: 3,
    factor: 4,
  },
  {
    desc: '8858.com电子书店也不敢卖《上海小宝贝》（禁书疯狂涨价）',
    relatedItem: 7,
    factor: 8,
  },
  {
    desc: '谢不疯在晚会上说：“我酷!我使用伪劣化妆品!”（化妆品价格暴涨）',
    relatedItem: 3,
    factor: 7,
  },
  {
    desc: '北京有人狂饮山西假酒。（假酒开始风靡市场）',
    relatedItem: 5,
    factor: 7,
  },
  {
    desc: '北京的大学生们开始找工作（手机顿时供不应求）',
    relatedItem: 6,
    factor: 7,
  },
  {
    desc: '北京的富人疯狂地购买走私汽车！（走私汽车价格突破天际）',
    relatedItem: 8,
    factor: 7,
  },
  {
    desc: '市场上充斥着来自福建的走私香烟。（香烟价格暴跌）',
    relatedItem: 2,
    factor: 1 / 7,
  },
  {
    desc: '北京的孩子们都忙于上网学习，进口玩具没人愿意买。（玩具市场无人问津）',
    relatedItem: 4,
    factor: 1 / 7,
  },
  {
    desc: '“中国硅谷”——中关村全是卖盗版VCD的村姑（VCD 已经跌倒白菜价了）',
    relatedItem: 1,
    factor: 1 / 8,
  },
];

export const FREE_ITEMS_EVENTS = [
  {
    desc: '厦门的老同学资助俺两部走私汽车',
    relatedItem: 8,
    quantity: 2,
  },
  {
    desc: '工商局扫荡后，俺在黑暗角落里发现了老乡丢失的进口香烟',
    relatedItem: 2,
    quantity: 6,
  },
  {
    desc: '俺老乡回家前把一些假白酒（剧毒）给俺',
    relatedItem: 5,
    quantity: 7,
  },
];

export const CASH_EVENTS = [
  {
    desc: '俺怜悯扮演成乞丐的老太太们。（损失 10% 现金）',
    lossPercent: 10,
  },
  {
    desc: '一个汉子在街头拦住俺：“哥们，给点钱用!”（损失 10% 现金）',
    lossPercent: 10,
  },
  {
    desc: '一个大个子碰了俺一下，说：“别挤了!”（损失 40% 现金）',
    lossPercent: 40,
  },
  {
    desc: '三个带红袖章的老太太揪住俺：“你是外地人?罚款!”（损失 20% 现金）',
    lossPercent: 20,
  },
  {
    desc: '两个猛男揪住俺：“交市话费、长话附加费、上网费。”（损失 15% 现金）',
    lossPercent: 15,
  },
  {
    desc: '副主任严肃地说：“晚上别来我家给我送钱。”（损失 10% 现金）',
    lossPercent: 10,
  },
  {
    desc: '北京空气污染得厉害,俺去氧吧吸氧..（损失 5% 现金）',
    lossPercent: 5,
  },
];

export const HP_EVENTS = [
  {
    desc: '大街的两个流氓打了俺!（损失 3 点健康值）',
    loss: 3,
    freq: 117,
  },
  {
    desc: '俺在过街地道被人打了蒙棍!（损失 20 点健康值）',
    loss: 20,
    freq: 157,
  },
  {
    desc: '工商局的追俺超过三个胡同。（损失 5 点健康值）',
    loss: 5,
    freq: 21,
  },
  {
    desc: '北京拥挤的交通让俺心焦（损失 1 点健康值）',
    loss: 1,
    freq: 100,
  },
  {
    desc: '开小巴的打俺一耳光!（损失 1 点健康值）',
    loss: 1,
    freq: 35,
  },
  {
    desc: '一群民工打了俺!（损失 10 点健康值）',
    loss: 10,
    freq: 313,
  },
  {
    desc: '胡同的一个小青年砸俺一砖头（损失 5 点健康值）',
    loss: 5,
    freq: 120,
  },
  {
    desc: '两个假保安用电棍电击俺（损失 3 点健康值）',
    loss: 3,
    freq: 29,
  },
  {
    desc: '北京臭黑的小河熏着我了（损失 1 点健康值）',
    loss: 1,
    freq: 43,
  },
  {
    desc: '守自行车的王大婶嘲笑俺没北京户口（损失 1 点健康值）',
    loss: 1,
    freq: 45,
  },
  {
    desc: '北京高温40度（损失 1 点健康值）',
    loss: 1,
    freq: 48,
  },
  {
    desc: '申奥又添新风景，北京来了沙尘暴（损失 1 点健康值）',
    loss: 1,
    freq: 33,
  },
];
