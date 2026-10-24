import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { isDeepStrictEqual } from "node:util";
// prettier-ignore
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
// prettier-ignore
import type { AiRuntimeUnspentClaimsV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-unspent-claims-v1";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Construction ownership is selected cash until exact admission and native site payment; placement alone never spends it. */
export function reconcileRuntimeConstructionUnspent(
  entry: AiRuntimeUnspentClaimsV1["entries"][number],
  prefix: readonly AiRuntimeProductionFactV1[],
  allFacts: readonly AiRuntimeProductionFactV1[] = prefix
) {
  const failures: string[] = [],
    gaps: string[] = [];
  const intent = entry.intent;
  if (intent.kind !== "construct") return { failures: ["production_construction_unspent_kind_invalid"], gaps };
  const requests = prefix
    .filter((fact) => fact.kind === "intent_dispatch")
    .filter(
      (fact) =>
        fact.event.kind === "requested" &&
        isDeepStrictEqual(fact.event.acceptedIntent, intent) &&
        isDeepStrictEqual(fact.event.decisionIdentity, entry.identity)
    );
  const request = requests[0];
  const receipt = allFacts
    .filter((fact) => fact.kind === "intent_dispatch")
    .find(
      (fact) =>
        fact.event.kind === "finished" &&
        request?.event.kind === "requested" &&
        isDeepStrictEqual(fact.event.correlation, request.event.correlation) &&
        fact.sequence > request.sequence
    );
  const command =
    receipt?.event.kind === "finished" && receipt.event.receipt.status === "dispatched"
      ? receipt.event.receipt.command
      : null;
  const outcomes = prefix
    .filter((fact) => fact.kind === "outcome")
    .filter((fact) => fact.outcome.commandId === entry.commandId);
  const admission = outcomes.find((fact) => fact.outcome.kind === "dispatched");
  const terminal = outcomes.find((fact) =>
    ["rejected", "failed", "cancelled", "completed"].includes(fact.outcome.kind)
  );
  const placement = prefix
    .filter((fact) => fact.kind === "spatial_authority")
    .find(
      (fact) =>
        fact.spatial.kind === "placement" &&
        fact.spatial.command.execution?.commandId === entry.commandId &&
        fact.spatial.legal
    );
  const site = placement?.spatial.kind === "placement" ? placement.spatial.site.actorId : null;
  const payments = prefix
    .filter((fact) => fact.kind === "construction_authority")
    .filter(
      (fact) =>
        fact.construction.kind === "resource" &&
        fact.construction.operation === "start_charge" &&
        fact.construction.site.actorId === site &&
        fact.construction.status === "returned"
    );
  const payment = payments[0]?.construction;
  const price = Object.fromEntries(
    Object.values(ResourceType).map((resource) => [
      resource,
      intent.claims.reduce(
        (sum, claim) => sum + (claim.kind === "resource" && claim.resourceType === resource ? claim.amount : 0),
        0
      )
    ])
  );
  const paid =
    site !== null &&
    payments.length === 1 &&
    payment?.kind === "resource" &&
    payment.configuredCostType === 0 &&
    payment.balanceMatches &&
    payment.callbackCount === 1 &&
    !payment.nestedEmission &&
    payment.site.canonicalObjectName === intent.objectName &&
    payment.site.playerNumber === entry.identity.playerNumber &&
    sameRuntimeQueueVector(payment.configuredCost, price) &&
    sameRuntimeQueueVector(payment.requested, price);
  if (entry.state === "selected") {
    if (entry.commandId !== null || admission) failures.push("production_construction_unspent_state_invalid");
  } else if (entry.state === "released" && entry.commandId === null) {
    if (receipt?.event.kind !== "finished" || receipt.event.receipt.status !== "rejected")
      gaps.push("production_construction_unspent_rejection_missing");
  } else {
    if (
      requests.length !== 1 ||
      !request ||
      !admission ||
      !command ||
      command.type !== "CONSTRUCT" ||
      command.execution?.commandId !== entry.commandId ||
      command.execution?.source !== "ai" ||
      command.actorName !== intent.objectName ||
      command.siteKey !== intent.siteKey ||
      !isDeepStrictEqual(command.actorIds, intent.builderIds) ||
      !isDeepStrictEqual(command.tileVec3, intent.logicalPosition)
    ) {
      gaps.push("production_construction_unspent_admission_missing");
    }
    if (
      entry.state === "admitted"
        ? paid || (terminal && terminal.outcome.kind !== "completed")
        : entry.state === "paid"
          ? !paid
          : entry.state === "released"
            ? !terminal
            : true
    ) {
      failures.push("production_construction_unspent_state_invalid");
    }
  }
  return { failures, gaps };
}
