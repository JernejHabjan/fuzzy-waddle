import type { RuntimeResourceRecoveryContract } from "./skirmish-ai-runtime-resource-recovery-contract";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";

/** Requires physical cargo, a real destroyed drain, native credit and later compatible extraction, plus renewable crop work. */
export function evaluateRuntimeResourceRecovery(
  contract: RuntimeResourceRecoveryContract | undefined,
  variant: Pick<RuntimeVariantResultV1, "productionCapture" | "presetCreatedActorIds" | "perturbations" | "checkpoints">
): string[] {
  if (!contract) return [];
  const capture = variant.productionCapture;
  if (
    !capture ||
    capture.droppedFactCount ||
    capture.droppedSnapshotCount ||
    capture.startedTick !== 0 ||
    !capture.snapshots.some((snapshot) => snapshot.tick >= contract.latestTick)
  ) {
    return ["resource_recovery_native_history_missing"];
  }
  const failures: string[] = [];
  const ids = variant.presetCreatedActorIds;
  const sourceId = ids[contract.sourceFixtureActorId],
    workerId = ids[contract.workerFixtureActorId],
    fieldId = ids[contract.fieldFixtureActorId],
    dropOffId = ids[contract.dropOffFixtureActorId];
  const loss = variant.perturbations.find(
    (event) => event.id === contract.lossEventId && event.dispatchedActors === 1 && event.affectedActorId === dropOffId
  );
  if (!sourceId || !workerId || !fieldId || !dropOffId || !loss) return ["resource_recovery_setup_or_loss_missing"];
  const facts = capture.facts.filter((fact) => fact.tick <= contract.latestTick);
  const initialSource = capture.snapshots.find((snapshot) =>
    snapshot.observation?.actors.some(
      (actor) =>
        actor.actorId === sourceId &&
        actor.resourceState.status === "known" &&
        actor.resourceState.value.available.status === "known" &&
        actor.resourceState.value.available.value === contract.sourceStock
    )
  );
  if (!initialSource) failures.push("resource_recovery_nearly_depleted_source_missing");
  const service = facts.flatMap((fact) =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "resource_service" ? [{ fact, value: fact.spatial }] : []
  );
  const cargo = service.find(
    ({ fact, value }) =>
      fact.tick <= loss.tick &&
      value.phase === "cargo_changed" &&
      value.source.actorId === workerId &&
      value.change.reason === "added" &&
      value.target?.actorId === sourceId &&
      value.after.amount === contract.sourceStock
  );
  if (!cargo) failures.push("resource_recovery_loaded_before_loss_missing");
  const receipts = service.filter(
    ({ value }) =>
      value.phase === "resource_credit" &&
      value.sourceInCaptureScene &&
      value.targetInCaptureScene &&
      !value.snapshotRestoreInProgress &&
      value.sceneActive &&
      value.beneficiary === capture.playerNumber &&
      runtimeResourceCreditMatches(value)
  );
  const rescued = receipts.find(
    ({ fact, value }) =>
      fact.tick > loss.tick &&
      value.phase === "resource_credit" &&
      value.source.actorId === workerId &&
      value.resourceType === "wood" &&
      value.target?.actorId !== dropOffId &&
      value.amount === contract.sourceStock
  );
  if (!rescued) failures.push("resource_recovery_carried_credit_not_rescued");
  const extracted = service.some(
    ({ fact, value }) =>
      fact.sequence > (rescued?.fact.sequence ?? Infinity) &&
      value.phase === "cargo_changed" &&
      value.change.reason === "added" &&
      value.change.resourceType === "wood" &&
      value.source.actorId === workerId &&
      value.target?.actorId !== sourceId &&
      value.change.delta !== undefined &&
      value.change.delta > 0
  );
  if (!extracted) failures.push("resource_recovery_compatible_source_not_resumed");
  const fieldInitiallyGrowing = capture.snapshots.some(
    (snapshot) =>
      snapshot.tick <= loss.tick &&
      snapshot.observation?.actors.some(
        (actor) =>
          actor.actorId === fieldId &&
          actor.resourceState.status === "known" &&
          actor.resourceState.value.available.status === "known" &&
          actor.resourceState.value.available.value === 0
      )
  );
  const fieldHarvested = service.some(
    ({ value }) =>
      value.phase === "cargo_changed" &&
      value.change.reason === "added" &&
      value.target?.actorId === fieldId &&
      value.change.resourceType === "food" &&
      (value.change.delta ?? 0) > 0
  );
  if (
    !fieldInitiallyGrowing ||
    !fieldHarvested ||
    !receipts.some(
      ({ value }) => value.phase === "resource_credit" && value.resourceType === "food" && value.amount > 0
    )
  )
    failures.push("resource_recovery_crop_not_delivered");
  const final = variant.checkpoints.at(-1);
  if (
    (final?.ownedActorNames.filter((name) => name === "Field").length ?? 0) > 2 ||
    (final?.ownedActorNames.filter((name) => name === "WorkMill").length ?? 0) > 1
  )
    failures.push("resource_recovery_rebuild_loop");
  return failures;
}
