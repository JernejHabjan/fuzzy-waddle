import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { evaluateRuntimeResourceRecovery } from "./skirmish-ai-runtime-resource-recovery-evaluation";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { nativeRecoveryIncome } from "./skirmish-ai-native-recovery-evidence";
import { nativeWaitingExposureFailures } from "./skirmish-ai-native-waiting-exposure";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";

/** A loaded worker must rescue its actual pack, resume extraction and sustain renewable food in the same match. */
export function evaluateNativeEconomySequence(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = evaluateRuntimeResourceRecovery({ latestTick: 1200, sourceFixtureActorId: "near-empty-tree",
    sourceStock: 2, workerFixtureActorId: "ai-worker-1", fieldFixtureActorId: "field",
    dropOffFixtureActorId: "lost-dropoff", lossEventId: "dropoff-loss" }, context.result);
  const credits = context.facts.flatMap((fact) => fact.kind === "spatial_authority" &&
    fact.spatial.kind === "resource_service" && fact.spatial.phase === "resource_credit" &&
    fact.spatial.beneficiary === 2 && runtimeResourceCreditMatches(fact.spatial) ? [{ fact, value: fact.spatial }] : []);
  if (credits.filter((entry) => entry.fact.tick >= 1200 && entry.fact.tick <= 6000 &&
    entry.value.resourceType === "food" && entry.value.amount > 0).length < 2)
    failures.push("sequence_renewable_food_not_sustained_after_cargo_recovery");
  const deposits = nativeCompletedPlacements(context).filter((placement) =>
    placement.value.site.canonicalObjectName === "WorkMill" && placement.completionTick <= 6000);
  if (branch === "efficient") {
    const redundantServedSource = deposits.some((deposit) => deposit.fact.tick <= 1200 &&
      deposit.selected.decision.acceptedIntents.some((intent) => intent.kind === "construct" &&
        intent.effectId.replace(/^effect:/, "") === deposit.value.command.execution?.effectId &&
        intent.demandId === `demand:resource-service:${context.role("spare-tree")}`));
    if (!credits.some((entry) => entry.fact.tick > 160 && entry.fact.tick <= 1200 &&
      entry.value.target?.actorId === context.role("surviving-drain")) || redundantServedSource)
      failures.push("sequence_efficient_existing_service_not_used_or_redundantly_duplicated");
  } else if (!deposits.some((deposit) => credits.some((entry) => entry.value.target?.actorId === deposit.siteId &&
    entry.value.resourceType === "wood" && entry.fact.tick > deposit.completionTick && entry.fact.tick <= 8000)))
    failures.push("sequence_useful_duplicate_deposit_never_completed_and_delivered");
  if (branch === "congested") {
    const users = context.facts.filter((fact) => fact.tick <= 1200 && fact.kind === "spatial_authority" &&
      fact.spatial.kind === "service_attempt" && fact.spatial.target.actorId === context.role("surviving-drain"))
      .flatMap((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" &&
        fact.spatial.source.actorId ? [fact.spatial.source.actorId] : []);
    if (new Set(users).size < 3) failures.push("sequence_shared_surviving_drain_pressure_not_exercised");
  }
  return [...new Set(failures)];
}

/** Original paid identities must reconcile once while supply/producer replacement precedes optional research. */
export function evaluateNativeSupplySequence(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeWaitingExposureFailures(context);
  for (const role of ["ready-house", "ready-producer"]) if (!context.result.perturbations.some((event) =>
    event.id === `sequence-loss-${role}` && event.tick === 200 && event.affectedActorId === context.roles[role]))
    failures.push("sequence_original_supply_or_producer_loss_missing");
  const housing = context.result.aiFaction === "Tivara" ? "Olival" : "Emberstone";
  const producer = context.result.aiFaction === "Tivara" ? "AnkGuard" : "InfantryInn";
  const replacements = nativeCompletedPlacements(context).filter((placement) => placement.fact.tick >= 200);
  const house = replacements.find((placement) => placement.value.site.canonicalObjectName === housing);
  const production = replacements.find((placement) => placement.value.site.canonicalObjectName === producer);
  const readyTick = Math.max(house?.completionTick ?? Infinity, production?.completionTick ?? Infinity);
  if (!Number.isFinite(readyTick) || readyTick > 6000 || !nativeRecoveryIncome(context, 200))
    failures.push("sequence_essential_funded_recovery_and_delivered_income_missing");
  const fundedTick = Math.max(house?.fact.tick ?? Infinity, production?.fact.tick ?? Infinity);
  const optional = context.frames.flatMap((frame) => frame.tick > 200 && frame.tick < fundedTick ?
    frame.decision.decisions.filter((decision) => decision.intent.kind === "research") : []);
  if (!optional.length) failures.push("sequence_optional_upgrade_funding_competition_not_exercised");
  if (optional.some((decision) => decision.outcome === "accepted")) failures.push("sequence_optional_research_displaced_recovery");
  const originalItems = context.result.presetInitialQueueItems;
  if (originalItems.filter((item) => item.kind === "production").length !== 4 ||
      originalItems.filter((item) => item.kind === "research").length !== 1)
    failures.push("sequence_original_paid_partial_queue_and_upgrade_missing");
  for (const item of originalItems) {
    const refunds = context.facts.filter((fact) => fact.kind === "queue_resource" && fact.resource.itemId === item.itemId &&
      fact.resource.operation === "cancellation_refund" && fact.resource.emission.phase === "finished");
    const complete = nativePaidMissionOutputs(context).filter((output) => output.item.itemId === item.itemId);
    if (refunds.length > 1 || complete.length > 1 || refunds.length && complete.length)
      failures.push("sequence_original_paid_item_was_refunded_or_created_twice");
    if (context.frames.some((frame) => frame.tick > 1000 && frame.boundaryState?.pendingCommands.some((command) =>
      command.scheduledTick <= 200 && command.unresolvedActorIds.includes(context.role("ready-producer")))))
      failures.push("sequence_destroyed_producer_kept_ghost_pending_work");
  }
  const renewed = nativePaidMissionOutputs(context).filter((output) => output.fact.tick >= readyTick &&
    output.fact.completion.actorId === production?.siteId);
  if (!renewed.some((output) => nativeWeaponHits(context, undefined, output.fact.tick).some((fact) =>
    fact.kind === "native_damage" && fact.damage.initiator?.actorId === output.actor.actorId)))
    failures.push("sequence_replacement_producer_has_no_earned_military_mission_effect");
  if (branch === "cancel_race" && !context.facts.some((fact) => fact.kind === "preset_control" &&
    fact.control.id === "sequence-original-cancel" && fact.control.phase === "applied" &&
    fact.control.command?.type === "CANCEL_RESEARCH" && fact.control.outcomes.some((outcome) => outcome.kind === "cancelled")))
    failures.push("sequence_original_cancel_loss_race_missing");
  if (branch === "cancel_race" && !originalItems.filter((item) => item.kind === "research").every((item) =>
    context.facts.filter((fact) => fact.kind === "queue_resource" && fact.resource.itemId === item.itemId &&
      fact.resource.operation === "cancellation_refund" && fact.resource.emission.phase === "finished" &&
      fact.resource.emission.status === "returned" && fact.resource.emission.balanceMatches &&
      fact.resource.emission.callbackCount === 1).length === 1)) failures.push("sequence_original_upgrade_refund_not_exactly_once");
  return [...new Set(failures)];
}
