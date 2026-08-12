import type { GameRuntime } from '../runtime';

export interface RandomTapeEntry {
  maxExclusive: number;
  value: number;
}

export interface RandomTape extends Pick<GameRuntime, 'nextInt'> {
  readonly calls: number;
  assertConsumed(): void;
}

const assertValidMaxExclusive = (maxExclusive: number, label: string): void => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error(`${label}必须是正整数，收到 ${maxExclusive}`);
  }
};

export function createRandomTape(entries: readonly RandomTapeEntry[]): RandomTape {
  for (const [entryIndex, entry] of entries.entries()) {
    assertValidMaxExclusive(entry.maxExclusive, `随机带第 ${entryIndex + 1} 项的上界`);
  }
  let index = 0;

  return {
    get calls() { return index; },
    nextInt(maxExclusive) {
      assertValidMaxExclusive(maxExclusive, '随机带实际上界');
      const entry = entries[index];
      if (!entry) {
        throw new Error(
          `随机带已耗尽：第 ${index + 1} 次调用收到上界 ${maxExclusive}`,
        );
      }
      if (entry.maxExclusive !== maxExclusive) {
        throw new Error(
          `随机带上界不匹配：第 ${index + 1} 项期望 ${entry.maxExclusive}，实际 ${maxExclusive}`,
        );
      }
      if (
        !Number.isInteger(entry.value) ||
        entry.value < 0 ||
        entry.value >= maxExclusive
      ) {
        throw new Error(
          `随机带值越界：第 ${index + 1} 项的值 ${entry.value} 不在 [0, ${maxExclusive}) 范围内`,
        );
      }
      index += 1;
      return entry.value;
    },
    assertConsumed() {
      const remaining = entries.length - index;
      if (remaining !== 0) {
        throw new Error(`随机带仍有 ${remaining} 项未消费（已消费 ${index}/${entries.length}）`);
      }
    },
  };
}
