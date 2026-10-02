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

function army(control = false) {
  return Array.from({ length: control ? 6 : 4 }, (_, index) => ({
    actorId: `preset-${index}`, objectName: index < 2 || index >= 4 ? "frontline" : "ranged"
  }));
}

function checkpoint(tick: number, control = false, filled = tick >= 200): Checkpoint {
  const initial = army(control);
  const militaryActors = [...initial, ...(!control && filled
    ? [{ actorId: "new-1", objectName: "frontline" }, { actorId: "new-2", objectName: "frontline" }] : [])];
  return {
    tick, targetTick: tick, militaryActors,
    appliedCommands: !control && filled
      ? [1, 2].map((id) => ({ commandId: `command-${id}`, effectId: `effect:composition:effect:${id}` })) : [],
    demands: [{ demandId: "demand:composition:first-squad", purpose: "dated_ground_pressure", desired: 6,
      satisfied: militaryActors.length, queued: 0, constructing: 0, accepted: 0 }],
    militaryProducerQueues: [{ actorId: "producer", objectName: "barracks", capacity: 5, occupied: 0, queuedObjectNames: [] }]
  };
}

function evidence(control = false): Evidence {
  const initial = army(control);
  return {
    aiFaction: "Tivara", productionCompositionBranch: control ? "satisfied_control" : "fill_deficit",
    presetFixtureId: "composition", presetCreatedActorNames: initial.map((actor) => actor.objectName),
    presetCreatedActorIds: Object.fromEntries(initial.map((actor) => [actor.actorId, actor.actorId])),
    presetQueuedItemCount: 0, stopReason: "checkpoint_ceiling",
    checkpoints: [checkpoint(20, control), checkpoint(200, control), checkpoint(600, control)]
  };
}

test("PRO-04 requires new useful copies, applied effects, and a retained satisfied control", () => {
  expect(evaluateRuntimeProductionComposition(requirement, evidence())).toEqual([]);
  expect(evaluateRuntimeProductionComposition(requirement, evidence(true))).toEqual([]);
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
    ({ ...producer, occupied: 1, queuedObjectNames: ["frontline"] })) };
  expect(evaluateRuntimeProductionComposition(requirement, { ...variant,
    checkpoints: [...variant.checkpoints.slice(0, 2), excess] }))
    .toContain("production_composition_overproduction");
  const control = evidence(true);
  expect(evaluateRuntimeProductionComposition(requirement, { ...control,
    checkpoints: control.checkpoints.map((row) => ({ ...row, appliedCommands: loss.appliedCommands })) }))
    .toContain("production_composition_control_produced");
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
