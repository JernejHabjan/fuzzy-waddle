import { ResearchType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionQueueV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-queue-v1";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";

/** Invented research ordering and cash contracts only; neither runtime definition pricing nor registered tech is proven. */
export function researchQueueMutationFixture() {
  const source = productionQueueMutationFixture("cancel");
  const researchType = ResearchType.TivaraMacemanUpgradeLevel2;
  const intent = (value: AiIntentV1): AiIntentV1 => value.kind === "produce" ? {
    intentId: value.intentId, effectId: value.effectId, planId: value.planId, demandId: value.demandId,
    lane: value.lane, proposedTick: value.proposedTick, urgencyClass: value.urgencyClass, utility: value.utility,
    preconditions: value.preconditions, claims: value.claims, reasonCode: value.reasonCode,
    kind: "research", producerId: value.producerId, researchType
  } : value;
  const command = (value: GameCommand): GameCommand => value.type === "PRODUCTION" ? {
    type: "RESEARCH", researchType, tick: value.tick, playerNumber: value.playerNumber, actorIds: value.actorIds,
    execution: value.execution
  } : value.type === "CANCEL_PRODUCTION" ? { type: "CANCEL_RESEARCH", tick: value.tick,
    playerNumber: value.playerNumber, actorIds: value.actorIds, execution: value.execution } : value;
  const item = (value: AiRuntimeProductionQueueV1["lanes"][number]["items"][number]) =>
    value.commandId === "purchase" ? { ...value, objectName: null, researchType } : value;
  const queue = (value: AiRuntimeProductionQueueV1) => ({ ...value, lanes: value.lanes.map((lane) => ({ ...lane,
    items: lane.items.map(item) })) });
  let facts = source.facts.map((fact): AiRuntimeProductionFactV1 => {
    const boundaryState = fact.boundaryState ? { ...fact.boundaryState,
      queues: fact.boundaryState.queues?.map(queue) ?? null,
      unspentClaims: fact.boundaryState.unspentClaims ? { ...fact.boundaryState.unspentClaims,
        entries: fact.boundaryState.unspentClaims.entries.map((entry) => ({ ...entry, intent: intent(entry.intent) })) } : undefined
    } : undefined;
    const base = { ...fact, boundaryState };
    switch (fact.kind) {
      case "decision_selected": return { ...base, kind: fact.kind, decision: { ...fact.decision,
        acceptedIntents: fact.decision.acceptedIntents.map(intent),
        decisions: fact.decision.decisions.map((entry) => ({ ...entry, intent: intent(entry.intent) })) } };
      case "intent_dispatch": return { ...base, kind: fact.kind, event: fact.event.kind === "requested" ? {
        ...fact.event, command: command({ ...fact.event.command, tick: fact.event.proposedTick }),
        acceptedIntent: fact.event.acceptedIntent ?
          intent(fact.event.acceptedIntent) : undefined
      } : fact.event.kind === "finished" && fact.event.receipt.status === "dispatched" ? {
        ...fact.event, receipt: { status: "dispatched", command: command(fact.event.receipt.command) }
      } : fact.event };
      case "command_delivered": return { ...base, kind: fact.kind, command: command(fact.command) };
      case "queue_changed": return { ...base, kind: fact.kind, queue: queue(fact.queue) };
      case "queue_resource": return { ...base, kind: fact.kind, resource: { ...fact.resource, objectName: null, researchType,
        cancellationCommand: fact.resource.cancellationCommand ? { ...fact.resource.cancellationCommand,
          type: "CANCEL_RESEARCH" } : null } };
      case "queue_mutation": return { ...base, kind: fact.kind, mutation: { ...fact.mutation,
        item: fact.mutation.item ? item(fact.mutation.item) : null,
        cancellationCommand: fact.mutation.cancellationCommand ? { ...fact.mutation.cancellationCommand,
          type: "CANCEL_RESEARCH" } : null } };
      default: return base;
    }
  });
  const removing = facts.filter((fact) => fact.kind === "queue_mutation" && fact.mutation.operation === "cancel_remove");
  const refunds = facts.filter((fact) => fact.kind === "queue_resource" && fact.resource.operation === "cancellation_refund");
  const before = removing.find((fact) => fact.kind === "queue_mutation" && fact.mutation.phase === "before");
  if (!before?.boundaryState || refunds.length !== 3) throw new Error("synthetic_research_cancel_missing");
  const paid = before.boundaryState;
  const afterCash = { food: 97, wood: 100, stone: 100, minerals: 100 };
  const refundFacts = refunds.map((fact, index): AiRuntimeProductionFactV1 => ({ ...fact,
    boundaryState: { ...paid, resources: index === 0 ? paid.resources : afterCash }
  }));
  facts = facts.flatMap((fact) => refunds.includes(fact) ? [] : fact === before ? [...refundFacts,
    { ...fact, boundaryState: { ...paid, resources: afterCash } }] :
    removing.includes(fact) ? [{ ...fact, boundaryState: fact.boundaryState ? {
      ...fact.boundaryState, resources: afterCash } : undefined }] : [fact]);
  return { ...source, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
