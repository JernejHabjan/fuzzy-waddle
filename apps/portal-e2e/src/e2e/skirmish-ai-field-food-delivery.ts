import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";

/** Bind actual extraction to the next offered cargo and its exact successful deposit, refusing mixed-source/reset attribution. */
export function hasNativeFieldFoodDelivery(
  facts: readonly AiRuntimeProductionFactV1[], fieldId: string, completedAt: number, playerNumber: number
): boolean {
  const service = facts.flatMap((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "resource_service"
    ? [{ fact, value: fact.spatial }] : []
  );
  const usable = (entry: typeof service[number]) => entry.value.clockTick === entry.fact.tick && entry.value.sceneActive &&
    !entry.value.snapshotRestoreInProgress && entry.value.lifetimeValid && entry.value.sourceInCaptureScene &&
    entry.value.source.playerNumber === playerNumber && entry.value.source.active && entry.value.source.alive &&
    entry.value.source.indexed && entry.value.gaps.length === 0;
  for (const extraction of service) {
    const harvest = extraction.value;
    if (!usable(extraction) || extraction.fact.tick < completedAt || harvest.phase !== "cargo_changed" ||
        harvest.change.reason !== "added" || harvest.change.resourceType !== "food" || (harvest.change.delta ?? 0) <= 0 ||
        harvest.target?.actorId !== fieldId || !harvest.targetInCaptureScene || !harvest.target.finished ||
        harvest.target.playerNumber !== playerNumber || harvest.cargoId === null) continue;
    const nextOffer = service.find(({ fact, value }) => fact.sequence > extraction.fact.sequence &&
      value.source.actorId === harvest.source.actorId && value.cargoId === harvest.cargoId && value.phase === "cargo_offered"
    );
    if (!nextOffer || !usable(nextOffer) || nextOffer.value.phase !== "cargo_offered" ||
        nextOffer.value.cargo.resourceType !== "food" || nextOffer.value.cargo.amount <= 0 || nextOffer.value.transferId === null) continue;
    const contaminated = service.some(({ fact, value }) => fact.sequence > extraction.fact.sequence &&
      fact.sequence < nextOffer.fact.sequence && value.source.actorId === harvest.source.actorId &&
      value.cargoId === harvest.cargoId && value.phase === "cargo_changed" &&
      (value.change.reason === "reset" || value.change.reason === "restore" ||
        (value.change.reason === "added" && (value.target?.actorId !== fieldId || value.change.resourceType !== "food")))
    );
    if (contaminated) continue;
    if (service.some((entry) => entry.fact.sequence > nextOffer.fact.sequence && usable(entry) &&
      entry.value.phase === "resource_credit" && entry.value.cargoId === harvest.cargoId &&
      entry.value.transferId === nextOffer.value.transferId && entry.value.source.actorId === harvest.source.actorId &&
      entry.value.target?.actorId === nextOffer.value.target?.actorId && entry.value.targetInCaptureScene &&
      entry.value.target?.finished && entry.value.target.playerNumber === playerNumber &&
      entry.value.resourceType === "food" && entry.value.amount > 0 && entry.value.beneficiary === playerNumber &&
      runtimeResourceCreditMatches(entry.value)
    )) return true;
  }
  return false;
}
