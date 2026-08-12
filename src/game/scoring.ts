import type { FameLabel, HighScore } from './types';
import { saturatingWealth } from './numbers';

export type { FameLabel, PendingScore } from './types';

export const wealthOf = (cash: number, savings: number, debt: number) => saturatingWealth(cash, savings, debt);

/** Replicates the original C++ fame bug: 10..19 falls through to 江湖唾弃. */
export function fameLabel(fame: number): FameLabel {
  if (fame >= 100) return '德高望重';
  if (fame >= 90) return '杰出青年';
  if (fame >= 80) return '一般般';
  if (fame >= 60) return '不佳';
  if (fame >= 40) return '争议人物';
  if (fame >= 20) return '差';
  if (fame < 10) return '江湖唾弃';
  return '江湖唾弃';
}

export function qualifyScore(wealth: number, scores: readonly HighScore[]): boolean {
  return wealth > 0 && (scores.length < 10 || wealth >= scores[9].wealth);
}

export function insertScore(scores: readonly HighScore[], score: HighScore): HighScore[] {
  return [...scores, score]
    .sort((a, b) => {
      if (a.wealth !== b.wealth) return a.wealth < b.wealth ? 1 : -1;
      return a === score ? -1 : b === score ? 1 : 0;
    })
    .slice(0, 10);
}
