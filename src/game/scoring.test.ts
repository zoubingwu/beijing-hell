import { describe, expect, it } from 'vitest';
import { DEFAULT_HIGH_SCORES } from './data/highScores';
import { fameLabel, insertScore, qualifyScore, wealthOf } from './scoring';
import type { HighScore } from './types';

const fixture: HighScore[] = [
  { id: 'default-1', name: '赖皮张', wealth: 12500720, health: 98, fameLabel: '争议人物' },
  { id: 'default-2', name: '萧峰', wealth: 830050, health: 100, fameLabel: '杰出青年' },
  { id: 'default-3', name: '二黑', wealth: 500447, health: 78, fameLabel: '德高望重' },
  { id: 'default-4', name: 'Andy Rocky', wealth: 239403, health: 97, fameLabel: '很差' },
  { id: 'default-5', name: 'li xing', wealth: 34900, health: 35, fameLabel: '江湖唾弃' },
  { id: 'default-6', name: 'li xing', wealth: 13400, health: 100, fameLabel: '江湖唾弃' },
  { id: 'default-7', name: 'li ', wealth: 2300, health: 77, fameLabel: '不佳' },
  { id: 'default-8', name: 'li ', wealth: 45, health: 12, fameLabel: '杰出青年' },
  { id: 'default-9', name: 'li', wealth: 34, health: 100, fameLabel: '一般般' },
  { id: 'default-10', name: 'li', wealth: 3, health: 100, fameLabel: '杰出青年' },
];
const score = (id: string, wealth: number): HighScore => ({ id, name: id, wealth, health: 50, fameLabel: '差' });

describe('scoring', () => {
  it('matches every default leaderboard object exactly', () => expect(DEFAULT_HIGH_SCORES).toEqual(fixture));
  it.each([-1, 0, 1, 2])('rejects nonpositive and below-tail wealth %s', (wealth) => expect(qualifyScore(wealth, DEFAULT_HIGH_SCORES)).toBe(false));
  it('accepts the exact default tail and all positive values for short or empty boards', () => {
    expect(qualifyScore(3, DEFAULT_HIGH_SCORES)).toBe(true);
    expect(qualifyScore(1, DEFAULT_HIGH_SCORES.slice(0, 9))).toBe(true);
    expect(qualifyScore(1, [])).toBe(true);
  });
  it('never qualifies nonpositive wealth on short or empty boards', () => {
    expect(qualifyScore(0, [])).toBe(false);
    expect(qualifyScore(-1, DEFAULT_HIGH_SCORES.slice(0, 2))).toBe(false);
  });
  it('inserts a score before an equal existing score', () => {
    const result = insertScore(DEFAULT_HIGH_SCORES, score('new', 2300));
    expect(result.map((entry) => entry.id)).toContain('new');
    expect(result.findIndex((entry) => entry.id === 'new')).toBe(6);
  });
  it('keeps fields co-located when inserting', () => {
    const result = insertScore(DEFAULT_HIGH_SCORES, { ...score('fields', 2300), name: '姓名', health: 7, fameLabel: '很差' });
    expect(result[6]).toMatchObject({ id: 'fields', name: '姓名', wealth: 2300, health: 7, fameLabel: '很差' });
  });
  it('truncates insertion to ten records', () => expect(insertScore(DEFAULT_HIGH_SCORES, score('top', 99999999))).toHaveLength(10));
  it('preserves unique input order for distinct scores', () => {
    const result = insertScore([score('a', 5), score('b', 4), score('c', 3)], score('d', 4));
    expect(result.map((entry) => entry.id)).toEqual(['a', 'd', 'b', 'c']);
  });
  it.each([
    [101, '德高望重'], [100, '德高望重'], [99, '杰出青年'], [90, '杰出青年'],
    [89, '一般般'], [80, '一般般'], [79, '不佳'], [60, '不佳'], [59, '争议人物'],
    [40, '争议人物'], [39, '差'], [20, '差'], [19, '江湖唾弃'], [10, '江湖唾弃'],
    [9, '江湖唾弃'], [0, '江湖唾弃'],
  ])('maps fame boundary %s', (fame, label) => expect(fameLabel(fame)).toBe(label));
  it('computes wealth as liquid assets less debt', () => expect(wealthOf(100, 25, 40)).toBe(85));
  it('does not mutate the source board', () => {
    const before = structuredClone(DEFAULT_HIGH_SCORES);
    insertScore(DEFAULT_HIGH_SCORES, score('copy', 1000000));
    expect(DEFAULT_HIGH_SCORES).toEqual(before);
  });
  it('retains all score fields in the resulting row', () => {
    const result = insertScore([], { id: 'x', name: 'X', wealth: 1, health: -5, fameLabel: '江湖唾弃', completedAt: 't' });
    expect(result[0]).toEqual({ id: 'x', name: 'X', wealth: 1, health: -5, fameLabel: '江湖唾弃', completedAt: 't' });
  });
});
