import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";

type SupplyCheckpoint = Pick<
  RuntimeCheckpointV1,
  "tick" | "readyHousingCapacity" | "usedPopulation" | "queuedPopulation" | "readyHousingActorNames"
> &
  Partial<Pick<RuntimeCheckpointV1, "ownedConstruction" | "decisionFacts">>;

/** Paid queue identities must complete once through a real housing loss and its funded replacement. */
export function evaluateRuntimeSupplyRecovery(
  requirement: NonNullable<RuntimeAssertionV1["requiredSupplyRecovery"]>,
  variant: Pick<
    RuntimeVariantResultV1,
    | "productionEvidenceV2"
    | "productionCapture"
    | "presetInitialQueueItems"
    | "perturbations"
    | "checkpoints"
    | "supplyBranch"
  >
): string[] {
  if (
    !Number.isSafeInteger(requirement.latestTick) ||
    requirement.latestTick <= 0 ||
    !Number.isSafeInteger(requirement.paidQueueCount) ||
    requirement.paidQueueCount <= 0 ||
    !requirement.housingObjectName ||
    !requirement.lossEventId
  )
    return ["supply_recovery_contract_invalid"];
  const evidence = variant.productionEvidenceV2;
  if (
    !evidence?.setup ||
    evidence.coverage?.closedThroughTick !== requirement.latestTick ||
    evidence.coverage.gaps.length ||
    evidence.gaps.length ||
    evidence.failures.length ||
    evidence.lifecycle.gaps.length ||
    evidence.lifecycle.failures.length
  )
    return ["supply_recovery_history_missing"];
  const failures: string[] = [];
  // Seeded shared-controller queues have no AI selection/effect. Join their existing native completion channel.
  const completions =
    variant.productionCapture?.facts.flatMap((fact) => {
      if (fact.kind !== "queue_completion" || fact.completion.phase !== "after") return [];
      const completion = fact.completion;
      if (
        completion.gaps.length ||
        completion.snapshotRestoreInProgress ||
        !completion.createdActorInProducerScene ||
        !completion.createdActor?.active ||
        !completion.createdActor.alive ||
        !completion.createdActor.indexed ||
        !completion.createdActor.finished ||
        completion.createdActor.canonicalObjectName !== completion.requestedCanonicalObjectName ||
        completion.createdActor.playerNumber !== fact.playerNumber
      )
        return [];
      return [
        {
          kind: "complete" as const,
          itemId: completion.item?.itemId ?? null,
          actorId: completion.actorId,
          productKey: completion.requestedCanonicalObjectName,
          createdActorId: completion.createdActor.actorId
        }
      ];
    }) ?? evidence.lifecycle.queues;
  const seeded = variant.presetInitialQueueItems;
  if (seeded.length !== requirement.paidQueueCount || new Set(seeded.map((item) => item.itemId)).size !== seeded.length)
    failures.push("supply_recovery_paid_setup_missing");
  for (const item of seeded) {
    const payments = evidence.lifecycle.setupPayments.filter(
      (payment) =>
        payment.itemId === item.itemId &&
        payment.command.actorIds.includes(item.producerActorId) &&
        payment.outcomes.some((outcome) => outcome.kind === "applied") &&
        Object.entries(payment.resourcesBefore).some(
          ([resource, amount]) =>
            amount > (payment.resourcesAfter[resource as keyof typeof payment.resourcesAfter] ?? amount)
        )
    );
    if (payments.length !== 1) failures.push("supply_recovery_paid_setup_missing");
    const events = completions.filter((event) => event.itemId === item.itemId);
    const complete = events.filter(
      (event) =>
        event.kind === "complete" &&
        event.actorId === item.producerActorId &&
        event.productKey === item.objectName &&
        event.createdActorId &&
        variant.checkpoints.some((checkpoint) =>
          checkpoint.militaryActors?.some((actor) => actor.actorId === event.createdActorId)
        )
    );
    const cancelled =
      evidence.lifecycle.queues.some((event) => event.itemId === item.itemId && event.kind === "cancel") ||
      variant.productionCapture?.facts.some(
        (fact) =>
          fact.kind === "queue_mutation" &&
          fact.mutation.operation === "cancel_remove" &&
          fact.mutation.phase === "after" &&
          fact.mutation.item?.itemId === item.itemId
      );
    if (complete.length !== 1 || cancelled) failures.push("supply_recovery_paid_output_lost");
  }
  if (
    new Set(
      completions
        .filter((event) => event.kind === "complete" && seeded.some((item) => item.itemId === event.itemId))
        .map((event) => event.createdActorId)
    ).size !== seeded.length
  )
    failures.push("supply_recovery_output_identity_reused");
  if (variant.supplyBranch === "ample_control") {
    if (variant.perturbations.length) failures.push("supply_recovery_control_perturbed");
    return failures;
  }
  const loss = variant.perturbations.find((event) => event.id === requirement.lossEventId);
  if (!loss?.affectedActorId || loss.dispatchedActors !== 1 || loss.subjectName !== requirement.housingObjectName)
    return [...failures, "supply_recovery_loss_missing"];
  const before = variant.checkpoints.find((checkpoint) => checkpoint.tick < loss.tick);
  const originalIds = new Set(
    before?.ownedConstruction
      .filter((actor) => actor.objectName === requirement.housingObjectName)
      .map((actor) => actor.actorId)
  );
  if (!originalIds.has(loss.affectedActorId)) failures.push("supply_recovery_initial_house_missing");
  const replacements = new Set(
    variant.checkpoints
      .filter((checkpoint) => checkpoint.tick > loss.tick && checkpoint.tick <= requirement.latestTick)
      .flatMap((checkpoint) =>
        checkpoint.ownedConstruction
          .filter(
            (actor) =>
              actor.objectName === requirement.housingObjectName &&
              actor.progress >= 100 &&
              !originalIds.has(actor.actorId)
          )
          .map((actor) => actor.actorId)
      )
  );
  if (replacements.size !== 1) failures.push("supply_recovery_replacement_not_once");
  return failures;
}

