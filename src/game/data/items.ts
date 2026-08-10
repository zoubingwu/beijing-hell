import type { ItemDefinition } from '../types';

export const ITEMS: readonly ItemDefinition[] = [
  {
    id: 1,
    name: '盗版VCD、游戏',
    basePrice: 5,
    extraPrice: 50,
    description: '价格便宜，适合起步，但单笔利润有限。',
  },
  {
    id: 2,
    name: '进口香烟',
    basePrice: 100,
    extraPrice: 350,
    description: '价格适中，适合完成原始积累。',
  },
  {
    id: 3,
    name: '伪劣化妆品',
    basePrice: 65,
    extraPrice: 180,
    description: '价格适中，商业事件可能让它大涨。',
  },
  {
    id: 4,
    name: '进口玩具',
    basePrice: 250,
    extraPrice: 600,
    description: '波动很大，低价时值得关注。',
  },
  {
    id: 5,
    name: '假白酒(剧毒！)',
    basePrice: 1000,
    extraPrice: 2500,
    description: '高风险商品，价格波动猛烈。',
  },
  {
    id: 6,
    name: '水货手机',
    basePrice: 750,
    extraPrice: 750,
    description: '大学生求职潮来临时可能暴涨。',
  },
  {
    id: 7,
    name: '《上海小宝贝》(禁书)',
    basePrice: 5000,
    extraPrice: 9000,
    description: '昂贵且危险，但可能带来巨额利润。',
  },
  {
    id: 8,
    name: '走私汽车',
    basePrice: 15000,
    extraPrice: 15000,
    description: '价格波动最大，发财和破产都很快。',
  },
] as const;

export const ITEM_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));
