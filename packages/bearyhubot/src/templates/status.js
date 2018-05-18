export const STATUS_TEMPLATE = `============================================
当前时间：___CURRENT_TIME___
当前位置：___CURRENT_LOCATION___

我要去：___ALL_LOCATIONS___
============================================
我的健康值：___HP___
现金：___CASH___
银行存款：___SAVINGS___
负债：___DEBT___
============================================
黑市：
___BLACK_MARKET_PRICE___
============================================
我的出租屋（___OWN_STORAGE___）：
___OWN_GOODS___
============================================
`;

export const getStatusTemplate = ({
  time,
  location,
  cash,
  savings,
  market,
  storage,
  hp,
  debt,
  goods,
  allLocations,
} = {}) =>
  STATUS_TEMPLATE.replace('___CURRENT_TIME___', time)
    .replace('___CURRENT_LOCATION___', location)
    .replace('___CASH___', cash)
    .replace('___SAVINGS___', savings)
    .replace('___BLACK_MARKET_PRICE___', market)
    .replace('___OWN_STORAGE___', storage)
    .replace('___HP___', hp)
    .replace('___DEBT___', debt)
    .replace('___OWN_GOODS___', goods)
    .replace('___ALL_LOCATIONS___', allLocations);
