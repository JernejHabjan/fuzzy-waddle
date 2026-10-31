import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { evaluateRuntimePressureResponse } from "./skirmish-ai-runtime-pressure-evaluation";
import { evaluateRuntimeProductionPairs } from "./skirmish-ai-runtime-production-pair-evaluation";
import { evaluateExpansionPressurePairs } from "./skirmish-ai-expansion-pressure-pairs";
import { evaluateNativeScenarioPairs } from "./skirmish-ai-native-scenario-pairs";

export function evaluateScenario(
  scenarioId: string,
  fixture: RuntimeFixtureV1,
  variants: readonly RuntimeVariantResultV1[]
): string[] {
  const assertion = fixture.assertions[scenarioId];
  if (!assertion) return [`runtime_assertions_missing:${scenarioId}`];
  const applicableVariantIds = new Set(
    fixture.recipe.variants
      .filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
      .map((variant) => variant.id)
  );
  const selectedVariants = variants.filter((variant) => applicableVariantIds.has(variant.variantId));
  if (selectedVariants.length === 0) return [`runtime_variants_missing:${scenarioId}`];
  if (
    assertion.requiredEconomyContracts &&
    Object.keys(assertion.requiredEconomyContracts).some(
      (id) => !selectedVariants.some((variant) => variant.variantId === id)
    )
  )
    return [`required_economy_variant_missing:${scenarioId}`];
  if (
    assertion.requiredTechnologyContracts &&
    Object.keys(assertion.requiredTechnologyContracts).some(
      (id) => !selectedVariants.some((variant) => variant.variantId === id)
    )
  )
    return [`required_technology_variant_missing:${scenarioId}`];
  const failures = evaluateRuntimeProductionPairs(scenarioId, assertion, selectedVariants);
  failures.push(...evaluateNativeScenarioPairs(scenarioId, fixture, selectedVariants));
  if (scenarioId === "EXP-02") failures.push(...evaluateExpansionPressurePairs(fixture, selectedVariants));
  const actualFactions = [...new Set(selectedVariants.map((variant) => variant.aiFaction))].sort();
  const requiredFactions = [...assertion.requiredAiFactions].sort();
  if (JSON.stringify(actualFactions) !== JSON.stringify(requiredFactions)) failures.push("required_ai_factions");
  if (assertion.requireNoInitialWorker && !selectedVariants.some((variant) => variant.initialWorkerCount === 0)) {
    failures.push("no_no_worker_variant");
  }
  if (
    assertion.requireSupplyControl &&
    !["prebuild", "ample_control"].every((branch) =>
      selectedVariants.some((variant) => variant.supplyBranch === branch)
    )
  ) {
    failures.push("required_supply_branches_missing");
  }
  if (assertion.requirePressureResponse) {
    failures.push(...evaluateRuntimePressureResponse(selectedVariants));
  }
  if (
    assertion.requiredResourceService &&
    !["build", "served_control"].every((branch) =>
      selectedVariants.some((variant) => variant.resourceServiceBranch === branch)
    )
  ) {
    failures.push("required_resource_service_branches_missing");
  }
  if (assertion.requireHiddenStateParity) {
    const [left, right] = selectedVariants;
    if (!left || !right || selectedVariants.length !== 2 || left.initialWorldDigest === right.initialWorldDigest) {
      failures.push("hidden_state_world_pair_invalid");
    } else {
      const leftFirst = left.checkpoints[0];
      const rightFirst = right.checkpoints[0];
      if (JSON.stringify(leftFirst?.visibleEnemyFacts) !== JSON.stringify(rightFirst?.visibleEnemyFacts)) {
        failures.push("hidden_state_observation_leak");
      }
      if (
        assertion.requiredHiddenActorName &&
        [leftFirst, rightFirst].some((checkpoint) =>
          checkpoint?.visibleEnemyFacts.some((actor) => actor.objectName === assertion.requiredHiddenActorName)
        )
      ) {
        failures.push("hidden_state_actor_disclosed");
      }
      if (JSON.stringify(leftFirst?.decisionFacts) !== JSON.stringify(rightFirst?.decisionFacts)) {
        failures.push("hidden_state_decision_leak");
      }
      if (left.checkpoints.length !== right.checkpoints.length) failures.push("hidden_state_checkpoint_pair_missing");
      for (let index = 0; index < left.checkpoints.length; index++) {
        const a = left.checkpoints[index],
          b = right.checkpoints[index];
        if (!a || !b || a.targetTick !== b.targetTick) {
          failures.push("hidden_state_checkpoint_pair_missing");
          break;
        }
        // Once permitted contacts differ, different orders are legitimate. Hidden-world changes alone are not.
        if (JSON.stringify(a.visibleEnemyFacts) !== JSON.stringify(b.visibleEnemyFacts)) break;
        if (!a.permittedObservationDigest || !b.permittedObservationDigest)
          failures.push("hidden_state_observation_digest_missing");
        else if (a.permittedObservationDigest !== b.permittedObservationDigest) {
          failures.push("hidden_state_permitted_observation_mismatch");
          break;
        }
        if (!a.decisionIntents || !b.decisionIntents || a.decisionIntentsTruncated || b.decisionIntentsTruncated)
          failures.push("hidden_state_exact_decisions_missing");
        else if (JSON.stringify(a.decisionIntents) !== JSON.stringify(b.decisionIntents))
          failures.push("hidden_state_decision_leak");
      }
    }
  }
  const determinismGroups = new Map<string, RuntimeVariantResultV1[]>();
  for (const variant of selectedVariants) {
    if (!variant.determinismGroup) continue;
    determinismGroups.set(variant.determinismGroup, [
      ...(determinismGroups.get(variant.determinismGroup) ?? []),
      variant
    ]);
  }
  for (const [group, repetitions] of determinismGroups) {
    if (repetitions.length < 2) failures.push(`determinism_repetition_missing:${group}`);
    if (new Set(repetitions.map((variant) => variant.initialWorldDigest)).size > 1) {
      failures.push(`determinism_initial_world:${group}`);
    }
    const outcomeSignatures = repetitions.map((variant) =>
      JSON.stringify(
        evaluateRuntimeVariant(scenarioId, assertion, variant, fixture)
          .map((failure) => failure.slice(failure.indexOf(":") + 1))
          .sort()
      )
    );
    if (new Set(outcomeSignatures).size > 1) {
      failures.push(`determinism_outcome:${group}`);
    }
    if (new Set(repetitions.map((variant) => variant.outcomeDigest)).size > 1) {
      failures.push(`determinism_outcome_digest:${group}`);
    }
  }
  for (const variant of selectedVariants) {
    failures.push(...evaluateRuntimeVariant(scenarioId, assertion, variant, fixture));
  }
  return failures;
}
