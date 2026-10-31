import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import { expansionWorld } from "./skirmish-ai-expansion-world";
import { evaluateExpansionPressurePairs } from "./skirmish-ai-expansion-pressure-pairs";
import { nativeDamageMatches } from "./skirmish-ai-native-damage";
import { expansionPressureResolution, nativeRetreatPrecedesLoss } from "./skirmish-ai-expansion-pressure-resolution";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

const fixture: RuntimeFixtureV1 = JSON.parse(readFileSync(
  resolve(__dirname, "../../../../tools/ai/fixtures/expansion-pressure-runtime.json"), "utf8"
));

function damage(tick = 80): Extract<AiRuntimeProductionFactV1, { kind: "native_damage" }> {
  const target = { actorId: "original-raider", playerNumber: 1, objectName: "SkaduweeWarriorMale",
    canonicalObjectName: ObjectNames.SkaduweeWarriorMale, active: true, alive: false, finished: true, indexed: false };
  return { kind: "native_damage", sequence: 2, tick, playerNumber: 1, damage: {
    target, initiator: { ...target, actorId: "defender", playerNumber: 2, alive: true, indexed: true },
    targetInCaptureScene: true, initiatorInCaptureScene: true, amount: 20, healthAfter: 0, armourAfter: 0,
    damageTick: tick, sceneActive: true, snapshotRestoreInProgress: false
  } };
}

function capture(facts: readonly AiRuntimeProductionFactV1[]): AiRuntimeProductionCaptureV1 {
  return { schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 1,
    droppedFactCount: 0, droppedSnapshotCount: 0, gaps: [], snapshots: [], facts };
}

test("the full matrix declaration and standalone owner factories describe the same eight native worlds", () => {
  const assertion = fixture.assertions["EXP-02"], contract = assertion?.requiredExpansionPressure;
  // The Node tooling suite checks the schema; this browser-side control checks the independent world factory.
  expect(fixture.recipe.variants).toHaveLength(8);
  for (const variant of fixture.recipe.variants) {
    const branch = contract?.branchByVariant[variant.id];
    if (!branch) throw new Error("authored expansion branch missing");
    expect(variant.presetWorld).toEqual(expansionWorld(variant.aiFaction, branch).recipe.variants[0]?.presetWorld);
    if (branch === "pressure_withdrawn") {
      expect(variant.presetWorld?.controls?.filter((control) => control.id.startsWith("withdraw-home-pressure"))
        .every((control) => control.requestTick === 440 && control.applicationTick === 440)).toBe(true);
    }
  }
  const failures = evaluateExpansionPressurePairs(fixture, []);
  expect(failures.filter((failure) => failure.startsWith("expansion_pressure_variant_missing:"))).toHaveLength(8);
  expect(failures).toContain("expansion_pressure_productive_safe_pair_missing:Tivara");
});

test("combat recovery requires the original native death plus AI-owned lethal damage in the same tick", () => {
  const hit = damage();
  const loss: AiRuntimeProductionFactV1 = { kind: "actor_unregistered", sequence: 1, tick: 80, playerNumber: 1,
    actorId: "original-raider", objectName: "SkaduweeWarriorMale", actor: hit.damage.target };
  // Native death/unregistration is synchronous inside takeDamage, before ScoreDamage is emitted.
  expect(expansionPressureResolution(capture([loss, hit]), ["original-raider"], true))
    .toEqual({ resolvedTick: 80, resolvedSequence: 2, failures: [] });
  for (const facts of [[loss], [hit], [loss, damage(81)]]) {
    expect(expansionPressureResolution(capture(facts), ["original-raider"], true).resolvedTick).toBeUndefined();
  }
  expect(expansionPressureResolution(capture([loss, hit]), ["original-raider", "surviving-raider"], true).resolvedTick)
    .toBeUndefined();
  expect(expansionPressureResolution(capture([loss, hit]), [], true).resolvedTick).toBeUndefined();
});

test("a later attacker death does not erase a previously completed physical retreat", () => {
  expect(nativeRetreatPrecedesLoss(894, 1689)).toBe(true);
  expect(nativeRetreatPrecedesLoss(1689, 894)).toBe(false);
  expect(nativeRetreatPrecedesLoss(894, undefined)).toBe(true);
});

test("foreign/restored damage, unrelated ownership and missing health cannot supply a native combat verdict", () => {
  expect(nativeDamageMatches(damage(), "original-raider", 2, "defender")).toBe(true);
  for (const changed of [
    { damageTick: 79 }, { snapshotRestoreInProgress: true }, { sceneActive: false },
    { initiatorInCaptureScene: false }, { targetInCaptureScene: false }, { healthAfter: null }, { initiator: null }, { amount: 0 }
  ]) {
    expect(nativeDamageMatches({ ...damage(), damage: { ...damage().damage, ...changed } }, "original-raider", 2)).toBe(false);
  }
  expect(nativeDamageMatches(damage(), "other-raider", 2)).toBe(false);
  expect(nativeDamageMatches(damage(), "original-raider", 1)).toBe(false);
});

test("an unavailable withdrawal after native death cannot masquerade as measured retreat", () => {
  const hit = damage();
  const facts: AiRuntimeProductionFactV1[] = [
    { kind: "actor_unregistered", sequence: 1, tick: 80, playerNumber: 1, actorId: "original-raider",
      objectName: "SkaduweeWarriorMale", actor: hit.damage.target },
    hit,
    { kind: "preset_control", sequence: 3, tick: 200, playerNumber: 1, control: {
      id: "withdraw-home-pressure", actorId: "original-raider", playerNumber: 1, phase: "unavailable",
      requestedTick: 200, scheduledTick: 200, setupItemId: null, command: null, outcomes: []
    } }
  ];
  expect(expansionPressureResolution(capture(facts), ["original-raider"], false).failures)
    .toContain("expansion_withdrawal_branch_has_no_native_survivor_retreat");
});
