import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeQueueResourceV1 } from "./ai-runtime-queue-resource-v1";
import type { AiRuntimeUnspentClaimEntry } from "./ai-runtime-unspent-claim-entry";

/** Only the exact immediate native queue operation retires its selected cash ownership. */
export function observeAiRuntimeQueueClaimPayment(
  playerNumber: number,
  resource: AiRuntimeQueueResourceV1,
  owner: { entries: Map<string, AiRuntimeUnspentClaimEntry>; gaps: Set<string> },
  sameClaims: (intent: AiRuntimeUnspentClaimEntry["intent"], price: Partial<Record<ResourceType, number>>) => boolean
): void {
  if (resource.originatingCommandContext?.execution.source !== "ai" || resource.operation !== "immediate_charge")
    return;
  const entry = [...owner.entries.values()].find(
    (entry) => entry.commandId === resource.originatingCommandContext?.execution.commandId
  );
  if (
    !entry ||
    !entry.admission ||
    resource.payment !== "immediate" ||
    !(["commandId", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const).every(
      (key) => resource.originatingCommandContext?.execution[key] === entry.admission?.[key]
    ) ||
    resource.ownerNumber !== playerNumber ||
    resource.originatingCommandContext.playerNumber !== playerNumber ||
    resource.originatingCommandContext.actorIds.length !== 1 ||
    resource.originatingCommandContext.actorIds[0] !== resource.actorId ||
    resource.identitySource !== "command" ||
    resource.itemId !== `queue:${resource.actorId}:${entry.commandId}` ||
    resource.cancellationCommand !== null ||
    ((entry.intent.kind === "produce" || entry.intent.kind === "research") &&
      entry.intent.producerId !== resource.actorId) ||
    (entry.intent.kind === "produce"
      ? resource.objectName !== entry.intent.objectName || resource.researchType !== null
      : entry.intent.kind !== "research" ||
        resource.researchType !== entry.intent.researchType ||
        resource.objectName !== null) ||
    !resource.storedPrice ||
    !sameClaims(entry.intent, resource.storedPrice) ||
    !resource.emission.requested ||
    !sameClaims(entry.intent, resource.emission.requested)
  ) {
    owner.gaps.add("unspent_payment_lineage_missing_or_mismatch");
    return;
  }
  const emission = resource.emission;
  if (
    !Number.isSafeInteger(emission.operationId) ||
    emission.operationId <= 0 ||
    resource.gaps.length ||
    emission.snapshotRestoreInProgress
  )
    owner.gaps.add("unspent_payment_authority_invalid");
  if (emission.phase === "started") {
    if (entry.state !== "admitted" || entry.paymentOperation !== undefined) owner.gaps.add("unspent_duplicate_payment");
    entry.paymentOperation = emission.operationId;
  } else if (emission.phase === "callback") {
    entry.paymentCallback = true;
    if (
      entry.paymentOperation !== emission.operationId ||
      emission.callbackOrdinal !== 1 ||
      !emission.amounts ||
      !sameClaims(entry.intent, emission.amounts)
    )
      owner.gaps.add("unspent_payment_callback_invalid");
  } else if (emission.phase === "finished") {
    if (
      entry.paymentOperation !== emission.operationId ||
      !entry.paymentCallback ||
      emission.status !== "returned" ||
      emission.callbackCount !== 1 ||
      emission.callbackLimitExceeded ||
      emission.nestedEmission ||
      !emission.balanceMatches ||
      emission.snapshotRestoreInProgress ||
      resource.gaps.length ||
      !emission.before ||
      !emission.after ||
      Object.values(ResourceType).some(
        (type) =>
          !Number.isFinite(emission.before?.[type]) ||
          !Number.isFinite(emission.after?.[type]) ||
          (emission.after?.[type] ?? -1) < 0 ||
          emission.after?.[type] !== (emission.before?.[type] ?? Number.NaN) - (emission.requested?.[type] ?? 0)
      )
    ) {
      owner.gaps.add("unspent_payment_authority_invalid");
    } else entry.state = "paid";
    entry.paymentOperation = undefined;
    entry.paymentCallback = false;
  }
}
