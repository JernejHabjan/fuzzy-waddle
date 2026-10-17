/** Conservative observed-history cap. Positive income never decreases after spending; this arithmetic grants no coverage authority. */
export function calculateRuntimeResourceContribution(input: {
  forecast: number; initialStock: number; reserved: number; obligations: number; positiveIncomeBefore: number;
  stockBefore: number; stockAfter: number; eligibleAmount: number;
}) {
  if (Object.values(input).some((value) => !Number.isFinite(value) || value < 0)) return null;
  const spendable = (stock: number) => Math.max(0, stock - input.reserved - input.obligations);
  const gross = Math.max(0, input.forecast - spendable(input.initialStock));
  const unresolvedBefore = Math.min(Math.max(0, gross - input.positiveIncomeBefore),
    Math.max(0, input.forecast - spendable(input.stockBefore)));
  const contribution = Math.min(input.eligibleAmount, unresolvedBefore,
    Math.max(0, spendable(input.stockAfter) - spendable(input.stockBefore)));
  return [gross, unresolvedBefore, contribution].every(Number.isFinite) ? { gross, unresolvedBefore, contribution } : null;
}
