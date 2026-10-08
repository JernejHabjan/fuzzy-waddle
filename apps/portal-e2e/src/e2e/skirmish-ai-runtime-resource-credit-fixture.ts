import { ResourceType, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionSpatialV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-spatial-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { routeOrderFixture } from "./skirmish-ai-runtime-route-order-fixture";

/** Synthetic native intervals with one reused admitted order; movement demand supplies identity, never gather usefulness. */
export function resourceCreditFixture(oldCargo = 0, rally = false, immediate = false) {
  const f = routeOrderFixture(rally);
  const common = { clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false, gaps: [],
    source: f.product, target: f.producer, sourceInCaptureScene: true, targetInCaptureScene: true, lifetimeValid: true };
  const sample = (amount: number) => ({ amount, resourceType: amount > 0 ? ResourceType.Wood : null });
  const attempt = (attemptId: number, operation: "gather" | "drop_off", phase: "started" | "resolved", amount: number | null) =>
    ({ ...common, kind: "service_attempt", attemptId, operation, phase, amount,
      order: { ...f.currentOrder, orderType: operation === "gather" ? OrderType.Gather : OrderType.ReturnResources, target: f.producer } }
      satisfies AiRuntimeProductionSpatialV1);
  const addition = (attemptId: number, before: number, delta: number) => ({ ...common, kind: "resource_service", phase: "cargo_changed",
    cargoId: 1, attemptId, transferId: null, before: sample(before), after: sample(before + delta),
    change: { reason: "added", resourceType: ResourceType.Wood, delta } } satisfies AiRuntimeProductionSpatialV1);
  const entry = (attemptId: number, amount: number) => ({ ...common, kind: "resource_service", phase: "cargo_started",
    cargoId: 1, attemptId, transferId: null, cargo: sample(amount) } satisfies AiRuntimeProductionSpatialV1);
  const amount = oldCargo + 3, deliveryId = immediate ? 1 : 3;
  const offer = { ...common, kind: "resource_service", phase: "cargo_offered", cargoId: 1, attemptId: deliveryId,
    transferId: 1, cargo: sample(amount) } satisfies AiRuntimeProductionSpatialV1;
  const credit = { ...common, kind: "resource_service", phase: "resource_credit", cargoId: 1, attemptId: deliveryId, transferId: 1,
    channel: immediate ? "immediate" : "drop_off", resourceType: ResourceType.Wood, amount, ownerArgument: 2, beneficiary: 2,
    status: "returned", before: { food: 100, wood: 100, stone: 100, minerals: 100 },
    after: { food: 100, wood: 100 + amount, stone: 100, minerals: 100 }, callbackAmounts: { wood: amount }, callbackCount: 1,
    interference: false, emissionRestoreInProgress: false, balanceMatches: true } satisfies AiRuntimeProductionSpatialV1;
  const removal = { ...common, kind: "resource_service", phase: "cargo_changed", cargoId: 1, attemptId: deliveryId, transferId: 1,
    change: { reason: "removed", resourceType: ResourceType.Wood, delta: amount }, before: sample(amount), after: sample(0) }
    satisfies AiRuntimeProductionSpatialV1;
  const tail: AiRuntimeProductionSpatialV1[] = immediate ? [attempt(1, "gather", "started", null), entry(1, oldCargo),
    addition(1, oldCargo, 3), offer, credit, removal, attempt(1, "gather", "resolved", 3)] :
    [attempt(1, "gather", "started", null), entry(1, oldCargo), addition(1, oldCargo, 1),
    attempt(1, "gather", "resolved", 1), attempt(2, "gather", "started", null), entry(2, oldCargo + 1), addition(2, oldCargo + 1, 2),
    attempt(2, "gather", "resolved", 2), attempt(3, "drop_off", "started", null), entry(3, amount), offer, credit, removal,
    attempt(3, "drop_off", "resolved", amount)];
  const capture = { ...f.capture,
    facts: [...f.capture.facts, ...tail.map(f.fact)].map((fact, index) => ({ ...fact, sequence: index + 1 })) };
  const rewrite = (change: (fact: AiRuntimeProductionFactV1) => readonly AiRuntimeProductionFactV1[]) => ({ ...capture,
    facts: capture.facts.flatMap(change).map((fact, index) => ({ ...fact, sequence: index + 1 })) });
  return { ...f, common, offer, credit, removal, capture, rewrite };
}
