import { expect, test } from "@playwright/test";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { hasNativeFieldFoodDelivery } from "./skirmish-ai-field-food-delivery";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";

/** Synthetic causality controls, never native recipe evidence. */
function stream(): AiRuntimeProductionFactV1[] {
  const identity = { actorId: "worker", objectName: "TivaraWorkerMale", canonicalObjectName: ObjectNames.TivaraWorker,
    playerNumber: 2, active: true, alive: true, indexed: true, finished: true };
  const field = { ...identity, actorId: "field", objectName: "Field", canonicalObjectName: ObjectNames.Field };
  const drain = { ...identity, actorId: "granary", objectName: "Granary", canonicalObjectName: ObjectNames.Granary };
  const common = { kind: "resource_service" as const, clockTick: 20, sceneActive: true, snapshotRestoreInProgress: false,
    source: identity, sourceInCaptureScene: true, targetInCaptureScene: true, cargoId: 1, attemptId: 1,
    lifetimeValid: true, gaps: [] };
  return [
    { kind: "spatial_authority", sequence: 1, tick: 20, playerNumber: 2, spatial: {
      ...common, phase: "cargo_changed", target: field, transferId: null,
      change: { reason: "added", resourceType: ResourceType.Food, delta: 5 },
      before: { amount: 0, resourceType: ResourceType.Food }, after: { amount: 5, resourceType: ResourceType.Food }
    } },
    { kind: "spatial_authority", sequence: 2, tick: 20, playerNumber: 2, spatial: {
      ...common, phase: "cargo_offered", target: drain, transferId: 1, cargo: { amount: 5, resourceType: ResourceType.Food }
    } },
    { kind: "spatial_authority", sequence: 3, tick: 20, playerNumber: 2, spatial: {
      ...common, phase: "resource_credit", target: drain, transferId: 1, emissionRestoreInProgress: false,
      resourceType: ResourceType.Food, amount: 5, channel: "drop_off", ownerArgument: 2, beneficiary: 2,
      status: "returned", before: { food: 0, wood: 10, stone: 10, minerals: 10 },
      after: { food: 5, wood: 10, stone: 10, minerals: 10 }, callbackAmounts: { food: 5 }, callbackCount: 1,
      interference: false, balanceMatches: true
    } }
  ];
}

test.describe("new-field delivered-food attribution", () => {
  test("the shared source reader enforces exact worker, deposit and source-owner bindings", () => {
    const contract = { sourceActorId: "field", sourceOwner: 2, playerNumber: 2,
      resourceType: ResourceType.Food, fromTick: 10, throughTick: 30, workerActorId: "worker", depositActorId: "granary" };
    expect(hasNativeSourceDelivery(stream(), contract)).toBe(true);
    for (const changed of [
      { workerActorId: "other-worker" }, { depositActorId: "other-deposit" }, { sourceOwner: null },
      { resourceType: ResourceType.Wood }, { throughTick: 19 }
    ]) expect(hasNativeSourceDelivery(stream(), { ...contract, ...changed })).toBe(false);
    const neutral = stream().map((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service" ||
      fact.spatial.phase !== "cargo_changed" || !fact.spatial.target ? fact : { ...fact,
        spatial: { ...fact.spatial, target: { ...fact.spatial.target, playerNumber: null } } });
    expect(hasNativeSourceDelivery(neutral, { ...contract, sourceOwner: null })).toBe(true);
  });
  test("requires actual extraction after completion and its exact successful offered transfer", () => {
    const facts = stream();
    expect(hasNativeFieldFoodDelivery(facts, "field", 10, 2)).toBe(true);
    expect(hasNativeFieldFoodDelivery(facts, "other-field", 10, 2)).toBe(false);
    expect(hasNativeFieldFoodDelivery(facts, "field", 21, 2)).toBe(false);
    expect(hasNativeFieldFoodDelivery(facts.slice(1), "field", 10, 2)).toBe(false);
    expect(hasNativeFieldFoodDelivery(facts.filter((fact) => fact.sequence !== 2), "field", 10, 2)).toBe(false);
  });

  test("rejects unrelated transfers, restored observations and balance labels without actual matching cash", () => {
    for (const changed of [
      { transferId: 2 }, { sourceInCaptureScene: false }, { snapshotRestoreInProgress: true },
      { callbackCount: 0 }, { after: { food: 0, wood: 10, stone: 10, minerals: 10 } }
    ]) {
      const facts = stream().map((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service" ||
        fact.spatial.phase !== "resource_credit" ? fact : { ...fact, spatial: { ...fact.spatial, ...changed } });
      expect(hasNativeFieldFoodDelivery(facts, "field", 10, 2)).toBe(false);
    }
  });

  test("cannot credit two fields from a cargo later mixed with another source or reset", () => {
    for (const contamination of ["other-field", "reset"] as const) {
      const facts = stream(), first = facts[0];
      if (first?.kind !== "spatial_authority" || first.spatial.kind !== "resource_service" ||
          first.spatial.phase !== "cargo_changed" || !first.spatial.target) throw new Error("authored harvest missing");
      const between = { ...first, sequence: 2, spatial: { ...first.spatial,
        target: { ...first.spatial.target, actorId: contamination === "reset" ? "field" : contamination },
        change: { ...first.spatial.change, reason: contamination === "reset" ? "reset" as const : "added" as const }
      } };
      const mixed = [first, between, ...facts.slice(1).map((fact) => ({ ...fact, sequence: fact.sequence + 1 }))];
      expect(hasNativeFieldFoodDelivery(mixed, "field", 10, 2)).toBe(false);
    }
  });

  test("refuses delivery credited to a destroyed or unindexed deposit", () => {
    for (const changed of [{ alive: false }, { active: false }, { indexed: false }, { finished: false }]) {
      const facts = stream().map((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service" ||
        fact.spatial.phase !== "resource_credit" || !fact.spatial.target ? fact : {
          ...fact, spatial: { ...fact.spatial, target: { ...fact.spatial.target, ...changed } }
        });
      expect(hasNativeFieldFoodDelivery(facts, "field", 10, 2)).toBe(false);
    }
  });
});
