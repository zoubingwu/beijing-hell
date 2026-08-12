import { describe, expect, it } from "vitest";
import { selectDayNumber } from "./selectors";
import { createNewGameState } from "./gameSlice";
import type { GameRuntime } from "./runtime";

const runtime: GameRuntime = {
  nextInt: (max) => max - 1,
  now: () => "now",
  createId: () => "id",
};

describe("selectors", () => {
  it("clamps day number to total days when no turns remain", () => {
    const game = { ...createNewGameState(runtime), remainingTurns: 0 };
    expect(selectDayNumber({ game })).toBe(40);
  });
});
