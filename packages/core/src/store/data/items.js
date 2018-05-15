/**
 * The final price is the combination of basePrice, random(extraPrice) and event effects.
 */
export default [
  {
    id: 1,
    name: '盗版VCD、游戏',
    desc: '优点是价格便宜，游戏开始时容易进货，缺点是每笔交易您赚的钱数目不大。',
    basePrice: 5,
    extraPrice: 50,
  },
  {
    id: 2,
    name: '进口香烟',
    desc: '优点是价格适中，当您有了一定积累时，可以倒卖它来进一步发家。',
    basePrice: 100,
    extraPrice: 350,
  },
  {
    id: 3,
    name: '伪劣化妆品',
    desc: '价格适中,但是有时会发生随机事件，让您猛发一把。',
    basePrice: 65,
    extraPrice: 180,
  },
  {
    id: 4,
    name: '进口玩具',
    desc: '价格在400元左右，但是一些随机事件会让它的价格变动很大。',
    basePrice: 250,
    extraPrice: 600,
  },
  {
    id: 5,
    name: '假白酒(剧毒！)',
    desc: '是一种危害社会的有剧毒的商品，平均价格在1,500左右,倒卖它让您有剧富的可能，但是 您会感到良心愧疚，您的名声也会迅速降低。',
    basePrice: 1000,
    extraPrice: 2500,
  },
  {
    id: 6,
    name: '水货手机',
    desc: '平均价格1,000元，首都高校大学生找工作时，它的价格可能猛升到8,000元。',
    basePrice: 750,
    extraPrice: 750,
  },
  {
    id: 7,
    name: '《上海小宝贝》(禁书)',
    desc: '据说是美女作家用身体写的作品，国家二级禁书。平均价格7,500元。倒卖它，有可能发大财，但是您的名声会变坏。',
    basePrice: 5000,
    extraPrice: 9000,
  },
  {
    id: 8,
    name: '走私汽车',
    desc: '平均价格20,000元。这是所有物品中价格波动最大的，有些随机事件会让它涨8倍。 走私汽车是发大财的理想倒卖物品，但是风险也很大。',
    basePrice: 15000,
    extraPrice: 15000,
  },
];
