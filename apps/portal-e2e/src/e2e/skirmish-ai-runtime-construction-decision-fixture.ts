import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ConstructCommand, GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";
import { productionDecisionFixture } from "./skirmish-ai-runtime-production-decision-fixture";

/** Synthetic accepted two-builder construct; never a legal live build, priced catalog or fresh topology proof. */
export function constructionDecisionFixture() {
  const f = productionSpatialFixture();
  const intent = { kind: "construct", intentId: "intent:construct", effectId: "effect:construct", planId: "plan:force",
    demandId: "demand:force", lane: "supply_production", proposedTick: 18, urgencyClass: 2, utility: 10,
    preconditions: [], claims: [], reasonCode: "synthetic_construct", builderIds: ["builder", "other-builder"],
    objectName: f.placement.command.actorName, logicalPosition: f.placement.command.tileVec3, siteKey: f.placement.command.siteKey
  } satisfies Extract<AiIntentV1, { kind: "construct" }>;
  const command = { ...f.placement.command, actorIds: intent.builderIds, execution: { ...f.placement.command.execution,
    intentId: "construct", effectId: "construct", commitmentKey: "ai:effect:construct" } } satisfies ConstructCommand;
  const correlation = { intentId: "construct", effectId: "construct", commitmentKey: "ai:effect:construct" };
  const identity = { playerNumber: 1, tick: 18, generation: 1, decisionSequence: 1, authorityEpoch: 0 };
  const selected = productionDecisionFixture().facts.find((fact) => fact.kind === "decision_selected");
  if (!selected || selected.kind !== "decision_selected") throw new Error("synthetic_selected_missing");
  const outcome = { ...command.execution, schemaVersion: 1, tick: 20, playerNumber: 1, actorIds: command.actorIds,
    kind: "applied", reason: "applied", worldLinkIds: ["site"] } satisfies GameCommandOutcome;
  const placement = { ...f.placement, command };
  const facts: AiRuntimeProductionFactV1[] = [
    { ...selected, tick: 18, decision: { ...selected.decision, identity, acceptedIntents: [intent],
      decisions: [{ outcome: "accepted", reason: "accepted", intent }] } },
    { sequence: 0, tick: 18, playerNumber: 1, kind: "intent_dispatch", event: { kind: "requested", playerNumber: 1,
      command, correlation, claims: intent.claims, proposedTick: 18, acceptedIntent: intent, decisionIdentity: identity } },
    { sequence: 0, tick: 18, playerNumber: 1, kind: "outcome", scheduledTick: 20,
      outcome: { ...outcome, kind: "dispatched", reason: "accepted_for_dispatch", worldLinkIds: [] } },
    { sequence: 0, tick: 18, playerNumber: 1, kind: "intent_dispatch", event: { kind: "finished", playerNumber: 1,
      correlation, receipt: { status: "dispatched", command } } },
    f.fact(placement, 0), f.fact(f.requested, 0),
    { sequence: 0, tick: 20, playerNumber: 1, kind: "outcome", scheduledTick: null, outcome },
    { sequence: 0, tick: 20, playerNumber: 1, kind: "command_delivered", command }, f.fact(f.resolved, 0)
  ];
  return { ...f.capture, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
