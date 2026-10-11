import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { OrderType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeRouteOrderV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-route-order-v1";
import { producerRouteFixture } from "./skirmish-ai-runtime-producer-route-fixture";

/** Synthetic admission/selected demand only; supplies no executed movement or independently observed useful service. */
export function routeOrderFixture(rally = false) {
  const f = producerRouteFixture(), playerNumber = 1, actorIds = [f.product.actorId ?? ""];
  const selected = f.capture.facts.find((fact) => fact.kind === "decision_selected");
  if (!selected || selected.kind !== "decision_selected") throw new Error("synthetic_order_decision_missing");
  const intent: AiIntentV1 = { kind: "move", actorIds, logicalPosition: { x: 8, y: 9, z: 0 },
    intentId: "intent:service", effectId: "effect:service", planId: "plan:service", demandId: "demand:service",
    lane: "essential_economy", proposedTick: 10, urgencyClass: 1, utility: 1,
    preconditions: [], claims: [], reasonCode: "synthetic_service" };
  const command: GameCommand = { type: "ACTOR_ACTION", tick: 10, playerNumber, actorIds, orderType: OrderType.Move,
    tileVec3: { x: 8, y: 9, z: 0 }, queue: false, execution: { schemaVersion: 1, commandId: "service", source: "ai",
      intentId: "service", effectId: "service", commitmentKey: "ai:effect:service", authorityEpoch: 0, sequence: 41 } };
  if (!command.execution || !command.tileVec3) throw new Error("synthetic_service_stamp_missing");
  const correlation = { intentId: "service", effectId: "service", commitmentKey: command.execution.commitmentKey };
  const identity = { playerNumber, tick: 10, generation: 1, decisionSequence: 41, authorityEpoch: 0 };
  const order: AiRuntimeRouteOrderV1 = { orderId: 1, orderType: OrderType.Move, target: null, targetTile: command.tileVec3,
    commandContext: rally ? null : { execution: command.execution, playerNumber, actorIds },
    originOutputId: null, admissionObserved: true };
  const envelope = { sequence: 0, tick: 10, playerNumber };
  const outcome = (kind: "applied" | "dispatched"): AiRuntimeProductionFactV1 => ({ ...envelope, kind: "outcome",
    scheduledTick: kind === "dispatched" ? 10 : null, outcome: { ...command.execution!, schemaVersion: 1, commandId: "service",
      commitmentKey: correlation.commitmentKey, authorityEpoch: 0, sequence: 41, playerNumber, actorIds, worldLinkIds: [],
      tick: 10, kind, reason: kind === "dispatched" ? "accepted_for_dispatch" : "applied" } });
  const admission = f.fact({ ...f.requested, kind: "route_order", source: f.product, order });
  const boundaries: AiRuntimeProductionFactV1[] = rally ? [admission,
    f.fact({ ...f.requested, kind: "route_rally_order", source: f.product, outputId: 1, orderId: 1 })] : [
    { ...envelope, kind: "decision_selected", decision: { ...selected.decision, identity, input: undefined,
      acceptedIntents: [intent], decisions: [{ outcome: "accepted", reason: "accepted", intent }],
      economyProduction: { ...selected.decision.economyProduction, demands: [{ demandId: "demand:service", purpose: "service",
        capabilityOrRole: "movement", unit: "work_per_horizon", desired: 1, satisfiedActorIds: [], queuedIds: [], constructingIds: [],
        acceptedNotObservedEffectIds: [], preferredObjectNames: [], resourceObligations: {} }] } } },
    { ...envelope, kind: "intent_dispatch", event: { kind: "requested", playerNumber, correlation, command,
      acceptedIntent: intent, decisionIdentity: identity, claims: [], proposedTick: 10 } }, outcome("dispatched"), admission,
    outcome("applied"), { ...envelope, kind: "command_delivered", command },
    { ...envelope, kind: "intent_dispatch", event: { kind: "finished", playerNumber, correlation, receipt: { status: "dispatched", command } } }
  ];
  const currentOrder = { ...order, originOutputId: rally ? 1 : null };
  const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path") return [fact];
    const path = { ...fact, spatial: { ...fact.spatial, currentOrder } };
    return fact.spatial.phase === "requested" ? [...boundaries, path] : [path];
  }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  return { ...f, order, command, currentOrder, capture: { ...f.capture, facts } };
}
