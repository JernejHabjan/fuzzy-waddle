import { expect, test } from "@playwright/test";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionEffectRetentionFixture } from "./skirmish-ai-runtime-production-effect-retention-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { projectRuntimeProductionEffectRetention } from "./skirmish-ai-runtime-production-effect-retention-projection";

for (const family of ["production", "research"] as const) {
  test(`${family} retains ordered samples and accepted attribution while leaving usefulness and continuity open`, () => {
    const result = normalizeRuntimeProductionCausality(productionEffectRetentionFixture(family));
    expect(result.failures).toEqual([]);
    expect(result.effectRetention).toHaveLength(1);
    expect(result.effectRetention[0]).toMatchObject({ acceptedDecision: { playerNumber: 1 },
      completion: { originatingCommandId: "purchase" }, samples: [
        { tick: 10, state: "present", currentLevel: family === "production" ? 1 : null },
        { tick: 20, state: "present" }, { tick: 40, state: "present" }
      ] });
    expect(result.effectRetention[0]?.acceptedDemandId).toBe("demand:force");
    expect(result.gaps).toContain("production_effect_continuous_stability_missing");
    expect(result.gaps).toContain("production_effect_strategic_usefulness_missing");
  });
}

test("same-tick pre-terminal and unordered legacy samples cannot borrow a later native completion", () => {
  const capture = productionEffectRetentionFixture();
  const terminal = capture.facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "completed");
  if (!terminal) throw new Error("synthetic_terminal_missing");
  const snapshot = capture.snapshots[0];
  if (!snapshot) throw new Error("synthetic_snapshot_missing");
  const result = normalizeRuntimeProductionCausality({ ...capture, snapshots: [
    { ...snapshot, afterSequence: terminal.sequence - 1 },
    { ...snapshot, tick: 20, afterSequence: undefined }
  ] });
  expect(result.failures).toEqual([]);
  expect(result.effectRetention[0]?.samples).toEqual([]);
  expect(result.gaps).toContain("production_effect_snapshot_order_missing");
  expect(result.gaps).toContain("production_effect_post_terminal_samples_missing");
});

test("a missing product stays absent, and incomplete owned-world capture leaves absence unavailable", () => {
  const capture = productionEffectRetentionFixture();
  const snapshots = capture.snapshots.map((snapshot) => ({ ...snapshot, ownedActors: [],
    world: { snapshotRestoreInProgress: false, actors: [], catalog: [], gaps: [] } }));
  const absent = normalizeRuntimeProductionCausality({ ...capture, snapshots });
  expect(absent.failures).toEqual([]);
  expect(absent.effectRetention[0]?.samples.map((sample) => sample.state)).toEqual(["absent", "absent", "absent"]);
  const unavailable = normalizeRuntimeProductionCausality({ ...capture, snapshots: snapshots.map((snapshot) =>
    ({ ...snapshot, world: { ...snapshot.world, gaps: ["production_world_actor_overflow"] } })) });
  expect(unavailable.failures).toEqual([]);
  expect(unavailable.effectRetention[0]?.samples.every((sample) => sample.state === "unavailable")).toBe(true);
});

for (const defect of ["future_marker", "regressing_marker", "wrong_family", "reused_id", "unregistered_id", "restore"] as const) {
  test(`contradictory ${defect} samples suppress every normalized effect group`, () => {
    const capture = productionEffectRetentionFixture();
    const facts: AiRuntimeProductionFactV1[] = [...capture.facts];
    if (defect === "reused_id" || defect === "unregistered_id") {
      const registration = facts.find((fact) => fact.kind === "actor_registered");
      if (!registration || registration.kind !== "actor_registered" || !registration.actor.actorId) {
        throw new Error("synthetic_registration_missing");
      }
      const sequence = (facts.at(-1)?.sequence ?? 0) + 1;
      facts.push(defect === "reused_id" ? { ...registration, sequence, tick: 20 } : {
        kind: "actor_unregistered", sequence, tick: 20, playerNumber: 1,
        actorId: registration.actor.actorId, objectName: registration.actor.objectName
      });
    }
    const snapshots = capture.snapshots.map((snapshot, index) => {
      const world = snapshot.world;
      if (!world) throw new Error("synthetic_world_missing");
      return { ...snapshot, afterSequence: defect === "future_marker" ? 99999 :
        defect === "regressing_marker" && index === 2 ? 0 :
          index > 0 ? facts.at(-1)?.sequence : snapshot.afterSequence,
        world: { ...world, snapshotRestoreInProgress: defect === "restore", actors: world.actors.map((actor) =>
          defect === "wrong_family" ? { ...actor, canonicalObjectName: ObjectNames.AnkGuard } : actor) } };
    });
    const result = normalizeRuntimeProductionCausality({ ...capture, facts, snapshots });
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.effectRetention).toEqual([]); expect(result.completions).toEqual([]);
    expect(result.worldSnapshots).toEqual([]); expect(result.operations).toEqual([]);
    expect(result.spatialAuthority.paths).toEqual([]);
  });
}

test("later tech authority must retain the actual newly registered research", () => {
  const capture = productionEffectRetentionFixture("research");
  const result = normalizeRuntimeProductionCausality({ ...capture,
    snapshots: capture.snapshots.map((snapshot) => ({ ...snapshot, completedResearch: [] })) });
  expect(result.failures).toContain("production_effect_registered_research_missing");
  expect(result.effectRetention).toEqual([]); expect(result.completions).toEqual([]);
  const duplicate = normalizeRuntimeProductionCausality({ ...capture, snapshots: capture.snapshots.map((snapshot) =>
    ({ ...snapshot, completedResearch: [...snapshot.completedResearch, ...snapshot.completedResearch] })) });
  expect(duplicate.failures).toContain("production_world_research_invalid");
  expect(duplicate.effectRetention).toEqual([]);
});

test("component levels remain sampled values and do not rewrite completion identity", () => {
  const capture = productionEffectRetentionFixture();
  const snapshots = capture.snapshots.map((snapshot, index) => ({ ...snapshot,
    world: snapshot.world ? { ...snapshot.world,
      actors: snapshot.world.actors.map((actor) => ({ ...actor, currentLevel: index + 1 })) } : undefined }));
  const result = normalizeRuntimeProductionCausality({ ...capture, snapshots });
  expect(result.failures).toEqual([]);
  expect(result.effectRetention[0]?.samples.map((sample) => sample.currentLevel)).toEqual([1, 2, 3]);
  expect(result.effectRetention[0]?.completion.createdActor?.canonicalObjectName).toBe(ObjectNames.TivaraWorker);
});

test("report expansion loss remains explicit and cannot return a partial retention group", () => {
  const capture = productionEffectRetentionFixture();
  const result = normalizeRuntimeProductionCausality(capture);
  const completion = result.completions[0];
  if (!completion) throw new Error("synthetic_completion_missing");
  const overflow = projectRuntimeProductionEffectRetention(capture, result.commands,
    Array.from({ length: 257 }, () => completion), result.worldSnapshots);
  expect(overflow.effects).toEqual([]); expect(overflow.failures).toEqual([]);
  expect(overflow.gaps).toEqual(["production_effect_retention_overflow"]);
});
