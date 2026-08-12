export interface GameRuntime {
  nextInt(maxExclusive: number): number;
  now(): string;
  createId(): string;
}

export const gameRuntime: GameRuntime = {
  nextInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`随机整数上界必须是正整数，收到 ${maxExclusive}`);
    }
    const value = Math.floor(Math.random() * maxExclusive);
    if (!Number.isInteger(value) || value < 0 || value >= maxExclusive) {
      throw new Error(`随机整数 ${value} 超出 [0, ${maxExclusive}) 范围`);
    }
    return value;
  },
  now() {
    return new Date().toISOString();
  },
  createId() {
    return crypto.randomUUID();
  },
};
