import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";
import type { RuntimeSourceDeliveryContract } from "./skirmish-ai-source-delivery-contract";

/** Bind actual extraction to the next offered cargo and its exact successful deposit, refusing mixed-source/reset attribution. */
export function hasNativeSourceDelivery(
  facts: readonly AiRuntimeProductionFactV1[], contract: RuntimeSourceDeliveryContract
): boolean {
  const { sourceActorId, sourceOwner, playerNumber, resourceType, fromTick, throughTick, workerActorId, depositActorId } = contract;
  const service = facts.flatMap((fact) => fact.tick >= fromTick && fact.tick <= throughTick &&
    fact.kind === "spatial_authority" && fact.spatial.kind === "resource_service"
    ? [{ fact, value: fact.spatial }] : []
  );
  const usable = (entry: typeof service[number]) => entry.value.clockTick === entry.fact.tick && entry.value.sceneActive &&
    !entry.value.snapshotRestoreInProgress && entry.value.lifetimeValid && entry.value.sourceInCaptureScene &&
    entry.value.source.playerNumber === playerNumber && entry.value.source.active && entry.value.source.alive &&
    entry.value.source.indexed && entry.value.gaps.length === 0;
  for (const extraction of service) {
    const harvest = extraction.value;
    if (!usable(extraction) || harvest.phase !== "cargo_changed" ||
        harvest.change.reason !== "added" || harvest.change.resourceType !== resourceType || (harvest.change.delta ?? 0) <= 0 ||
        harvest.target?.actorId !== sourceActorId || !harvest.targetInCaptureScene || !harvest.target.finished ||
        harvest.target.playerNumber !== sourceOwner || harvest.cargoId === null ||
        (workerActorId !== undefined && harvest.source.actorId !== workerActorId)) continue;
    const nextOffer = service.find(({ fact, value }) => fact.sequence > extraction.fact.sequence &&
      value.source.actorId === harvest.source.actorId && value.cargoId === harvest.cargoId && value.phase === "cargo_offered"
    );
    if (!nextOffer || !usable(nextOffer) || nextOffer.value.phase !== "cargo_offered" ||
        nextOffer.value.cargo.resourceType !== resourceType || nextOffer.value.cargo.amount <= 0 ||
        nextOffer.value.transferId === null ||
        (depositActorId !== undefined && nextOffer.value.target?.actorId !== depositActorId)) continue;
    const contaminated = service.some(({ fact, value }) => fact.sequence > extraction.fact.sequence &&
      fact.sequence < nextOffer.fact.sequence && value.source.actorId === harvest.source.actorId &&
      value.cargoId === harvest.cargoId && value.phase === "cargo_changed" &&
      (value.change.reason === "reset" || value.change.reason === "restore" ||
        (value.change.reason === "added" && (value.target?.actorId !== sourceActorId || value.change.resourceType !== resourceType)))
    );
    if (contaminated) continue;
    if (service.some((entry) => entry.fact.sequence > nextOffer.fact.sequence && usable(entry) &&
      entry.value.phase === "resource_credit" && entry.value.cargoId === harvest.cargoId &&
      entry.value.transferId === nextOffer.value.transferId && entry.value.source.actorId === harvest.source.actorId &&
      entry.value.target?.actorId === nextOffer.value.target?.actorId && entry.value.targetInCaptureScene &&
      entry.value.target?.finished && entry.value.target.active && entry.value.target.alive && entry.value.target.indexed &&
      entry.value.target.playerNumber === playerNumber &&
      entry.value.resourceType === resourceType && entry.value.amount > 0 && entry.value.beneficiary === playerNumber &&
      runtimeResourceCreditMatches(entry.value)
    )) return true;
  }
  return false;
}
