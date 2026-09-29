import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";

const monotonicAssertionKeys = new Set([
  "maximumTick", "minimumDecisions", "minimumAppliedCommands", "requiredAiFactions",
  "minimumMilitaryCount", "minimumMilitaryTypeCount", "minimumRepeatedMilitaryTypeCount",
  "minimumMilitaryProducerCount", "requireCompositionDemand", "requireCapacityDemand",
  "minimumDamageDealt", "minimumEnemyLosses", "minimumOffensiveLaunchCount"
]);

/** Fail closed: an absence, deadline, lifecycle, terminal or temporal oracle must run its full observation horizon. */
export function isEvidenceStopSafe(assertion: RuntimeAssertionV1): boolean {
  return Object.keys(assertion).every((key) => monotonicAssertionKeys.has(key));
}

export function nextEvidenceStopState(input: {
  readonly config: RuntimeVariantV1["evidenceStop"];
  readonly role: RuntimeVariantV1["role"];
  readonly assertions: readonly RuntimeAssertionV1[];
  readonly tick: number;
  readonly pendingEventTicks: readonly number[];
  readonly allPredicatesSatisfied: boolean;
  readonly satisfiedSinceTick: number | null;
}): { readonly satisfiedSinceTick: number | null; readonly stop: boolean } {
  const { config, role, assertions, tick, pendingEventTicks, allPredicatesSatisfied, satisfiedSinceTick } = input;
  if (!config || role === "control" || assertions.length === 0 || !assertions.every(isEvidenceStopSafe)) {
    return { satisfiedSinceTick: null, stop: false };
  }
  if (pendingEventTicks.some((eventTick) => eventTick > tick) || !allPredicatesSatisfied || tick < config.earliestTick) {
    return { satisfiedSinceTick: null, stop: false };
  }
  const since = satisfiedSinceTick ?? tick;
  return { satisfiedSinceTick: since, stop: tick - since >= config.stableForTicks };
}
