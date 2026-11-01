import type { RuntimeAssertion } from "../evaluation/controls/skirmish-ai-runtime-assertion";
import type { RuntimeVariant } from "../setup/skirmish-ai-runtime-variant";

const monotonicAssertionKeys = new Set([
  "maximumTick", "minimumDecisions", "minimumAppliedCommands", "requiredAiFactions",
  "minimumMilitaryCount",
  "minimumMilitaryProducerCount", "requireCompositionDemand", "requireCapacityDemand",
  "minimumDamageDealt", "minimumEnemyLosses", "minimumOffensiveLaunchCount"
]);

/** Fail closed: an absence, deadline, lifecycle, terminal or temporal oracle must run its full observation horizon. */
export function isEvidenceStopSafe(assertion: RuntimeAssertion): boolean {
  return Object.keys(assertion).every((key) => monotonicAssertionKeys.has(key));
}

export function nextEvidenceStopState(input: {
  readonly config: RuntimeVariant["evidenceStop"];
  readonly role: RuntimeVariant["role"];
  readonly assertions: readonly RuntimeAssertion[];
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
