import { ResearchType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeUnspentClaimsV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-unspent-claims-v1";
import { productionOperationFixture } from "./skirmish-ai-runtime-production-operation-fixture";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";

/** Invented selected/native rejection callbacks, no live setup, pricing catalog, fairness or useful AI effect. */
export function productionRejectionFixture(stage: "admission" | "stamped_admission" | "application" | "bus_application" = "admission",
  family: "production" | "research" = "production") {
  const base = productionOperationFixture("immediate");
  const selected = base.facts.find((fact) => fact.kind === "decision_selected");
  const requested = base.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "requested");
  const receipt = base.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished");
  const admission = base.facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "dispatched");
  const physical = base.facts.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "started");
  if (!selected || selected.kind !== "decision_selected" || !requested || requested.kind !== "intent_dispatch" ||
    requested.event.kind !== "requested" || !requested.event.acceptedIntent || !receipt || receipt.kind !== "intent_dispatch" ||
    receipt.event.kind !== "finished" || receipt.event.receipt.status !== "dispatched" || !admission || admission.kind !== "outcome" ||
    !physical?.boundaryState?.queues) throw new Error("synthetic_rejection_fixture_missing");
  const physicalBoundary = physical.boundaryState;
  const queues = physical.boundaryState.queues;
  const originalIntent = requested.event.acceptedIntent;
  if (originalIntent.kind !== "produce") throw new Error("synthetic_purchase_missing");
  const intent: AiIntentV1 = family === "research" ? {
    intentId: originalIntent.intentId, effectId: originalIntent.effectId, planId: originalIntent.planId,
    demandId: originalIntent.demandId, lane: originalIntent.lane, proposedTick: originalIntent.proposedTick,
    urgencyClass: originalIntent.urgencyClass, utility: originalIntent.utility, preconditions: originalIntent.preconditions,
    claims: originalIntent.claims, reasonCode: originalIntent.reasonCode, producerId: originalIntent.producerId,
    kind: "research", researchType: ResearchType.TivaraMacemanUpgradeLevel2
  } : originalIntent;
  const originalCommand = receipt.event.receipt.command;
  const command: GameCommand = family === "research" ? { type: "RESEARCH", tick: originalCommand.tick,
    playerNumber: originalCommand.playerNumber, actorIds: originalCommand.actorIds, execution: originalCommand.execution,
    researchType: ResearchType.TivaraMacemanUpgradeLevel2 } : originalCommand;
  const zero = { food: 0, wood: 0, stone: 0, minerals: 0 };
  const ledger = (state: AiRuntimeUnspentClaimsV1["entries"][number]["state"], native: boolean): AiRuntimeUnspentClaimsV1 => ({
    resources: { ...zero, food: state === "released" ? 0 : 7 }, gaps: [],
    entries: [{ identity: selected.decision.identity, intent, commandId: native ? "purchase" : null, state }]
  });
  const boundary = (state: AiRuntimeUnspentClaimsV1["entries"][number]["state"], native = false) => ({
    ...physicalBoundary, snapshotRestoreInProgress: false, queues,
    resources: { food: 100, wood: 100, stone: 100, minerals: 100 },
    obligations: calculateRuntimeQueueLiabilities(queues), unspentClaims: ledger(state, native), gaps: []
  });
  const request: AiRuntimeProductionFactV1 = { ...requested, event: { ...requested.event, acceptedIntent: intent,
    command: family === "research" ? { type: "RESEARCH", playerNumber: command.playerNumber,
      actorIds: command.actorIds, researchType: ResearchType.TivaraMacemanUpgradeLevel2 } :
      { ...requested.event.command, execution: undefined } }, boundaryStateBefore: boundary("selected"),
    boundaryState: boundary("selected") };
  const rejection: AiRuntimeProductionFactV1 = { ...admission, tick: stage === "stamped_admission" ? 4 : 6,
    scheduledTick: null, outcome: { ...admission.outcome, kind: "rejected", reason: "invalid_owner",
      tick: stage === "stamped_admission" ? 4 : 6 }, boundaryStateBefore: boundary("admitted", true),
    boundaryState: boundary("released", true) };
  const facts: AiRuntimeProductionFactV1[] = [{ ...selected, decision: { ...selected.decision,
    acceptedIntents: [intent], decisions: [{ intent, outcome: "accepted", reason: "accepted" }] },
    boundaryState: boundary("selected") }, request];
  if (stage === "admission" || stage === "stamped_admission") {
    if (stage === "stamped_admission") facts.push({ ...rejection, boundaryStateBefore: boundary("selected"),
      boundaryState: boundary("selected") });
    facts.push({ ...receipt, event: { ...receipt.event, receipt: { status: "rejected", reason: "invalid_owner" } },
      boundaryStateBefore: boundary("selected"), boundaryState: boundary("released") });
  } else {
    facts.push({ ...admission, boundaryStateBefore: boundary("selected"), boundaryState: boundary("admitted", true) },
      { ...receipt, event: { ...receipt.event, receipt: { status: "dispatched", command } },
        boundaryStateBefore: boundary("admitted", true), boundaryState: boundary("admitted", true) }, rejection);
    if (stage === "application") facts.push({ kind: "command_delivered", sequence: 0, tick: 6, playerNumber: 1,
      command, boundaryState: boundary("released", true) });
  }
  return { ...base, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