export function evaluateRuntimeSupplyPrebuild(
  checkpoints: readonly SupplyCheckpoint[],
  requirement: { readonly minimumBuffer: number; readonly latestTick: number; readonly housingObjectName: string }
): string[] {
  const pressured = checkpoints.find(
    (checkpoint) =>
      checkpoint.tick <= requirement.latestTick &&
      (checkpoint.queuedPopulation ?? 0) > 0 &&
      checkpoint.readyHousingCapacity !== undefined &&
      checkpoint.usedPopulation !== undefined &&
      checkpoint.usedPopulation + checkpoint.queuedPopulation! + requirement.minimumBuffer >
        checkpoint.readyHousingCapacity
  );
  if (!pressured) return ["supply_prebuild_precondition_missing"];
  const initialCapacity = pressured.readyHousingCapacity!;
  const initialHousingCount =
    pressured.readyHousingActorNames?.filter((name) => name === requirement.housingObjectName).length ?? 0;
  const built = checkpoints.some(
    (checkpoint) =>
      checkpoint.tick > pressured.tick &&
      checkpoint.tick <= requirement.latestTick &&
      (checkpoint.readyHousingCapacity ?? 0) > initialCapacity &&
      (checkpoint.readyHousingActorNames?.filter((name) => name === requirement.housingObjectName).length ?? 0) >
        initialHousingCount
  );
  return built ? [] : ["supply_not_prebuilt_before_deadline"];
}

/** Paired ample-capacity branch: no speculative house is allowed while the authored queue still fits. */
export function evaluateRuntimeSupplyControl(
  checkpoints: readonly SupplyCheckpoint[],
  requirement: { readonly minimumBuffer: number; readonly latestTick: number; readonly housingObjectName: string }
): string[] {
  const inWindow = checkpoints.filter((checkpoint) => checkpoint.tick <= requirement.latestTick);
  const initial = inWindow[0];
  if (
    !initial ||
    initial.readyHousingCapacity === undefined ||
    initial.usedPopulation === undefined ||
    initial.queuedPopulation === undefined ||
    initial.queuedPopulation <= 0
  )
    return ["supply_control_precondition_missing"];
  const initialHousing =
    initial.readyHousingActorNames?.filter((name) => name === requirement.housingObjectName).length ?? 0;
  if (initial.usedPopulation + initial.queuedPopulation + requirement.minimumBuffer > initial.readyHousingCapacity) {
    return ["supply_control_initial_capacity_insufficient"];
  }
  if (
    inWindow.some(
      (checkpoint) =>
        checkpoint.usedPopulation !== undefined &&
        checkpoint.queuedPopulation !== undefined &&
        checkpoint.readyHousingCapacity !== undefined &&
        checkpoint.usedPopulation + checkpoint.queuedPopulation + requirement.minimumBuffer >
          checkpoint.readyHousingCapacity
    )
  )
    return ["supply_control_became_pressured"];
  if (
    inWindow.some(
      (checkpoint) =>
        (checkpoint.readyHousingActorNames?.filter((name) => name === requirement.housingObjectName).length ?? 0) >
        initialHousing
    )
  )
    return ["supply_control_unneeded_housing"];
  if (
    inWindow.some(
      (checkpoint) =>
        checkpoint.ownedConstruction?.some(
          (actor) => actor.objectName === requirement.housingObjectName && actor.progress < 100
        ) ||
        checkpoint.decisionFacts?.some(
          (decision) =>
            decision.outcome === "accepted" &&
            decision.kind === "construct" &&
            decision.objectName === requirement.housingObjectName
        )
    )
  )
    return ["supply_control_unneeded_housing_attempt"];
  return [];
}
