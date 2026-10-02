import { expect, test } from "@playwright/test";
import { evaluateRuntimeProductionComposition } from "./skirmish-ai-runtime-production-composition-evaluation";
import { isEvidenceStopSafe } from "./skirmish-ai-runtime-evidence-stop";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";

const requirement = {
  latestTick: 600, stableForTicks: 200, targetMilitaryCount: 6, additionalUnitCount: 2,
  unitObjectNameByFaction: { Tivara: "frontline", Skaduwee: "frontline" }
} satisfies NonNullable<RuntimeAssertionV1["requiredProductionComposition"]>;

type Evidence = Parameters<typeof evaluateRuntimeProductionComposition>[1];
type Checkpoint = Evidence["checkpoints"][number];
type Branch = "fill_deficit" | "satisfied_control" | "seeded_queue_control";

function army(control = false) {
  return Array.from({ length: control ? 6 : 4 }, (_, index) => ({
    actorId: `preset-${index}`, objectName: index < 2 || index >= 4 ? "frontline" : "ranged"
  }));
}

function checkpoint(tick: number, branch: Branch = "fill_deficit", filled = tick >= 200): Checkpoint {
  const control = branch === "satisfied_control";
  const initial = army(control);
  const seededComplete = branch === "seeded_queue_control" && filled;
  const militaryActors = [...initial, ...((!control && branch === "fill_deficit" && filled) || seededComplete
    ? [{ actorId: "new-1", objectName: "frontline" }, { actorId: "new-2", objectName: "frontline" }] : [])];
  return {
    tick, targetTick: tick, militaryActors,
    appliedCommands: branch === "fill_deficit" && filled
      ? [1, 2].map((id) => ({ commandId: `command-${id}`, effectId: `effect:composition:effect:${id}` })) : [],
    demands: [{ demandId: "demand:composition:first-squad", purpose: "dated_ground_pressure", desired: 6,
      satisfied: militaryActors.length, queued: branch === "seeded_queue_control" && !seededComplete ? 2 : 0,
      constructing: 0, accepted: 0 }],
    militaryProducerQueues: [1, 2].map((producer) => {
      const items = branch === "seeded_queue_control" && !seededComplete
        ? [{ itemId: `producer-${producer}:0:Production`, kind: "production" as const,
            objectName: "frontline", researchType: null }]
        : [];
      return { actorId: `producer-${producer}`, objectName: "barracks", capacity: 5,
        occupied: items.length, queuedObjectNames: items.map((item) => item.objectName!), queuedItems: items };
    })
  };
}

function evidence(branch: Branch = "fill_deficit"): Evidence {
  const control = branch === "satisfied_control";
  const initial = army(control);
  const seeded = branch === "seeded_queue_control";
  return {
    aiFaction: "Tivara", productionCompositionBranch: branch,
    presetFixtureId: "composition", presetCreatedActorNames: [...initial.map((actor) => actor.objectName), "barracks", "barracks"],
    presetCreatedActorIds: Object.fromEntries([
      ...initial.map((actor) => [actor.actorId, actor.actorId] as const),
      ["producer-1", "producer-1"] as const,
      ["producer-2", "producer-2"] as const
    ]),
    presetQueuedItemCount: seeded ? 2 : 0,
    presetInitialQueueItems: seeded ? [1, 2].map((producer) => ({
      producerFixtureActorId: `producer-${producer}`, producerActorId: `producer-${producer}`,
      itemId: `producer-${producer}:0:Production`, kind: "production" as const,
      objectName: "frontline", researchType: null
    })) : [],
    stopReason: "checkpoint_ceiling",
    checkpoints: seeded
      ? [checkpoint(20, branch, false), checkpoint(200, branch, false), checkpoint(400, branch), checkpoint(600, branch)]
      : [checkpoint(20, branch), checkpoint(200, branch), checkpoint(600, branch)]
  };
}

test("PRO-04 requires new useful copies, applied effects, and a retained satisfied control", () => {
  expect(evaluateRuntimeProductionComposition(requirement, evidence())).toEqual([]);
  expect(evaluateRuntimeProductionComposition(requirement, evidence("satisfied_control"))).toEqual([]);
  expect(evaluateRuntimeProductionComposition(requirement, evidence("seeded_queue_control"))).toEqual([]);
});

test("ledger fulfillment and preset copies cannot substitute for new produced identities", () => {
  const variant = evidence();
  const fake = variant.checkpoints.map((row) => ({ ...row, militaryActors: army(),
    demands: row.demands.map((demand) => ({ ...demand, satisfied: 6 })) }));
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, checkpoints: fake }))
    .toContain("production_composition_useful_copies_missing");
});

