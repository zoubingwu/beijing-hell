import type {
  CashEvent,
  FreeItemEvent,
  HealthEvent,
  MarketEvent,
  MarketEventDefinition,
  StoragePlan,
} from "../types";

export const MARKET_EVENT_DEFINITIONS: readonly MarketEventDefinition[] = [
  {
    frequency: 170,
    description: "专家提议提高大学生“动手素质”，进口玩具颇受欢迎!",
    effect: { kind: "multiply", itemId: 4, value: 2 },
  },
  {
    frequency: 139,
    description: "有人自豪地说：生病不用打针吃药，喝假白酒（剧毒）就可以!",
    effect: { kind: "multiply", itemId: 5, value: 3 },
  },
  {
    frequency: 100,
    description: "医院的秘密报告：“《上海小宝贝》功效甚过伟哥”!",
    effect: { kind: "multiply", itemId: 7, value: 5 },
  },
  {
    frequency: 41,
    description: "文盲说：“2000年诺贝尔文学奖？呸！不如盗版VCD港台片。”",
    effect: { kind: "multiply", itemId: 1, value: 4 },
  },
  {
    frequency: 37,
    description: "《北京经济小报》社论：“走私汽车大力推进汽车消费!”",
    effect: { kind: "multiply", itemId: 8, value: 3 },
  },
  {
    frequency: 23,
    description:
      "《北京真理报》社论：“提倡爱美，落到实处”，伪劣化妆品大受欢迎!",
    effect: { kind: "multiply", itemId: 3, value: 4 },
  },
  {
    frequency: 37,
    description: "8858.com电子书店也不敢卖《上海小宝贝》，黑市一册可卖天价!",
    effect: { kind: "multiply", itemId: 7, value: 8 },
  },
  {
    frequency: 15,
    description:
      "谢不疯在晚会上说：“我酷!我使用伪劣化妆品!”，伪劣化妆品供不应求!",
    effect: { kind: "multiply", itemId: 3, value: 7 },
  },
  {
    frequency: 40,
    description: "北京有人狂饮山西假酒，可以卖出天价!",
    effect: { kind: "multiply", itemId: 5, value: 7 },
  },
  {
    frequency: 29,
    description: "北京的大学生们开始找工作，水货手机大受欢迎！!",
    effect: { kind: "multiply", itemId: 6, value: 7 },
  },
  {
    frequency: 35,
    description: "北京的富人疯狂地购买走私汽车！价格狂升!",
    effect: { kind: "multiply", itemId: 8, value: 8 },
  },
  {
    frequency: 17,
    description: "市场上充斥着来自福建的走私香烟!",
    effect: { kind: "divide", itemId: 2, value: 8 },
  },
  {
    frequency: 24,
    description: "北京的孩子们都忙于上网学习，进口玩具没人愿意买。",
    effect: { kind: "divide", itemId: 4, value: 5 },
  },
  {
    frequency: 18,
    description: "盗版业十分兴旺，“中国硅谷”——中关村全是卖盗版VCD的村姑!",
    effect: { kind: "divide", itemId: 1, value: 8 },
  },
  {
    frequency: 160,
    description: "厦门的老同学资助俺两部走私汽车！发了！！",
    effect: { kind: "gift", itemId: 8, quantity: 2 },
  },
  {
    frequency: 45,
    description: "工商局扫荡后，俺在黑暗角落里发现了老乡丢失的进口香烟。",
    effect: { kind: "gift", itemId: 2, quantity: 6 },
  },
  {
    frequency: 35,
    description: "俺老乡回家前把一些山西假白酒（剧毒）给俺!",
    effect: { kind: "gift", itemId: 5, quantity: 4 },
  },
  {
    frequency: 140,
    description:
      "媒体报道：又有日本出口到中国的产品出事了! 出事后日本人死不认帐,拒绝赔偿。村长得知此消息，托人把他用的水货手机（无任何厂商标识）硬卖给您，收您2500元。",
    effect: { kind: "gift", itemId: 6, quantity: 1, debtIncrease: 2500 },
  },
] as const;

