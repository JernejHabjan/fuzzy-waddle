import type { AiRuntimeNavigationBoundary } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-navigation-boundary";

import { validateRuntimeNativeBoundary } from "./skirmish-ai-runtime-native-navigation-validation";

/** Validate capture-local counters before accepting even a failed or unbound native query. Legacy omission is a gap. */
export function validateRuntimeNavigationBoundary(
  value: AiRuntimeNavigationBoundary | undefined,
  previous: AiRuntimeNavigationBoundary | undefined
): string[] {
  if (value === undefined) return [];
  if (value === null || typeof value !== "object") return ["production_spatial_navigation_boundary_invalid"];
  const counter = (number: number | null, minimum: number) =>
    number === null || (Number.isSafeInteger(number) && number >= minimum && number <= 8192);
  if (!counter(value.graphObservationId, 1) || !counter(value.updateRequestCount, 0) ||
    (value.updateRequestCount === null && value.graphObservationId !== null)) {
    return ["production_spatial_navigation_boundary_invalid"];
  }
  if (previous && (
    (previous.updateRequestCount === null && value.updateRequestCount !== null) ||
    (previous.updateRequestCount !== null && value.updateRequestCount !== null &&
      value.updateRequestCount < previous.updateRequestCount) ||
    (previous.graphObservationId !== null && value.graphObservationId !== null &&
      value.graphObservationId < previous.graphObservationId)
  )) return ["production_spatial_navigation_counter_regressed"];
  return validateRuntimeNativeBoundary(value.native, previous?.native);
}

/** Equality is limited to two observed references/update counters; it supplies no freshness or complete history. */
export function projectRuntimeNavigationInterval(
  before: AiRuntimeNavigationBoundary | undefined,
  after: AiRuntimeNavigationBoundary | undefined
): "same_observed" | "changed" | "unavailable" {
  if (!before || !after || before.graphObservationId === null || after.graphObservationId === null ||
    before.updateRequestCount === null || after.updateRequestCount === null) return "unavailable";
  return before.graphObservationId === after.graphObservationId && before.updateRequestCount === after.updateRequestCount
    ? "same_observed" : "changed";
}