test("ready copies without real composition application do not pass", () => {
  for (const effectId of ["effect:unrelated", "effect:composition:effect:1"]) {
    const variant = evidence();
    const rows = variant.checkpoints.map((row) => ({ ...row,
      appliedCommands: row.appliedCommands.map((command) => ({ ...command, effectId })) }));
    expect(evaluateRuntimeProductionComposition(requirement, { ...variant, checkpoints: rows }))
      .toContain("production_composition_applied_effect_count");
  }
});

test("a substituted product, missing identities or mismatched initial world fails closed", () => {
  const variant = evidence();
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, presetCreatedActorIds: {} }))
    .toContain("production_composition_initial_setup");
  const rows = variant.checkpoints.map((row) => ({ ...row, militaryActors: row.militaryActors?.map((actor) =>
    actor.actorId === "new-2" ? { ...actor, objectName: "ranged" } : actor) }));
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, checkpoints: rows }))
    .toContain("production_composition_wrong_product");
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    checkpoints: variant.checkpoints.map((row) => ({ ...row, militaryActors: undefined })) }))
    .toContain("production_composition_actor_evidence_missing");
});

test("target satisfaction retains the full horizon and a settled stability window", () => {
  const variant = evidence();
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, checkpoints: variant.checkpoints.slice(0, 2) }))
    .toContain("production_composition_horizon_missing");
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, stopReason: "evidence_satisfied" }))
    .toContain("production_composition_horizon_missing");
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    checkpoints: [checkpoint(20), checkpoint(500), checkpoint(600)] }))
    .toContain("production_composition_stability_missing");
  expect(isEvidenceStopSafe({ minimumDecisions: 1, minimumAppliedCommands: 1,
    requiredAiFactions: ["Tivara"], requiredProductionComposition: requirement })).toBe(false);
});

test("loss, later excess and control production cannot hide behind a fulfilled demand", () => {
  const variant = evidence();
  const loss = checkpoint(600);
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    checkpoints: [...variant.checkpoints.slice(0, 2), { ...loss, militaryActors: army() }] }))
    .toContain("production_composition_force_not_retained");
  const excess = { ...loss, militaryProducerQueues: loss.militaryProducerQueues.map((producer) =>
    ({ ...producer, occupied: 1, queuedObjectNames: ["frontline"], queuedItems: [{
      itemId: `${producer.actorId}:0:Production`, kind: "production" as const,
      objectName: "frontline", researchType: null
    }] })) };
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    checkpoints: [...variant.checkpoints.slice(0, 2), excess] }))
    .toContain("production_composition_overproduction");
  const control = evidence("satisfied_control");
  expect(evaluateRuntimeProductionComposition(requirement, { ...control,
    checkpoints: control.checkpoints.map((row) => ({ ...row, appliedCommands: loss.appliedCommands })) }))
    .toContain("production_composition_control_produced");
});

test("seeded queues must complete their captured identities without AI composition application", () => {
  const variant = evidence("seeded_queue_control");
  const unfinished = variant.checkpoints.map((row) => row.targetTick === 600
    ? { ...row, militaryProducerQueues: row.militaryProducerQueues.map((producer) => ({
        ...producer, occupied: 1, queuedObjectNames: ["frontline"], queuedItems: [{
          itemId: `unseeded-${producer.actorId}:0:Production`, kind: "production" as const,
          objectName: "frontline", researchType: null
        }]
      })) }
    : row);
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, checkpoints: unfinished }))
    .toContain("production_composition_seeded_control_unexpected_queue");
  const noApplication = { ...variant, checkpoints: variant.checkpoints.map((row) => ({
    ...row, militaryActors: row.militaryActors?.filter((actor) => actor.actorId !== "new-2")
  })) };
  expect(evaluateRuntimeProductionComposition(requirement, noApplication))
    .toContain("production_composition_useful_copies_missing");
  const aiProduced = { ...variant, checkpoints: variant.checkpoints.map((row) => ({
    ...row,
    appliedCommands: [{ commandId: "unexpected", effectId: "effect:composition:effect:unexpected" }]
  })) };
  expect(evaluateRuntimeProductionComposition(requirement, aiProduced))
    .toContain("production_composition_seeded_control_applied_ai_work");
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    presetInitialQueueItems: variant.presetInitialQueueItems.map((item) => ({ ...item, objectName: "ranged" })) }))
    .toContain("production_composition_initial_setup");
});

test("changing the target or accepting a missing causal branch is not composition evidence", () => {
  const variant = evidence();
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant, productionCompositionBranch: undefined }))
    .toContain("production_composition_branch_missing");
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    checkpoints: variant.checkpoints.map((row) => ({ ...row,
      demands: row.demands.map((demand) => ({ ...demand, desired: 8 })) })) }))
    .toContain("production_composition_target_changed_or_missing");
});
