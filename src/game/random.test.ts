import { describe, expect, it } from "vitest";
import {
  CASH_EVENTS,
  HEALTH_EVENTS,
  MARKET_EVENT_DEFINITIONS,
} from "./data/events";
import { createMarket } from "./random";
import { createRandomTape } from "./test/randomTape";

describe("Plan 002 random tables", () => {
  it("asserts all 18 market rows and exact descriptions", () => {
    expect(MARKET_EVENT_DEFINITIONS).toHaveLength(18);
    expect(MARKET_EVENT_DEFINITIONS.map(({ frequency, effect }) => [
      frequency,
      effect.kind,
      effect.itemId,
      "value" in effect ? effect.value : effect.quantity,
      effect.kind === "gift" ? effect.debtIncrease ?? 0 : 0,
    ])).toEqual([
      [170, "multiply", 4, 2, 0],
      [139, "multiply", 5, 3, 0],
      [100, "multiply", 7, 5, 0],
      [41, "multiply", 1, 4, 0],
      [37, "multiply", 8, 3, 0],
      [23, "multiply", 3, 4, 0],
      [37, "multiply", 7, 8, 0],
      [15, "multiply", 3, 7, 0],
      [40, "multiply", 5, 7, 0],
      [29, "multiply", 6, 7, 0],
      [35, "multiply", 8, 8, 0],
      [17, "divide", 2, 8, 0],
      [24, "divide", 4, 5, 0],
      [18, "divide", 1, 8, 0],
      [160, "gift", 8, 2, 0],
      [45, "gift", 2, 6, 0],
      [35, "gift", 5, 4, 0],
      [140, "gift", 6, 1, 2500],
    ]);
    expect(MARKET_EVENT_DEFINITIONS.map((event) => event.description)).toEqual([
      "专家提议提高大学生“动手素质”，进口玩具颇受欢迎!",
      "有人自豪地说：生病不用打针吃药，喝假白酒（剧毒）就可以!",
      "医院的秘密报告：“《上海小宝贝》功效甚过伟哥”!",
      "文盲说：“2000年诺贝尔文学奖？呸！不如盗版VCD港台片。”",
      "《北京经济小报》社论：“走私汽车大力推进汽车消费!”",
      "《北京真理报》社论：“提倡爱美，落到实处”，伪劣化妆品大受欢迎!",
      "8858.com电子书店也不敢卖《上海小宝贝》，黑市一册可卖天价!",
      "谢不疯在晚会上说：“我酷!我使用伪劣化妆品!”，伪劣化妆品供不应求!",
      "北京有人狂饮山西假酒，可以卖出天价!",
      "北京的大学生们开始找工作，水货手机大受欢迎！!",
      "北京的富人疯狂地购买走私汽车！价格狂升!",
      "市场上充斥着来自福建的走私香烟!",
      "北京的孩子们都忙于上网学习，进口玩具没人愿意买。",
      "盗版业十分兴旺，“中国硅谷”——中关村全是卖盗版VCD的村姑!",
      "厦门的老同学资助俺两部走私汽车！发了！！",
      "工商局扫荡后，俺在黑暗角落里发现了老乡丢失的进口香烟。",
      "俺老乡回家前把一些山西假白酒（剧毒）给俺!",
      "媒体报道：又有日本出口到中国的产品出事了! 出事后日本人死不认帐,拒绝赔偿。村长得知此消息，托人把他用的水货手机（无任何厂商标识）硬卖给您，收您2500元。",
    ]);
  });

  it("asserts health and cash rows", () => {
    expect(HEALTH_EVENTS.map(({ frequency, loss }) => [frequency, loss]))
      .toEqual([
        [117, 3],
        [157, 20],
        [21, 1],
        [100, 1],
        [35, 1],
        [313, 10],
        [120, 5],
        [29, 3],
        [43, 1],
        [45, 1],
        [48, 1],
        [33, 1],
      ]);
    expect(
      CASH_EVENTS.map((
        { frequency, lossPercent, target },
      ) => [frequency, lossPercent, target]),
    ).toEqual([
      [60, 10, "cash"],
      [125, 10, "cash"],
      [100, 40, "cash"],
      [65, 20, "cash"],
      [35, 15, "savings"],
      [27, 10, "savings"],
      [40, 5, "cash"],
    ]);
  });

  const prices = (soldValues: number[]) =>
    createRandomTape([
      { maxExclusive: 350, value: 1 },
      { maxExclusive: 15000, value: 2 },
      { maxExclusive: 50, value: 3 },
      { maxExclusive: 2500, value: 4 },
      { maxExclusive: 9000, value: 5 },
      { maxExclusive: 600, value: 6 },
      { maxExclusive: 750, value: 7 },
      { maxExclusive: 180, value: 8 },
      ...soldValues.map((value) => ({ maxExclusive: 8, value })),
    ]);

  it("returns exact prices with no sold-out items", () => {
    const tape = prices([]);
    expect(createMarket(0, tape).map(({ id, marketPrice }) => [id, marketPrice]))
      .toEqual([
        [1, 8],
        [2, 101],
        [3, 73],
        [4, 256],
        [5, 1004],
        [6, 757],
        [7, 5005],
        [8, 15002],
      ]);
    tape.assertConsumed();
  });

  it("makes one sold-out item for three identical indexes", () => {
    const tape = prices([2, 2, 2]);
    expect(createMarket(3, tape).filter((quote) => quote.marketPrice === 0))
      .toHaveLength(1);
    tape.assertConsumed();
  });

  it("makes two sold-out items for two repeated indexes", () => {
    const tape = prices([1, 1, 2]);
    expect(createMarket(3, tape).filter((quote) => quote.marketPrice === 0))
      .toHaveLength(2);
    tape.assertConsumed();
  });
});
