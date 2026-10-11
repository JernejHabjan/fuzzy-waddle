import { expect, test } from "@playwright/test";
import { HIGH_GROUND_THRESHOLD } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/high-ground-constants";
import type { AiDecisionProducerExposureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-producer-exposure-v1";
import { productionConsumedDecisionFixture } from "./skirmish-ai-runtime-production-consumed-decision-fixture";
import { normalizeRuntimeProductionFairInput } from "./skirmish-ai-runtime-production-fair-input-normalization";
import { normalizeRuntimeProducerExposure } from "./skirmish-ai-runtime-producer-exposure";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

/** Synthetic native-input shapes only, never a live producer safety or resilience proof. */
function fixture() {
  const f = productionConsumedDecisionFixture();
  if (!f.input.observation) throw new Error("synthetic_input_missing");
  const producer = f.input.observation.actors[0];
  const enemy = f.input.observation.actors[1];
  if (!producer || !enemy) throw new Error("synthetic_pair_missing");
  const exposure = { tick: 20, generation: 1, pairs: [{ producerActorId: "producer", threatActorId: "enemy", status: "known",
    attackIndex: 0, range: 4, positioningRange: 4, highGroundBonus: 1, attackerElevation: HIGH_GROUND_THRESHOLD,
    targetElevation: 0, distanceTiles: 4, withinSelectedWeaponBand: true }], gaps: [] } satisfies AiDecisionProducerExposureV1;
  const observation = { ...f.input.observation, actors: [{ ...producer, capabilities: [...producer.capabilities,
    { id: "produce", family: "produce", level: 1, domains: [], targetDomains: [],
      capacity: { status: "known" as const, value: 1, observedTick: 20 } }] }, enemy] };
  const input = { ...f.input, observation, producerExposure: exposure };
  const pair = exposure.pairs[0]; if (!pair) throw new Error("synthetic_exposure_missing");
  return { ...f, input, exposure, pair };
}

test("retains exact per-producer attack choice and high-ground band while universal range and resilience remain open", () => {
  const f = fixture(); const fair = normalizeRuntimeProductionFairInput(f.input);
  expect(fair.failures).toEqual([]);
  expect(fair.fairInput?.producerExposure?.pairs[0]).toEqual(f.pair);
  expect(fair.fairInput?.visibleThreats[0]?.buildingRange).toBeNull();
  expect(fair.gaps).toContain("production_exposure_useful_resilience_missing");
  expect(fair.gaps).toContain("production_decision_producer_reachability_missing");
});

test("minimum range, absent bonus below the threshold and equal-damage native positioning are separate", () => {
  const f = fixture(); const actors = f.input.observation.actors;
  const enemy = actors[1]; const producer = actors[0];
  if (!producer || !enemy || enemy.combatProfile?.status !== "known") throw new Error("synthetic_weapons_missing");
  const attack = enemy.combatProfile.value.attacks[0];
  if (!attack) throw new Error("synthetic_attack_missing");
  const input = { ...f.input, observation: { ...f.input.observation, actors: [producer, { ...enemy,
    combatProfile: { ...enemy.combatProfile, value: { ...enemy.combatProfile.value,
      attacks: [{ ...attack, minRange: 2 }, { ...attack, range: 8 }] } } }] },
    producerExposure: { ...f.exposure, pairs: [{ ...f.pair, range: 3, positioningRange: 8, highGroundBonus: 0,
      attackerElevation: HIGH_GROUND_THRESHOLD - 1, distanceTiles: 1, withinSelectedWeaponBand: false }] } };
  expect(normalizeRuntimeProducerExposure(input).failures).toEqual([]);
});

test("stale and legacy inputs retain gaps without borrowing later live ranges", () => {
  const f = fixture();
  expect(normalizeRuntimeProducerExposure({ ...f.input, producerExposure: undefined }).gaps)
    .toContain("production_decision_building_exposure_missing");
  const stale = { ...f.input, cadence: { ...f.input.cadence, tick: 21 },
    producerExposure: { ...f.exposure, pairs: [], gaps: ["production_exposure_current_input_missing"] } };
  expect(normalizeRuntimeProducerExposure(stale)).toMatchObject({ exposure: null, failures: [] });
  expect(normalizeRuntimeProducerExposure({ ...stale, producerExposure: f.exposure }).failures)
    .toContain("production_exposure_input_mismatch");
});

test("contradictory target/weapon/clock authority suppresses every normalized causal group", () => {
  const f = fixture();
  for (const exposure of [
    { ...f.exposure, tick: 21 }, { ...f.exposure, pairs: [f.pair, f.pair] },
    { ...f.exposure, pairs: [{ ...f.pair, producerActorId: "foreign" }] },
    { ...f.exposure, pairs: [{ ...f.pair, attackIndex: 1 }] },
    { ...f.exposure, pairs: [{ ...f.pair, range: 99 }] },
    { ...f.exposure, pairs: [{ ...f.pair, withinSelectedWeaponBand: false }] },
    { ...f.exposure, pairs: [{ ...f.pair, distanceTiles: NaN }] }
  ]) {
    const selected = { ...f.selected, decision: { ...f.selected.decision, input: { ...f.input, producerExposure: exposure } } };
    const normalized = normalizeRuntimeProductionCausality({ ...f.capture, facts: [selected] });
    expect(normalized.failures.length).toBeGreaterThan(0);
    expect(normalized.decisions).toEqual([]); expect(normalized.worldSnapshots).toEqual([]);
    expect(normalized.payments).toEqual([]); expect(normalized.spatialAuthority.paths).toEqual([]);
  }
});
