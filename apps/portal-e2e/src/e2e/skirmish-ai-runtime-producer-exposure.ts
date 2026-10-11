import type { AiDecisionInputV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input-v1";
import { HIGH_GROUND_THRESHOLD } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/high-ground-constants";

/** Validates target-specific native attack capture against its exact consumed weapons; no universal building range. */
export function normalizeRuntimeProducerExposure(input: AiDecisionInputV1) {
  const failures: string[] = [];
  const gaps = new Set<string>();
  const exposure = input.producerExposure;
  if (!exposure) return { exposure: null, failures, gaps: ["production_decision_building_exposure_missing"] };
  exposure.gaps.forEach((gap) => gaps.add(gap));
  const observation = input.observation;
  if (!Number.isSafeInteger(exposure.tick) || exposure.tick < 0 || !Number.isSafeInteger(exposure.generation) ||
    exposure.generation < 0 || exposure.pairs.length > 256 || (observation && (observation.actors.length > 256 ||
      observation.actors.some((actor) => actor.combatProfile?.status === "known" && actor.combatProfile.value.attacks.length > 32)))) {
    return { exposure: null, failures: ["production_exposure_identity_invalid"], gaps: [...gaps] };
  }
  if (!observation) {
    if (exposure.pairs.length) failures.push("production_exposure_observation_missing");
    return { exposure: null, failures, gaps: [...gaps, "production_decision_building_exposure_missing"] };
  }
  const producers = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned" &&
    (actor.queue.status === "known" || actor.capabilities.some((capability) => capability.family === "produce")));
  const threats = observation.actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible");
  const current = input.cadence.clock === "simulation" && input.cadence.tick === observation.tick;
  if (exposure.tick !== observation.tick || exposure.generation !== observation.generation ||
    (exposure.pairs.length && (!current || input.snapshotRestoreInProgress))) failures.push("production_exposure_input_mismatch");
  const expected = producers.length * threats.length;
  if (expected !== exposure.pairs.length) gaps.add("production_exposure_pairs_incomplete");
  if (expected > 256) gaps.add("production_exposure_pair_overflow");
  const seen = new Set<string>();
  for (const pair of exposure.pairs) {
    const key = JSON.stringify([pair.producerActorId, pair.threatActorId]);
    const producer = producers.find((actor) => actor.actorId === pair.producerActorId);
    const threat = threats.find((actor) => actor.actorId === pair.threatActorId);
    if (!producer || !threat || seen.has(key) || !["known", "no_attack", "unavailable"].includes(pair.status)) {
      failures.push("production_exposure_pair_invalid"); continue;
    }
    seen.add(key);
    const values = [pair.attackIndex, pair.range, pair.positioningRange, pair.highGroundBonus, pair.attackerElevation, pair.targetElevation,
      pair.distanceTiles, pair.withinSelectedWeaponBand];
    const attacks = threat.combatProfile?.status === "known" ? threat.combatProfile.value.attacks : null;
    if (pair.status !== "known") {
      if (values.some((value) => value !== null) || (pair.status === "no_attack" && (!attacks || attacks.length !== 0))) {
        failures.push("production_exposure_missing_value_invalid");
      }
      if (pair.status === "unavailable") gaps.add("production_exposure_current_binding_missing");
      continue;
    }
    const attack = pair.attackIndex === null ? undefined : attacks?.[pair.attackIndex];
    const maximumDamage = Math.max(...(attacks ?? []).map((value) => value.damage));
    const firstBest = attacks?.findIndex((candidate) => candidate.damage === maximumDamage);
    if (!attack || !Number.isSafeInteger(pair.attackIndex) || pair.attackIndex !== firstBest ||
      !attack.targetDomains.includes("ground") || producer.logicalPosition.status !== "known" ||
      threat.logicalPosition.status !== "known" ||
      ![pair.range, pair.positioningRange, pair.highGroundBonus, pair.attackerElevation, pair.targetElevation, pair.distanceTiles]
        .every((value) => value !== null && Number.isFinite(value)) || typeof pair.withinSelectedWeaponBand !== "boolean" ||
      pair.distanceTiles === null || !Number.isSafeInteger(pair.distanceTiles) || pair.distanceTiles < 0 ||
      pair.attackerElevation === null || pair.targetElevation === null || pair.range === null) {
      failures.push("production_exposure_weapon_invalid"); continue;
    }
    const bonus = pair.attackerElevation >= pair.targetElevation + HIGH_GROUND_THRESHOLD ? attack.highGroundRangeBonus : 0;
    const positioningRange = Math.max(...(attacks ?? []).filter((value) => value.damage === attack.damage)
      .map((value) => value.range + (pair.attackerElevation !== null && pair.targetElevation !== null &&
        pair.attackerElevation >= pair.targetElevation + HIGH_GROUND_THRESHOLD ? value.highGroundRangeBonus : 0)));
    if (pair.positioningRange !== positioningRange || pair.highGroundBonus !== bonus || pair.range !== attack.range + bonus ||
      pair.withinSelectedWeaponBand !== (attack.damage > 0 && pair.distanceTiles >= attack.minRange &&
        pair.distanceTiles <= pair.range)) {
      failures.push("production_exposure_range_mismatch");
    }
  }
  // Fair current capture is diagnostic authority; producer readiness and useful resilience still need world/effect joins.
  gaps.add("production_exposure_useful_resilience_missing");
  return structuredClone({ exposure: failures.length || !current ? null : exposure,
    failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
