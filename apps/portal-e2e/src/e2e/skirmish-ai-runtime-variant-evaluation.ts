import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import { evaluateRuntimeRaidRecovery } from "./skirmish-ai-runtime-raid-evaluation";
import { evaluateRuntimeTransport } from "./skirmish-ai-runtime-transport-evaluation";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { last } from "./skirmish-ai-runtime-value";
import { evaluateRuntimePresetWorld } from "./skirmish-ai-runtime-preset-evaluation";
import { evaluateRuntimeSupplyPrebuild } from "./skirmish-ai-runtime-supply-evaluation";

export function evaluateRuntimeVariant(
  scenarioId: string,
  assertion: RuntimeAssertionV1,
  variant: RuntimeVariantResultV1
): string[] {
  const failures: string[] = [];
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
  const maximumProducerCount = Math.max(
    ...variant.checkpoints.map((checkpoint) => checkpoint.militaryProducerNames.length)
  );
  if (
    assertion.minimumMilitaryProducerCount !== undefined &&
    maximumProducerCount < assertion.minimumMilitaryProducerCount
  ) {
    failures.push(`${variant.variantId}:minimum_military_producer_count`);
  }
  if (
    assertion.maximumMilitaryProducerCount !== undefined &&
    maximumProducerCount > assertion.maximumMilitaryProducerCount
  ) {
    failures.push(`${variant.variantId}:maximum_military_producer_count`);
  }
  const compositionDemands = variant.checkpoints.flatMap((checkpoint) =>
    checkpoint.demands.filter((demand) => demand.demandId === "demand:composition:first-squad")
  );
  const capacityDemands = variant.checkpoints.flatMap((checkpoint) =>
    checkpoint.demands.filter((demand) => demand.demandId === "demand:capacity:first-army")
  );
  if (assertion.requireCompositionDemand && compositionDemands.length === 0) {
    failures.push(`${variant.variantId}:composition_demand_missing`);
  }
  if (assertion.requireCapacityDemand && capacityDemands.length === 0) {
    failures.push(`${variant.variantId}:capacity_demand_missing`);
  }
  if (scenarioId === "PRO-03") {
    const capacityIndex = variant.checkpoints.findIndex((checkpoint) => checkpoint.militaryProducerNames.length >= 2);
    const fulfilledIndex = variant.checkpoints.findIndex((checkpoint) => {
      const demand = checkpoint.demands.find(
        (candidate) => candidate.demandId === "demand:composition:first-squad" && candidate.desired >= 12
      );
      return demand !== undefined && demand.satisfied + demand.queued + demand.accepted >= demand.desired;
    });
    const prebuilt = capacityIndex >= 0 && fulfilledIndex >= 0 && capacityIndex <= fulfilledIndex;
    if (!prebuilt) failures.push(`${variant.variantId}:capacity_not_prebuilt`);
  }
  if (assertion.requireProductionStopsAtTarget) {
    const fulfillmentIndex = variant.checkpoints.findIndex((checkpoint) => {
      const demand = checkpoint.demands.find((candidate) => candidate.demandId === "demand:composition:first-squad");
      return demand !== undefined && demand.satisfied + demand.queued + demand.accepted >= demand.desired;
    });
    if (fulfillmentIndex < 0) failures.push(`${variant.variantId}:composition_target_not_fulfilled`);
    else if (
      variant.checkpoints.slice(fulfillmentIndex).some((checkpoint) => {
        const demand = checkpoint.demands.find((candidate) => candidate.demandId === "demand:composition:first-squad");
        return demand !== undefined && demand.satisfied + demand.queued + demand.accepted > demand.desired;
      })
    ) {
      failures.push(`${variant.variantId}:composition_overproduction`);
    }
  }
  const maximumQueueOccupancy = assertion.maximumQueueOccupancyPerProducer;
  if (
    maximumQueueOccupancy !== undefined &&
    variant.checkpoints.some((checkpoint) =>
      checkpoint.militaryProducerQueues.some((producer) => producer.occupied > maximumQueueOccupancy)
    )
  ) {
    failures.push(`${variant.variantId}:producer_queue_overbooked`);
  }
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
  const hasTerminalResult =
    (final.gameResult !== null && final.gameResult.toLowerCase() !== "quit") ||
    final.modeGoals.some((goal) => goal.owner === 2 && goal.state === "completed");
  if (assertion.requireTerminalResult && !hasTerminalResult) {
    failures.push(`${variant.variantId}:terminal_result_missing`);
  }
  if (
    assertion.requiredGroundRouteVariantIds?.includes(variant.variantId) &&
    !variant.checkpoints.some((checkpoint) => checkpoint.strategyAssessment?.routeDomain === "ground")
  ) {
    failures.push(`${variant.variantId}:ground_route_missing`);
  }
  failures.push(...evaluateRuntimeRaidRecovery(assertion, variant, final, hasTerminalResult));
  failures.push(...evaluateRuntimePresetWorld(assertion, variant));
  if (assertion.requiredSupplyPrebuild) {
    failures.push(
      ...evaluateRuntimeSupplyPrebuild(variant.checkpoints, assertion.requiredSupplyPrebuild).map(
        (failure) => `${variant.variantId}:${failure}`
      )
    );
  }
  failures.push(...evaluateRuntimeTransport(assertion, variant));
  failures.push(...variant.aiErrors.map((error) => `${variant.variantId}:ai_error:${error}`));
  return failures;
}
