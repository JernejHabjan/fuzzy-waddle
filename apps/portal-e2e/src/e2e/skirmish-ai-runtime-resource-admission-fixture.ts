import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { OrderType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import { resourceNeedAccountingFixture } from "./skirmish-ai-runtime-resource-need-accounting-fixture";

/** Producer-shaped read/start/result/request/admission/receipt/application ordering; not native execution evidence. */
export function resourceAdmissionFixture() {
  const f = resourceNeedAccountingFixture();
  const original = f.capture.facts.find((fact) => fact.kind === "decision_selected");
  if (!original || original.kind !== "decision_selected") throw new Error("resource_admission_selected_missing");
  const intent = { ...original.decision.acceptedIntents[0], proposedTick: 0 };
  if (intent.kind !== "assign_gatherers") throw new Error("resource_admission_intent_missing");
  const selected = {
    ...original,
    decision: {
      ...original.decision,
      acceptedIntents: [intent],
      decisions: [{ intent, reason: "accepted", outcome: "accepted" }]
    }
  } satisfies AiRuntimeProductionFactV1;
  const correlation = {
    intentId: intent.intentId.replace(/^intent:/, ""),
    effectId: intent.effectId.replace(/^effect:/, ""),
    commitmentKey: `ai:${intent.effectId}`
  };
  const command = {
    type: "ACTOR_ACTION",
    playerNumber: 1,
    tick: 0,
    actorIds: intent.actorIds,
    targetObjectIds: [intent.sourceActorId ?? ""],
    queue: false,
    orderType: OrderType.Gather,
    execution: {
      schemaVersion: 1,
      commandId: "gather-admission",
      source: "ai",
      authorityEpoch: selected.decision.identity.authorityEpoch,
      sequence: 1,
      ...correlation
    }
  } satisfies GameCommand;
  const common = { playerNumber: 1, tick: 0 };
  const outcome = {
    schemaVersion: 1 as const,
    reason: "accepted_for_dispatch" as const,
    tick: 0,
    playerNumber: 1,
    commandId: command.execution.commandId,
    authorityEpoch: command.execution.authorityEpoch,
    sequence: 1,
    ...correlation,
    actorIds: command.actorIds,
    worldLinkIds: []
  };
  const admission: AiRuntimeProductionFactV1[] = [
    {
      ...common,
      sequence: 5,
      kind: "intent_dispatch",
      event: {
        kind: "requested",
        playerNumber: 1,
        correlation,
        command,
        acceptedIntent: intent,
        claims: intent.claims,
        proposedTick: 0,
        decisionIdentity: selected.decision.identity
      }
    },
    { ...common, sequence: 6, kind: "outcome", outcome: { ...outcome, kind: "dispatched" }, scheduledTick: 0 },
    {
      ...common,
      sequence: 7,
      kind: "outcome",
      outcome: { ...outcome, kind: "applied", reason: "applied", actorIds: [command.actorIds[0]] },
      scheduledTick: null
    },
    {
      ...common,
      sequence: 8,
      kind: "intent_dispatch",
      event: { kind: "finished", playerNumber: 1, correlation, receipt: { status: "dispatched", command } }
    }
  ];
  const shift = (fact: AiRuntimeProductionFactV1): AiRuntimeProductionFactV1 =>
    fact.sequence < 5
      ? fact
      : fact.kind === "recipient_resource_mutation"
        ? {
            ...fact,
            sequence: fact.sequence + 4,
            mutation: { ...fact.mutation, entrySequence: fact.mutation.entrySequence + 4 }
          }
        : { ...fact, sequence: fact.sequence + 4 };
  const credit = {
    ...f.credit,
    fact: { ...f.credit.fact, sequence: 15 },
    contributions: f.credit.contributions.map((lot) => {
      const service = lot.gathering.serviceCommand;
      if (!service?.decision) throw new Error("resource_admission_contribution_missing");
      return {
        ...lot,
        gathering: { ...lot.gathering, serviceCommand: { ...service, acceptedIntent: intent, decision: selected } }
      };
    })
  };
  return {
    ...f,
    credit,
    command,
    selected,
    admission,
    capture: {
      ...f.capture,
      facts: [
        ...f.capture.facts.slice(0, 3),
        selected,
        ...admission,
        ...f.capture.facts.slice(4, -1).map(shift),
        credit.fact
      ],
      recipientResourceFacts: f.capture.recipientResourceFacts.map(shift),
      resourceCoverage: { ...f.capture.resourceCoverage, frontier: { tick: 0, captureSequence: 15 } }
    }
  };
}
