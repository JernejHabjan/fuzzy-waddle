import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

/** Only authoritative composition facts are needed, allowing focused oracle examples without unrelated world fields. */
type CompositionEvidence = Pick<RuntimeVariantResultV1,
  "aiFaction" | "productionCompositionBranch" | "presetFixtureId" | "presetCreatedActorIds" |
  "presetCreatedActorNames" | "presetQueuedItemCount" | "presetInitialQueueItems" | "stopReason"
> & { readonly checkpoints: readonly Pick<RuntimeCheckpointV1,
  "targetTick" | "tick" | "militaryActors" | "appliedCommands" | "demands" | "militaryProducerQueues"
>[] };

/**
 * PRO-04 compares AI-created output with seeded normal queue completion, independently of the planner's demand ledger.
 * Every branch retains its horizon: counters or a transient fulfilled checkpoint cannot prove stopping.
 */
export function evaluateRuntimeProductionComposition(
  assertion: RuntimeAssertionV1["requiredProductionComposition"],
  variant: CompositionEvidence
): string[] {
  if (!assertion) return [];
  const failures = new Set<string>();
  const fail = (reason: string) => failures.add(`production_composition_${reason}`);
  const branch = variant.productionCompositionBranch;
  if (branch !== "fill_deficit" && branch !== "satisfied_control" && branch !== "seeded_queue_control") {
    fail("branch_missing");
  }
  const unitName = assertion.unitObjectNameByFaction[variant.aiFaction];
  const initialIds = new Set(Object.values(variant.presetCreatedActorIds));
  const initialCopies = variant.presetCreatedActorNames.filter((name) => name === unitName).length;
  const initialQueues = variant.presetInitialQueueItems;
  if (!variant.presetFixtureId || initialCopies < 2 || initialIds.size !== variant.presetCreatedActorNames.length ||
      variant.presetQueuedItemCount !== initialQueues.length || new Set(initialQueues.map((item) => item.itemId)).size !==
      initialQueues.length || initialQueues.some((item) => item.kind !== "production" || item.objectName !== unitName ||
        !item.itemId.startsWith(`queue:${item.producerActorId}:`) ||
        variant.presetCreatedActorIds[item.producerFixtureActorId] !== item.producerActorId)) {
    fail("initial_setup");
  }
  if ((branch === "seeded_queue_control" && initialQueues.length !== assertion.additionalUnitCount) ||
      (branch !== "seeded_queue_control" && initialQueues.length !== 0)) fail("initial_queue_setup");
  if (branch === "seeded_queue_control" &&
      new Set(initialQueues.map((item) => item.producerActorId)).size !== assertion.additionalUnitCount) {
    fail("initial_queue_producers");
  }
  const checkpoints = variant.checkpoints.filter((checkpoint) => checkpoint.targetTick <= assertion.latestTick);
  const initialArmy = checkpoints[0]?.militaryActors?.filter((actor) => initialIds.has(actor.actorId)) ?? [];
  const expectedInitialArmy = assertion.targetMilitaryCount -
    (branch === "satisfied_control" ? 0 : assertion.additionalUnitCount);
  if (initialArmy.length !== expectedInitialArmy) fail("initial_force_missing");
  const final = checkpoints.at(-1);
  if (!final || final.targetTick < assertion.latestTick || variant.stopReason !== "checkpoint_ceiling") fail("horizon_missing");
  const applied = new Map<string, string>();
  const initialQueueIds = new Set(initialQueues.map((item) => item.itemId));
  const observedInitialQueueIds = new Set<string>();
  let filledTick: number | undefined;
  for (const checkpoint of checkpoints) {
    const actors = checkpoint.militaryActors;
    if (!actors || new Set(actors.map((actor) => actor.actorId)).size !== actors.length) {
      fail("actor_evidence_missing");
      continue;
    }
    const newActors = actors.filter((actor) => !initialIds.has(actor.actorId));
    if (initialArmy.some((initial) => !actors.some((actor) => actor.actorId === initial.actorId))) fail("preset_force_lost");
    const newCopies = newActors.filter((actor) => actor.objectName === unitName);
    for (const command of checkpoint.appliedCommands) {
      if (command.effectId.startsWith("effect:composition:effect:")) applied.set(command.commandId, command.effectId);
    }
    const demand = checkpoint.demands.find((candidate) => candidate.demandId === "demand:composition:first-squad");
    if (!demand || demand.desired !== assertion.targetMilitaryCount || demand.purpose !== "dated_ground_pressure") {
      fail("target_changed_or_missing");
    }
    const queuedItems = checkpoint.militaryProducerQueues.flatMap((producer) => producer.queuedItems);
    for (const producer of checkpoint.militaryProducerQueues) {
      const observedNames = producer.queuedItems
        .flatMap((item) => item.kind === "production" && item.objectName ? [item.objectName] : []).sort();
      if (producer.occupied !== producer.queuedItems.length ||
          JSON.stringify(observedNames) !== JSON.stringify([...producer.queuedObjectNames].sort())) {
        fail("queue_evidence_missing");
      }
    }
    const queued = queuedItems.length;
    if (branch === "seeded_queue_control") {
      for (const item of queuedItems) {
        if (!initialQueueIds.has(item.itemId) || item.kind !== "production" || item.objectName !== unitName) {
          fail("seeded_control_unexpected_queue");
        } else {
          observedInitialQueueIds.add(item.itemId);
        }
      }
    }
    if (actors.length + queued > assertion.targetMilitaryCount ||
        (demand && demand.satisfied + demand.queued + demand.constructing + demand.accepted > demand.desired)) {
      fail("overproduction");
    }
    if (branch === "satisfied_control") {
      if (newActors.length > 0 || queued > 0 || applied.size > 0) fail("control_produced");
      if (actors.length !== assertion.targetMilitaryCount) fail("control_force_not_retained");
    } else if (branch === "fill_deficit") {
      if (newActors.some((actor) => actor.objectName !== unitName)) fail("wrong_product");
      if (newCopies.length > assertion.additionalUnitCount) fail("overproduction");
      if (actors.length === assertion.targetMilitaryCount && queued === 0 &&
          newCopies.length === assertion.additionalUnitCount) {
        filledTick ??= checkpoint.tick;
      } else if (filledTick !== undefined) fail("force_not_retained");
    } else if (branch === "seeded_queue_control") {
      if (newActors.some((actor) => actor.objectName !== unitName)) fail("wrong_product");
      if (newCopies.length > assertion.additionalUnitCount || applied.size > 0) fail("seeded_control_applied_ai_work");
      if (queuedItems.some((item) => item.kind !== "production" || item.objectName !== unitName)) {
        fail("seeded_control_unexpected_queue");
      }
      if (actors.length === assertion.targetMilitaryCount && queued === 0 &&
          newCopies.length === assertion.additionalUnitCount) {
        filledTick ??= checkpoint.tick;
      } else if (filledTick !== undefined) fail("force_not_retained");
    }
  }
  if (branch === "fill_deficit" || branch === "seeded_queue_control") {
    if (filledTick === undefined) fail("useful_copies_missing");
    if (filledTick === undefined || !final || final.tick - filledTick < assertion.stableForTicks) fail("stability_missing");
    if (branch === "fill_deficit" &&
        (applied.size !== assertion.additionalUnitCount || new Set(applied.values()).size !== applied.size)) {
      fail("applied_effect_count");
    }
    if (branch === "seeded_queue_control" && (applied.size !== 0 ||
        observedInitialQueueIds.size !== initialQueueIds.size ||
        (final?.militaryProducerQueues.flatMap((producer) => producer.queuedItems).length ?? 0) !== 0)) {
      fail("seeded_control_not_completed");
    }
  }
  return [...failures];
}
