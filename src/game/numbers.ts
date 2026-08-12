/** Exact arithmetic helpers for the safe-integer gameplay domain. */
export const DOMAIN_MIN = 0;
export const DOMAIN_MAX = Number.MAX_SAFE_INTEGER;
export const SIGNED_DOMAIN_MIN = -DOMAIN_MAX;

export const isDomainInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);

/** Adds nonnegative balances without first performing an unsafe addition. */
export function saturatingAdd(a: number, b: number): number {
  if (a > DOMAIN_MAX - b) return DOMAIN_MAX;
  return a + b;
}

/** Subtracts nonnegative balances and clamps the result at zero. */
export function saturatingSubtract(a: number, b: number): number {
  return b >= a ? DOMAIN_MIN : a - b;
}

/** Multiplies nonnegative safe integers without first overflowing the domain. */
export function saturatingMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return DOMAIN_MIN;
  if (a > Math.floor(DOMAIN_MAX / b)) return DOMAIN_MAX;
  return a * b;
}

/** Adds signed safe integers and clamps to the symmetric safe-integer domain. */
export function saturatingSignedAdd(a: number, b: number): number {
  if (b > 0 && a > DOMAIN_MAX - b) return DOMAIN_MAX;
  if (b < 0 && a < SIGNED_DOMAIN_MIN - b) return SIGNED_DOMAIN_MIN;
  return a + b;
}

/** Subtracts signed safe integers and clamps to the symmetric safe-integer domain. */
export function saturatingSignedSubtract(a: number, b: number): number {
  if (b < 0 && a > DOMAIN_MAX + b) return DOMAIN_MAX;
  if (b > 0 && a < SIGNED_DOMAIN_MIN + b) return SIGNED_DOMAIN_MIN;
  return a - b;
}

const clampBigIntToNumber = (value: bigint): number => {
  const maximum = BigInt(DOMAIN_MAX);
  if (value > maximum) return DOMAIN_MAX;
  if (value < -maximum) return SIGNED_DOMAIN_MIN;
  return Number(value);
};

/** Computes cash + savings - debt exactly before applying the domain bounds. */
export function saturatingWealth(
  cash: number,
  savings: number,
  debt: number,
): number {
  return clampBigIntToNumber(BigInt(cash) + BigInt(savings) - BigInt(debt));
}

/** Computes the exact floored weighted average without unsafe intermediates. */
export function weightedAverage(
  oldAverage: number,
  oldQuantity: number,
  newUnitPrice: number,
  newQuantity: number,
): number {
  const totalQuantity = BigInt(oldQuantity) + BigInt(newQuantity);
  if (totalQuantity === 0n) return 0;
  const totalCost =
    BigInt(oldAverage) * BigInt(oldQuantity) +
    BigInt(newUnitPrice) * BigInt(newQuantity);
  return Number(totalCost / totalQuantity);
}
