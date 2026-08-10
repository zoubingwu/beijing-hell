import type {
  CashEvent,
  FreeItemEvent,
  HealthEvent,
  MarketEvent,
  StoragePlan,
} from '../types';

export const MARKET_EVENTS: readonly MarketEvent[] = [
  { description: '专家提议提高大学生“动手素质”。（玩具价格飞涨！）', relatedItem: 4, factor: 2 },
  { description: '有人说：生病不用打针吃药，喝假白酒就可以！（假白酒价格暴涨）', relatedItem: 5, factor: 3 },
  { description: '医院的秘密报告：“《上海小宝贝》功效甚过伟哥”！（禁书卖疯了）', relatedItem: 7, factor: 4 },
  { description: '文盲说：“诺贝尔文学奖？呸！不如盗版VCD港台片。”（VCD风靡市场）', relatedItem: 1, factor: 4 },
  { description: '《北京经济小报》社论：“走私汽车大力推进汽车消费！”（汽车价格暴增）', relatedItem: 8, factor: 3 },
  { description: '《北京真理报》社论：“提倡爱美，落到实处。”（化妆品价格走高）', relatedItem: 3, factor: 4 },
  { description: '8858.com电子书店也不敢卖《上海小宝贝》。（禁书疯狂涨价）', relatedItem: 7, factor: 8 },
  { description: '谢不疯在晚会上说：“我酷！我使用伪劣化妆品！”（化妆品价格暴涨）', relatedItem: 3, factor: 7 },
  { description: '北京有人狂饮山西假酒。（假酒开始风靡市场）', relatedItem: 5, factor: 7 },
  { description: '北京的大学生们开始找工作。（手机顿时供不应求）', relatedItem: 6, factor: 7 },
  { description: '北京的富人疯狂购买走私汽车！（走私汽车价格突破天际）', relatedItem: 8, factor: 7 },
  { description: '市场上充斥着来自福建的走私香烟。（香烟价格暴跌）', relatedItem: 2, factor: 1 / 7 },
  { description: '北京的孩子们都忙于上网学习，进口玩具没人愿意买。（玩具滞销）', relatedItem: 4, factor: 1 / 7 },
  { description: '“中国硅谷”中关村全是卖盗版VCD的村姑。（VCD跌成白菜价）', relatedItem: 1, factor: 1 / 8 },
] as const;

export const FREE_ITEM_EVENTS: readonly FreeItemEvent[] = [
  { description: '厦门的老同学资助俺两部走私汽车。', relatedItem: 8, quantity: 2 },
  { description: '工商局扫荡后，俺在黑暗角落里发现了老乡丢失的进口香烟。', relatedItem: 2, quantity: 6 },
  { description: '俺老乡回家前把一些假白酒（剧毒）给俺。', relatedItem: 5, quantity: 7 },
] as const;

export const CASH_EVENTS: readonly CashEvent[] = [
  { description: '俺怜悯扮成乞丐的老太太们。（损失10%现金）', lossPercent: 10 },
  { description: '一个汉子在街头拦住俺：“哥们，给点钱用！”（损失10%现金）', lossPercent: 10 },
  { description: '一个大个子碰了俺一下，说：“别挤了！”（损失40%现金）', lossPercent: 40 },
  { description: '三个带红袖章的老太太揪住俺：“你是外地人？罚款！”（损失20%现金）', lossPercent: 20 },
  { description: '两个猛男揪住俺：“交市话费、长话附加费、上网费。”（损失15%现金）', lossPercent: 15 },
  { description: '副主任严肃地说：“晚上别来我家给我送钱。”（损失10%现金）', lossPercent: 10 },
  { description: '北京空气污染得厉害，俺去氧吧吸氧……（损失5%现金）', lossPercent: 5 },
] as const;

export const HEALTH_EVENTS: readonly HealthEvent[] = [
  { description: '大街的两个流氓打了俺！（损失3点健康值）', loss: 3, frequency: 117 },
  { description: '俺在过街地道被人打了蒙棍！（损失20点健康值）', loss: 20, frequency: 157 },
  { description: '工商局追俺超过三个胡同。（损失5点健康值）', loss: 5, frequency: 21 },
  { description: '北京拥挤的交通让俺心焦。（损失1点健康值）', loss: 1, frequency: 100 },
  { description: '开小巴的打俺一耳光！（损失1点健康值）', loss: 1, frequency: 35 },
  { description: '一群民工打了俺！（损失10点健康值）', loss: 10, frequency: 313 },
  { description: '胡同的一个小青年砸俺一砖头。（损失5点健康值）', loss: 5, frequency: 120 },
  { description: '两个假保安用电棍电击俺。（损失3点健康值）', loss: 3, frequency: 29 },
  { description: '北京臭黑的小河熏着俺了。（损失1点健康值）', loss: 1, frequency: 43 },
  { description: '守自行车的王大婶嘲笑俺没北京户口。（损失1点健康值）', loss: 1, frequency: 45 },
  { description: '北京高温40度。（损失1点健康值）', loss: 1, frequency: 48 },
  { description: '申奥又添新风景，北京来了沙尘暴。（损失1点健康值）', loss: 1, frequency: 33 },
] as const;

export const STORAGE_PLANS: readonly StoragePlan[] = [
  { capacity: 200, price: 20_000, label: '普通一居室' },
  { capacity: 350, price: 60_000, label: '宽敞两居室' },
  { capacity: 600, price: 160_000, label: '豪华三居室' },
  { capacity: 1000, price: 420_000, label: '仓库级地下室' },
] as const;

export const NEWS_HEADLINES = [
  '进口玩具电子商务网站在北京开通',
  '首都20万师生联合签名支持申奥',
  '《北京真理报》：今天又是充满希望的一天',
  '专家建议市民理性消费、低买高卖',
  '北京地铁各黑市价格今日波动剧烈',
  '中关村今日盗版VCD供应充足',
] as const;
