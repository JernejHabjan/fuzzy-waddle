import type Phaser from "phaser";
import type { AiObservedActorV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { OwnerComponent } from "../../entity/components/owner-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { getActorElevation, getHighGroundRangeBonus } from "../../entity/components/combat/high-ground.helper";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { FlyingComponent } from "../../entity/components/movement/flying-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { ResearchComponent } from "../../entity/components/research/research-component";
import { DistanceHelper } from "../../library/distance-helper";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { AiObservationVisibilityPolicy } from "./observation/ai-observation-visibility-policy";
import { millisecondsToSimulationTicks } from "./observation/ai-observation-values";
import type { AiDecisionProducerExposureV1 } from "./ai-decision-producer-exposure-v1";

/** Called only by listener-gated decision capture; known current contacts are bound before target-specific reads. */
export function captureAiProducerExposure(
  scene: Phaser.Scene, observation: AiObservationV1, currentTick: number | null, restoring: boolean
): AiDecisionProducerExposureV1 {
  const pairs: AiDecisionProducerExposureV1["pairs"][number][] = [];
  const gaps = new Set<string>();
  const result = () => ({ tick: observation.tick, generation: observation.generation, pairs, gaps: [...gaps].sort() });
  if (restoring || currentTick !== observation.tick) {
    gaps.add("production_exposure_current_input_missing"); return result();
  }
  const producers = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned" &&
    (actor.queue.status === "known" || actor.capabilities.some((capability) => capability.family === "produce")));
  const threats = observation.actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible");
  if (producers.length * threats.length > 256) { gaps.add("production_exposure_pair_overflow"); return result(); }
  if (!producers.length || !threats.length) return result();
  const index = getSceneService(scene, ActorIndexSystem);
  if (!index) { gaps.add("production_exposure_index_missing"); return result(); }
  const visibility = new AiObservationVisibilityPolicy(scene, observation.playerNumber);
  for (const threat of threats) {
    const attacker = index.getActorById(threat.actorId);
    // Never project remembered/hidden enemies or use their live profile to repair a missing consumed profile.
    const current = attacker && matchesConsumedActor(scene, attacker, threat) && visibility.mayObserve(attacker);
    const component = current && attacker ? getActorComponent(attacker, AttackComponent) : undefined;
    const attacks = component?.getAttacks();
    const observed = threat.combatProfile?.status === "known" ? threat.combatProfile.value.attacks : null;
    const sameWeapons = attacks && observed && attacks.length === observed.length && attacks.every((weapon, i) => {
      const value = observed[i];
      return !!value && weapon.damage === value.damage && weapon.range === value.range && weapon.minRange === value.minRange &&
        (weapon.highGroundRangeBonus ?? 0) === value.highGroundRangeBonus &&
        millisecondsToSimulationTicks(weapon.cooldown) === value.cooldownTicks &&
        millisecondsToSimulationTicks(weapon.delays.hit) === value.impactDelayTicks &&
        (weapon.meleeAoe?.range ?? 0) === value.areaRadius &&
        value.targetDomains.join(",") === (weapon.canTargetAir ? "ground,water,air" : "ground,water");
    });
    for (const producer of producers) {
      const row = { producerActorId: producer.actorId, threatActorId: threat.actorId, status: "unavailable" as const,
        attackIndex: null, range: null, positioningRange: null, highGroundBonus: null, attackerElevation: null, targetElevation: null,
        distanceTiles: null, withinSelectedWeaponBand: null };
      const target = index.getActorById(producer.actorId);
      if (!current || !attacker || !target ||
        !matchesConsumedActor(scene, target, producer) || getActorComponent(target, FlyingComponent) ||
        (!getActorComponent(target, ProductionComponent) && !getActorComponent(target, ResearchComponent)) ||
        getActorComponent(target, ConstructionSiteComponent)?.isFinished === false) {
        gaps.add("production_exposure_current_binding_missing"); pairs.push(row); continue;
      }
      if (!component && observed?.length === 0) { pairs.push({ ...row, status: "no_attack" }); continue; }
      if (!component || !sameWeapons || !attacks) {
        gaps.add("production_exposure_current_binding_missing"); pairs.push(row); continue;
      }
      const selected = component.getAttack(target);
      if (!selected) {
        if (attacks.length) { gaps.add("production_exposure_selected_weapon_missing"); pairs.push(row); }
        else pairs.push({ ...row, status: "no_attack" });
        continue;
      }
      const attackIndex = attacks.indexOf(selected);
      const bonus = getHighGroundRangeBonus(attacker, target, selected);
      const distance = DistanceHelper.getTileDistanceBetweenGameObjects(attacker, target);
      if (attackIndex < 0 || distance === null) {
        gaps.add("production_exposure_selected_weapon_missing"); pairs.push(row); continue;
      }
      pairs.push({ ...row, status: "known", attackIndex, range: selected.range + bonus,
        positioningRange: component.getAttackRange(target) ?? null, highGroundBonus: bonus,
        attackerElevation: getActorElevation(attacker), targetElevation: getActorElevation(target), distanceTiles: distance,
        withinSelectedWeaponBand: selected.damage > 0 && distance >= selected.minRange && distance <= selected.range + bonus });
    }
  }
  return result();
}

/** Exact identity, current tile/base elevation and representable authority; no zero-elevation fallback. */
function matchesConsumedActor(scene: Phaser.Scene, live: Phaser.GameObjects.GameObject, observed: AiObservedActorV1): boolean {
  if (live.scene !== scene || !live.active || getActorComponent(live, HealthComponent)?.killed ||
    getActorComponent(live, IdComponent)?.id !== observed.actorId || live.name !== observed.objectName ||
    (getActorComponent(live, OwnerComponent)?.getOwner() ?? null) !== observed.owner ||
    !getActorComponent(live, RepresentableComponent) || observed.logicalPosition.status !== "known" ||
    observed.logicalPosition.observedTick !== observed.observedTick) return false;
  const tile = getGameObjectCurrentTile(live);
  const world = getGameObjectLogicalTransform(live);
  const position = observed.logicalPosition.value;
  return !!tile && !!world && tile.x === position.x && tile.y === position.y && world.z === position.z;
}
