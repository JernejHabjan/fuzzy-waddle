import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionOperationFixture } from "./skirmish-ai-runtime-production-operation-fixture";
/** Invented distinct cancellation command and real-shaped refund interval; it proves no runtime cancellation policy. */
export function productionRefundOperationFixture() {
  const capture = productionOperationFixture("immediate");
  const purchase = capture.facts.find(
    (fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "finished"
  );
  const selected = capture.facts.find((fact) => fact.kind === "decision_selected");
  const applied = capture.facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied");
  if (
    !purchase ||
    purchase.kind !== "queue_resource" ||
    purchase.resource.emission.phase !== "finished" ||
    !purchase.boundaryState?.unspentClaims ||
    !selected ||
    !applied ||
    applied.kind !== "outcome"
  ) {
    throw new Error("synthetic_purchase_missing");
  }
  const command = {
    type: "CANCEL_PRODUCTION",
    queueIndex: 0,
    tick: 10,
    playerNumber: 1,
    actorIds: ["producer"],
    execution: {
      schemaVersion: 1,
      source: "ai",
      commandId: "cancel",
      authorityEpoch: 1,
      sequence: 4,
      intentId: "cancel",
      effectId: "cancel",
      commitmentKey: "ai:effect:cancel"
    }
  } satisfies GameCommand;
  const intent = {
    ...requireAiTestEntry(selected.decision.acceptedIntents, 0),
    intentId: "intent:cancel",
    effectId: "effect:cancel",
    proposedTick: 8,
    claims: [],
    kind: "cancel",
    actorId: "producer",
    queueIndex: 0
  } satisfies AiIntentV1;
  const identity = { ...selected.decision.identity, tick: 8, decisionSequence: 2 };
  const correlation = { intentId: "cancel", effectId: "cancel", commitmentKey: command.execution.commitmentKey };
  const base = { sequence: 0, tick: 8, playerNumber: 1 };
  const admission = {
    ...applied.outcome,
    ...command.execution,
    kind: "dispatched",
    reason: "accepted_for_dispatch",
    tick: 10
  } satisfies Extract<
    AiRuntimeProductionFactV1,
    {
      kind: "outcome";
    }
  >["outcome"];
  const resource = {
    ...purchase.resource,
    cancellationCommand: command,
    operation: "cancellation_refund" as const,
    remainingTimeMs: 100,
    emission: {
      operationId: 5,
      phase: "started" as const,
      requested: { food: 7 },
      before: { food: 93, wood: 100, stone: 100, minerals: 100 },
      snapshotRestoreInProgress: false
    }
  };
  const afterCash = { ...resource.emission.before, food: 100 };
  const boundaryState = {
    ...purchase.boundaryState,
    unspentClaims: {
      ...purchase.boundaryState.unspentClaims,
      entries: purchase.boundaryState.unspentClaims.entries.map((entry) => ({ ...entry, state: "released" as const }))
    }
  };
  const facts: AiRuntimeProductionFactV1[] = [
    ...capture.facts,
    {
      ...base,
      kind: "decision_selected",
      decision: {
        ...selected.decision,
        identity,
        acceptedIntents: [intent],
        decisions: [{ outcome: "accepted", reason: "accepted", intent }]
      }
    },
    {
      ...base,
      kind: "intent_dispatch",
      event: {
        kind: "requested",
        playerNumber: 1,
        correlation,
        command,
        proposedTick: 8,
        acceptedIntent: intent,
        claims: [],
        decisionIdentity: identity
      }
    },
    { ...base, kind: "outcome", outcome: admission, scheduledTick: 10 },
    {
      ...base,
      kind: "intent_dispatch",
      event: { kind: "finished", playerNumber: 1, correlation, receipt: { status: "dispatched", command } }
    },
    {
      ...base,
      tick: 10,
      kind: "outcome",
      outcome: { ...applied.outcome, tick: 10, kind: "cancelled", reason: "cancelled" },
      scheduledTick: null
    },
    { ...base, tick: 10, kind: "queue_resource", resource, boundaryState },
    {
      ...base,
      tick: 10,
      kind: "queue_resource",
      resource: {
        ...resource,
        emission: { ...resource.emission, phase: "callback", callbackOrdinal: 1, amounts: { food: 7 } }
      },
      boundaryState: { ...boundaryState, resources: afterCash }
    },
    {
      ...base,
      tick: 10,
      kind: "queue_resource",
      resource: {
        ...resource,
        emission: {
          ...resource.emission,
          phase: "finished",
          status: "returned",
          after: afterCash,
          callbackCount: 1,
          callbackLimitExceeded: false,
          nestedEmission: false,
          balanceMatches: true
        }
      },
      boundaryState: { ...boundaryState, resources: afterCash }
    },
    {
      ...base,
      tick: 10,
      kind: "outcome",
      scheduledTick: null,
      outcome: { ...admission, kind: "cancelled", reason: "cancelled", tick: 10 }
    },
    { ...base, tick: 10, kind: "command_delivered", command }
  ];
  return { ...capture, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
