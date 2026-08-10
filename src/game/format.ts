export const formatMoney = (value: number): string =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
