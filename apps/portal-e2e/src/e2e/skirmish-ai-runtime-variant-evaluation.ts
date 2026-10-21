import { isExpectedNativeMandatoryError } from "./skirmish-ai-native-fault-evaluation";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import { evaluateRuntimeRaidRecovery } from "./skirmish-ai-runtime-raid-evaluation";
import { evaluateRuntimeTransport } from "./skirmish-ai-runtime-transport-evaluation";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { last } from "./skirmish-ai-runtime-value";
import { evaluateRuntimePresetWorld } from "./skirmish-ai-runtime-preset-evaluation";
import {
  evaluateRuntimeSupplyControl,
  evaluateRuntimeSupplyPrebuild,
  evaluateRuntimeSupplyRecovery
} from "./skirmish-ai-runtime-supply-evaluation";
import { evaluateRuntimeResourceService } from "./skirmish-ai-runtime-resource-service-evaluation";
import { evaluateRuntimeSourceSaturation } from "./skirmish-ai-runtime-source-saturation-evaluation";
import { evaluateRuntimeResourceLabor } from "./skirmish-ai-runtime-resource-labor-evaluation";
import { evaluateRuntimeWorkerGrowth, hasRenewableFoodIncome } from "./skirmish-ai-runtime-worker-growth-evaluation";
import { isAiVictory } from "./skirmish-ai-runtime-terminal";
import { evaluateRuntimeProductionCapacity } from "./skirmish-ai-runtime-production-capacity-evaluation";
import { evaluateRuntimeProductionComposition } from "./skirmish-ai-runtime-production-composition-evaluation";
import { evaluateRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-authority-evaluation";
import { evaluateRuntimeProductionCounts } from "./skirmish-ai-runtime-production-count-evaluation";
import { evaluateRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-evaluation";
import { evaluateRuntimeTechnology } from "./skirmish-ai-runtime-technology-evaluation";
import { evaluateRuntimeEconomy } from "./skirmish-ai-runtime-economy-evaluation";
import { evaluateRuntimeResourceRecovery } from "./skirmish-ai-runtime-resource-recovery-evaluation";
import { evaluateRuntimeNativeContracts } from "./skirmish-ai-runtime-native-contracts";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import { evaluateNativeScenarioVariant } from "./skirmish-ai-native-scenario-evaluation";

export function evaluateRuntimeVariant(
  scenarioId: string,
  assertion: RuntimeAssertionV1,
  variant: RuntimeVariantResultV1,
  fixture?: RuntimeFixtureV1
): string[] {
  if (scenarioId === "H-32") return evaluateNativeScenarioVariant(scenarioId, assertion, variant, fixture)
    .map((failure) => `${variant.variantId}:${failure}`);
  const technologyFailures = evaluateRuntimeTechnology(
    scenarioId,
    assertion.requiredTechnologyContracts?.[variant.variantId],
    variant
  );
  const failures = [
    ...evaluateRuntimeEconomy(assertion.requiredEconomyContracts?.[variant.variantId], variant),
    ...evaluateRuntimeResourceRecovery(assertion.requiredResourceRecovery, variant),
    ...technologyFailures,
    ...evaluateRuntimeProductionAuthority(
      scenarioId,
      assertion.requiredProductionContracts?.[variant.variantId],
      variant.productionEvidenceV2
    )
  ].map((failure) => `${variant.variantId}:${failure}`);
  failures.push(...evaluateRuntimeNativeContracts(scenarioId, assertion, variant, fixture)
    .map((failure) => `${variant.variantId}:${failure}`));
  failures.push(
    ...(variant.productionEvidenceV2
      ? [...(variant.productionCausalityFailures ?? []), ...(variant.productionCausality?.failures ?? [])]
      : evaluateRuntimeProductionCausality(scenarioId, variant.productionCausality)
    ).map((failure) => `${variant.variantId}:${failure}`)
  );
  if (
    scenarioId === "H-18" &&
    variant.productionEvidenceV2 &&
    !variant.productionCausality &&
    !Array.isArray(variant.productionCausalityFailures)
  )
    failures.push(`${variant.variantId}:supply_recovery_diagnostic_failures_missing`);
  const final = last(variant.checkpoints);
  const appliedCommands = new Map(
    variant.checkpoints
      .flatMap((checkpoint) => checkpoint.appliedCommands)
      .map((command) => [command.commandId, command])
  );
  if (final.decisionSequence < assertion.minimumDecisions) failures.push(`${variant.variantId}:minimum_decisions`);
  if (appliedCommands.size < assertion.minimumAppliedCommands)
    failures.push(`${variant.variantId}:minimum_applied_commands`);
  if (assertion.requireDeliveredIncome && !variant.checkpoints.some((checkpoint) => checkpoint.deliveredIncome > 0))
    failures.push(`${variant.variantId}:delivered_income`);
  if (assertion.requireRenewableFoodIncome && !hasRenewableFoodIncome(variant.checkpoints))
    failures.push(`${variant.variantId}:renewable_food_income`);
  if (final.workerCount < 1) failures.push(`${variant.variantId}:worker_bootstrap`);
  if (new Set(variant.checkpoints.map((checkpoint) => checkpoint.openingPlanId)).size !== 1)
    failures.push(`${variant.variantId}:opening_plan_restarted`);
  for (const stepId of assertion.requiredOpeningSteps ?? []) {
    const completionIndex = variant.checkpoints.findIndex(
      (checkpoint) => checkpoint.openingSteps[stepId]?.state === "completed"
    );
    if (completionIndex < 0) failures.push(`${variant.variantId}:opening_step:${stepId}`);
    else if (
      variant.checkpoints
        .slice(completionIndex)
        .some((checkpoint) => checkpoint.openingSteps[stepId]?.state !== "completed")
    ) {
      failures.push(`${variant.variantId}:opening_step_regressed:${stepId}`);
    }
  }
  const appliedCommandIdsByEffect = new Map<string, Set<string>>();
  for (const command of appliedCommands.values()) {
    const commandIds = appliedCommandIdsByEffect.get(command.effectId) ?? new Set<string>();
    commandIds.add(command.commandId);
    appliedCommandIdsByEffect.set(command.effectId, commandIds);
  }
  if ([...appliedCommandIdsByEffect.values()].some((commandIds) => commandIds.size > 1)) {
    failures.push(`${variant.variantId}:duplicate_applied_effect`);
  }
  const maximumMilitary = Math.max(...variant.checkpoints.map((checkpoint) => checkpoint.militaryActorNames.length));
  if (assertion.minimumMilitaryCount !== undefined && maximumMilitary < assertion.minimumMilitaryCount) {
    failures.push(`${variant.variantId}:minimum_military_count`);
  }
  const finalMilitaryTypeCounts = final.militaryActorNames.reduce<Record<string, number>>((counts, objectName) => {
    counts[objectName] = (counts[objectName] ?? 0) + 1;
    return counts;
  }, {});
  if (
    assertion.minimumMilitaryTypeCount !== undefined &&
    Object.keys(finalMilitaryTypeCounts).length < assertion.minimumMilitaryTypeCount
  ) {
    failures.push(`${variant.variantId}:minimum_military_type_count`);
  }
  if (
    assertion.minimumRepeatedMilitaryTypeCount !== undefined &&
    Math.max(0, ...Object.values(finalMilitaryTypeCounts)) < assertion.minimumRepeatedMilitaryTypeCount
  ) {
    failures.push(`${variant.variantId}:minimum_repeated_military_type_count`);
  }
  failures.push(...evaluateRuntimeProductionCounts(assertion, variant));
  const launchEvents = [
    ...new Map(
      variant.checkpoints
        .flatMap((checkpoint) => checkpoint.missionTimeline)
        .filter((event) => event.detail.startsWith("launch:"))
        .map((event) => [`${event.tick}:${event.detail}`, event])
    ).values()
  ].sort((left, right) => left.tick - right.tick);
  if (
    assertion.firstOffensiveLaunchByTick !== undefined &&
    (launchEvents[0]?.tick ?? Number.POSITIVE_INFINITY) > assertion.firstOffensiveLaunchByTick
  ) {
    failures.push(`${variant.variantId}:first_offensive_launch_deadline`);
  }
  if (
    assertion.minimumOffensiveLaunchCount !== undefined &&
    launchEvents.length < assertion.minimumOffensiveLaunchCount
  ) {
    failures.push(`${variant.variantId}:minimum_offensive_launches`);
  }
  const finalDamage = final.scoreMetrics["damage_dealt"] ?? 0;
  const finalEnemyLosses = (final.scoreMetrics["units_killed"] ?? 0) + (final.scoreMetrics["buildings_destroyed"] ?? 0);
  if (assertion.minimumDamageDealt !== undefined && finalDamage < assertion.minimumDamageDealt) {
    failures.push(`${variant.variantId}:minimum_damage_dealt`);
  }
  if (assertion.minimumEnemyLosses !== undefined && finalEnemyLosses < assertion.minimumEnemyLosses) {
    failures.push(`${variant.variantId}:minimum_enemy_losses`);
  }
  if (assertion.requireMissionContinuation) {
    const damagingCheckpoints = variant.checkpoints.filter(
      (checkpoint) => (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > 0
    );
    const firstDamage = damagingCheckpoints[0]?.scoreMetrics["damage_dealt"] ?? 0;
    const continued = damagingCheckpoints.some(
      (checkpoint, index) => index > 0 && (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > firstDamage
    );
    if (!continued) failures.push(`${variant.variantId}:mission_pressure_did_not_continue`);
  }
  const hasAiVictory = isAiVictory(final);
  if (assertion.requireAiVictory && !hasAiVictory) {
    failures.push(`${variant.variantId}:ai_victory_missing`);
  }
  if (
    assertion.requiredGroundRouteVariantIds?.includes(variant.variantId) &&
    !variant.checkpoints.some((checkpoint) => checkpoint.strategyAssessment?.routeDomain === "ground")
  ) {
    failures.push(`${variant.variantId}:ground_route_missing`);
  }
  failures.push(...evaluateRuntimeRaidRecovery(assertion, variant, final, hasAiVictory));
  failures.push(
    ...evaluateRuntimeProductionCapacity(scenarioId, assertion.requiredProductionCapacity, variant).map(
      (failure) => `${variant.variantId}:${failure}`
    )
  );
  failures.push(
    ...evaluateRuntimeProductionComposition(assertion.requiredProductionComposition, variant).map(
      (failure) => `${variant.variantId}:${failure}`
    )
  );
  failures.push(...evaluateRuntimePresetWorld(assertion, variant));
  if (assertion.requiredSupplyPrebuild) {
    failures.push(
      ...(variant.supplyBranch === "ample_control"
        ? evaluateRuntimeSupplyControl(variant.checkpoints, assertion.requiredSupplyPrebuild)
        : evaluateRuntimeSupplyPrebuild(variant.checkpoints, assertion.requiredSupplyPrebuild)
      ).map((failure) => `${variant.variantId}:${failure}`)
    );
  }
  if (assertion.requiredSupplyRecovery) {
    failures.push(
      ...evaluateRuntimeSupplyRecovery(assertion.requiredSupplyRecovery, variant).map(
        (failure) => `${variant.variantId}:${failure}`
      )
    );
  }
  if (assertion.requiredResourceService) {
    failures.push(
      ...evaluateRuntimeResourceService(assertion.requiredResourceService, variant).map(
        (failure) => `${variant.variantId}:${failure}`
      )
    );
  }
  if (assertion.requiredSaturatedSource) {
    failures.push(
      ...evaluateRuntimeSourceSaturation(assertion.requiredSaturatedSource, variant).map(
        (failure) => `${variant.variantId}:${failure}`
      )
    );
  }
  if (assertion.requiredResourceLabor) {
    failures.push(
      ...evaluateRuntimeResourceLabor(assertion.requiredResourceLabor, variant).map(
        (failure) => `${variant.variantId}:${failure}`
      )
    );
  }
  if (assertion.requiredWorkerGrowth) {
    failures.push(
      ...evaluateRuntimeWorkerGrowth(assertion.requiredWorkerGrowth, variant).map(
        (failure) => `${variant.variantId}:${failure}`
      )
    );
  }
  failures.push(...evaluateRuntimeTransport(assertion, variant));
  const mandatoryFault = scenarioId === "H-30" && assertion.requiredNativeScenario?.branchByVariant[variant.variantId] === "mandatory" &&
    fixture?.recipe.variants.find((item) => item.id === variant.variantId)?.presetWorld?.brainFault?.kind === "mandatory";
  failures.push(...variant.aiErrors.filter((error) => !mandatoryFault || !isExpectedNativeMandatoryError(error, variant))
    .map((error) => `${variant.variantId}:ai_error:${error}`));
  return failures;
}
