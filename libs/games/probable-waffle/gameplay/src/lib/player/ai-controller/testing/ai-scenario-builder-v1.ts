import { canonicalizeAiBrainStateV1, canonicalizeAiObservationV1 } from "../brain/canonical-ai-serialization";
import type { AiScenarioAssertionV1, AiScenarioV1 } from "./ai-scenario-v1";

/** Copies and canonicalizes fixture input so a test cannot mutate a later repetition. */
export function buildAiScenarioV1(input: AiScenarioV1): AiScenarioV1 {
  if (input.schemaVersion !== 1) throw new Error("unsupported_ai_scenario_version");
  if (!/^[A-Z]+-[0-9]{2}$/.test(input.scenarioId)) throw new Error("invalid_ai_scenario_id");
  if (
    !Number.isSafeInteger(input.seed) ||
    !Number.isSafeInteger(input.initialTick) ||
    !Number.isSafeInteger(input.maxTick) ||
    !Number.isSafeInteger(input.warmupTicks)
  ) {
    throw new Error("invalid_ai_scenario_number");
  }
  if (input.seed < 0 || input.initialTick < 0 || input.maxTick < input.initialTick || input.warmupTicks < 0) {
    throw new Error("invalid_ai_scenario_window");
  }
  if (
    input.drivers.length === 0 ||
    input.frames.length === 0 ||
    input.expectedBranches.length === 0 ||
    input.nonVacuity.length === 0 ||
    input.expectedBranches.some((branch) => branch.assertions.length === 0 && branch.forbidden.length === 0)
  ) {
    throw new Error("vacuous_ai_scenario");
  }
  for (const assertion of [
    ...input.nonVacuity,
    ...input.expectedBranches.flatMap((branch) => [...branch.assertions, ...branch.forbidden])
  ]) {
    assertValidAssertion(assertion);
  }
  if (
    input.pairing.groupId.length === 0 ||
    input.pairing.variantId.length === 0 ||
    input.pairing.counterpartVariantIds.length === 0 ||
    input.pairing.counterpartVariantIds.includes(input.pairing.variantId)
  ) {
    throw new Error("invalid_ai_scenario_pairing");
  }
  const frames = [...input.frames]
    .map((frame) => ({
      observation: canonicalizeAiObservationV1(frame.observation),
      outcomes: [...frame.outcomes].sort(
        (left, right) =>
          left.identity.authorityEpoch - right.identity.authorityEpoch ||
          left.identity.sequence - right.identity.sequence ||
          left.kind.localeCompare(right.kind)
      )
    }))
    .sort((left, right) => left.observation.tick - right.observation.tick);
  if (frames.some((frame) => frame.observation.tick < input.initialTick || frame.observation.tick > input.maxTick)) {
    throw new Error("ai_scenario_frame_outside_window");
  }
  return {
    ...input,
    requirementTags: [...new Set(input.requirementTags)].sort(),
    owningStages: [...new Set(input.owningStages)].sort((left, right) => left - right),
    drivers: [...new Set(input.drivers)].sort(),
    catalogIds: [...new Set(input.catalogIds)].sort(),
    pairing: {
      ...input.pairing,
      counterpartVariantIds: [...new Set(input.pairing.counterpartVariantIds)].sort()
    },
    initialState: canonicalizeAiBrainStateV1(input.initialState),
    frames,
    expectedBranches: [...input.expectedBranches]
      .map((branch) => ({ ...branch, assertions: [...branch.assertions], forbidden: [...branch.forbidden] }))
      .sort((left, right) => left.branchId.localeCompare(right.branchId)),
    nonVacuity: [...input.nonVacuity]
  };
}

function assertValidAssertion(assertion: AiScenarioAssertionV1): void {
  if ("minimum" in assertion || "maximum" in assertion) {
    const minimum = "minimum" in assertion ? assertion.minimum : 0;
    const maximum = assertion.maximum;
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 0 || maximum < minimum) {
      throw new Error(`invalid_ai_assertion_band:${assertion.kind}`);
    }
  }
  if (
    assertion.kind === "command_applied" &&
    (!Number.isSafeInteger(assertion.deadlineTick) || assertion.deadlineTick < 0)
  ) {
    throw new Error("invalid_ai_assertion_deadline");
  }
}

/** Validates reciprocal fixture-authored subject/control metadata without consulting candidate output. */
export function assertPairedAiScenariosV1(leftInput: AiScenarioV1, rightInput: AiScenarioV1): void {
  const left = buildAiScenarioV1(leftInput);
  const right = buildAiScenarioV1(rightInput);
  if (
    left.pairing.groupId !== right.pairing.groupId ||
    left.pairing.variantId === right.pairing.variantId ||
    left.pairing.role === right.pairing.role ||
    !left.pairing.counterpartVariantIds.includes(right.pairing.variantId) ||
    !right.pairing.counterpartVariantIds.includes(left.pairing.variantId)
  ) {
    throw new Error("ai_scenario_pair_mismatch");
  }
}
