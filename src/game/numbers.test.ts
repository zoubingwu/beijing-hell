import { describe, expect, it } from "vitest";
import {
  DOMAIN_MAX,
  saturatingAdd,
  saturatingMultiply,
  saturatingSignedAdd,
  saturatingSignedSubtract,
  saturatingSubtract,
  saturatingWealth,
  weightedAverage,
} from "./numbers";

describe("safe saturation arithmetic", () => {
  it("keeps ordinary nonnegative addition and subtraction unchanged", () => {
    expect(saturatingAdd(20, 30)).toBe(50);
    expect(saturatingSubtract(50, 30)).toBe(20);
  });

  it("saturates addition by threshold and subtraction at zero", () => {
    expect(saturatingAdd(DOMAIN_MAX - 1, 1)).toBe(DOMAIN_MAX);
    expect(saturatingAdd(DOMAIN_MAX - 1, 2)).toBe(DOMAIN_MAX);
    expect(saturatingSubtract(1, 2)).toBe(0);
  });

  it("keeps ordinary multiplication and saturates using the division threshold", () => {
    expect(saturatingMultiply(123, 45)).toBe(5_535);
    expect(saturatingMultiply(DOMAIN_MAX, 1)).toBe(DOMAIN_MAX);
    expect(saturatingMultiply(DOMAIN_MAX, 2)).toBe(DOMAIN_MAX);
    expect(saturatingMultiply(0, DOMAIN_MAX)).toBe(0);
  });

  it("saturates signed addition and subtraction in both directions", () => {
    expect(saturatingSignedAdd(20, -30)).toBe(-10);
    expect(saturatingSignedAdd(DOMAIN_MAX, 1)).toBe(DOMAIN_MAX);
    expect(saturatingSignedAdd(-DOMAIN_MAX, -1)).toBe(-DOMAIN_MAX);
    expect(saturatingSignedSubtract(-DOMAIN_MAX, 1)).toBe(-DOMAIN_MAX);
    expect(saturatingSignedSubtract(DOMAIN_MAX, -1)).toBe(DOMAIN_MAX);
  });

  it("computes wealth exactly before saturation", () => {
    expect(saturatingWealth(100, 25, 40)).toBe(85);
    expect(saturatingWealth(DOMAIN_MAX, DOMAIN_MAX, DOMAIN_MAX)).toBe(
      DOMAIN_MAX,
    );
    expect(saturatingWealth(0, 0, DOMAIN_MAX)).toBe(-DOMAIN_MAX);
  });

  it("computes an exact floored weighted average using BigInt intermediates", () => {
    expect(weightedAverage(100, 3, 201, 2)).toBe(140);
    const oldAverage = DOMAIN_MAX - 4;
    const newPrice = DOMAIN_MAX;
    const expected = Number(
      (BigInt(oldAverage) * BigInt(DOMAIN_MAX - 1) + BigInt(newPrice)) /
        BigInt(DOMAIN_MAX),
    );
    expect(
      weightedAverage(oldAverage, DOMAIN_MAX - 1, newPrice, 1),
    ).toBe(expected);
  });
});
