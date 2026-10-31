import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { ObjectNames, ResourceType, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";

/** Synthetic observer inputs only; these do not represent a relayed or paid Phaser world. */
export function pendingCommandIntent(suffix = "one"): AiIntentV1 {
  return {
    kind: "produce", intentId: `intent:${suffix}`, effectId: `effect:${suffix}`, planId: "plan:force",
    demandId: "demand:force", lane: "supply_production", proposedTick: 99, urgencyClass: 2, utility: 10,
    preconditions: [], claims: [{ kind: "resource", claimId: `claim:${suffix}`, resourceType: ResourceType.Food, amount: 35 }],
    reasonCode: "force", producerId: "producer", objectName: ObjectNames.TivaraWorker
  };
}

export function pendingCommandRequest(suffix = "one", actorIds = ["producer"]):
  Extract<AiIntentCommandDispatchEvent, { kind: "requested" }> {
  const intent = pendingCommandIntent(suffix);
  return { kind: "requested", playerNumber: 2, proposedTick: intent.proposedTick, claims: intent.claims,
    command: { type: "PRODUCTION", playerNumber: 2, actorIds, actorName: ObjectNames.TivaraWorker },
    correlation: { intentId: suffix, effectId: suffix, commitmentKey: `ai:effect:${suffix}` } };
}

export function pendingCommandOutcome(kind: GameCommandOutcome["kind"] = "dispatched", suffix = "one", tick = 102,
  actorIds = ["producer"]): GameCommandOutcome {
  return { schemaVersion: 1, kind, reason: kind === "dispatched" ? "accepted_for_dispatch" : "applied", tick,
    playerNumber: 2, commandId: `2:1:1:match:${suffix}`, commitmentKey: `ai:effect:${suffix}`,
    intentId: suffix, effectId: suffix, authorityEpoch: 1, sequence: 1, actorIds, worldLinkIds: [] };
}

export function pendingCommandFinished(suffix = "one", tick = 102):
  Extract<AiIntentCommandDispatchEvent, { kind: "finished" }> {
  const request = pendingCommandRequest(suffix);
  return { kind: "finished", playerNumber: 2, correlation: request.correlation,
    receipt: { status: "dispatched", command: { ...request.command, tick, execution: {
      schemaVersion: 1, commandId: `2:1:1:match:${suffix}`, commitmentKey: request.correlation.commitmentKey,
      intentId: suffix, effectId: suffix, authorityEpoch: 1, sequence: 1, source: "ai"
    } } } };
}
