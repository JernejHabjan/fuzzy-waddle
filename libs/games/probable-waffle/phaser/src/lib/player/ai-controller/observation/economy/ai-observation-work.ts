const MAX_INVALIDATION_DEBT = 1024;

/** A stale asynchronous request may observe results but may never publish them. */
export function isCurrentObservationGeneration(requestedGeneration: number, candidateGeneration: number): boolean {
  return requestedGeneration === candidateGeneration;
}

/** Deterministic bounded round-robin selection for optional observation work. */
export function selectBoundedObservationWork<T>(
  candidates: readonly T[],
  continuationCursor: number,
  maximum: number
): { readonly selected: readonly T[]; readonly nextCursor: number } {
  if (candidates.length === 0 || maximum <= 0) return { selected: [], nextCursor: 0 };
  const start = Math.max(0, continuationCursor) % candidates.length;
  const selected = Array.from(
    { length: Math.min(maximum, candidates.length) },
    (_, index) => candidates[(start + index) % candidates.length]!
  );
  return { selected, nextCursor: (start + selected.length) % candidates.length };
}

/** Caps invalidation storms without discarding the saved fair-work cursor. */
export function accumulateObservationInvalidationDebt(currentDebt: number): number {
  return Math.min(MAX_INVALIDATION_DEBT, Math.max(0, currentDebt) + 1);
}