export const FREE_ITEM_EVENTS: readonly FreeItemEvent[] = [
  {
    description: "厦门的老同学资助俺两部走私汽车。",
    relatedItem: 8,
    quantity: 2,
  },
  {
    description: "工商局扫荡后，俺在黑暗角落里发现了老乡丢失的进口香烟。",
    relatedItem: 2,
    quantity: 6,
  },
  {
    description: "俺老乡回家前把一些假白酒（剧毒）给俺。",
    relatedItem: 5,
    quantity: 4,
  },
] as const;

const isPriceEvent = (
  event: MarketEventDefinition,
): event is MarketEventDefinition & {
  effect: Extract<MarketEventDefinition["effect"], { kind: "multiply" | "divide" }>;
} => event.effect.kind === "multiply" || event.effect.kind === "divide";

/** Legacy UI payload: gifts are resolved by the Plan 002 resolver, not this adapter. */
export const MARKET_EVENTS: readonly MarketEvent[] = MARKET_EVENT_DEFINITIONS
  .filter(isPriceEvent)
  .map((event) => {
    const effect = event.effect;
    return {
      description: event.description,
      relatedItem: effect.itemId,
      factor: effect.kind === "multiply" ? effect.value : 1 / effect.value,
    };
  });

export const CASH_EVENTS: readonly CashEvent[] = [
  {
    description: "俺怜悯地铁口扮演成乞丐的老太太。",
    lossPercent: 10,
    frequency: 60,
    target: "cash",
  },
  {
    description: "一个汉子在街头拦住俺：“哥们，给点钱用!”。",
    lossPercent: 10,
    frequency: 125,
    target: "cash",
  },
  {
    description: "一个大个子碰了俺一下，说：“别挤了!”。",
    lossPercent: 40,
    frequency: 100,
    target: "cash",
  },
  {
    description: "三个带红袖章的老太太揪住俺：“你是外地人?罚款!”",
    lossPercent: 20,
    frequency: 65,
    target: "cash",
  },
  {
    description: "两个猛男揪住俺：“交长话附加费、上网费。”",
    lossPercent: 15,
    frequency: 35,
    target: "savings",
  },
  {
    description: "副主任说：“办经商证?晚上不要去我家给我送钱哦。”",
    lossPercent: 10,
    frequency: 27,
    target: "savings",
  },
  {
    description: "北京空气污染得厉害,俺去氧吧吸氧...",
    lossPercent: 5,
    frequency: 40,
    target: "cash",
  },
] as const;

export const HEALTH_EVENTS: readonly HealthEvent[] = [
  { description: "大街上两个流氓打了俺!", loss: 3, frequency: 117 },
  { description: "俺在过街地道被人打了蒙棍! ", loss: 20, frequency: 157 },
  { description: "工商局的追俺超过三个胡同。 ", loss: 1, frequency: 21 },
  { description: "北京拥挤的交通让俺心焦! ", loss: 1, frequency: 100 },
  { description: "开小巴的打俺一耳光!", loss: 1, frequency: 35 },
  { description: "一群民工打了俺!", loss: 10, frequency: 313 },
  { description: "附近胡同的一个小青年砸俺一砖头!", loss: 5, frequency: 120 },
  { description: "附近写字楼一个假保安用电棍电击俺!", loss: 3, frequency: 29 },
  { description: "北京臭黑的小河熏着我了! ", loss: 1, frequency: 43 },
  { description: "守自行车的王大婶嘲笑俺没北京户口!", loss: 1, frequency: 45 },
  { description: "北京高温40度!俺热...", loss: 1, frequency: 48 },
  { description: "申奥添了新风景，北京又来沙尘暴!", loss: 1, frequency: 33 },
] as const;

export const STORAGE_PLANS: readonly StoragePlan[] = [
  { capacity: 200, price: 20_000, label: "普通一居室" },
  { capacity: 350, price: 60_000, label: "宽敞两居室" },
  { capacity: 600, price: 160_000, label: "豪华三居室" },
  { capacity: 1000, price: 420_000, label: "仓库级地下室" },
] as const;

export const NEWS_HEADLINES = [
  "进口玩具电子商务网站在北京开通",
  "首都20万师生联合签名支持申奥",
  "《北京真理报》：今天又是充满希望的一天",
  "专家建议市民理性消费、低买高卖",
  "北京地铁各黑市价格今日波动剧烈",
  "中关村今日盗版VCD供应充足",
] as const;
