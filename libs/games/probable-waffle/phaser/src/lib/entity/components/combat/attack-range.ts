import type Phaser from "phaser";
import type { AttackData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/attack-data";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile, isGameObjectActiveInActiveScene } from "../../../data/game-object-helper";
import { DistanceHelper } from "../../../library/distance-helper";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { FlyingComponent } from "../movement/flying-component";
import { getHighGroundRangeBonus } from "./high-ground.helper";

type AttackRange = Pick<AttackData, "range" | "minRange" | "canTargetAir" | "highGroundRangeBonus">;

/** Physical weapon admission, independent of the length/reachability of an approach route. */
export function isWithinAttackRange(
  attacker: Phaser.GameObjects.GameObject,
  target: Phaser.GameObjects.GameObject,
  attack: AttackRange | null
): boolean {
  if (!attack || !isGameObjectActiveInActiveScene(attacker) || !isGameObjectActiveInActiveScene(target)) return false;
  const targetFlying = !!getActorComponent(target, FlyingComponent);
  if (targetFlying && !attack.canTargetAir) return false;
  const from = getGameObjectCurrentTile(attacker);
  const to = getGameObjectCurrentTile(target);
  if (!from || !to) return false;
  const tilemap = getSceneComponent(attacker.scene, TilemapComponent)?.tilemap;
  // Ground buildings are attacked at their occupied edge. Air targets have no ground footprint to attack.
  const footprint = tilemap && !targetFlying ? getTileCoordsUnderObject(tilemap, target) : [];
  const positions = footprint.length ? footprint : [to];
  const height = DistanceHelper.getFlyingHeightInTiles(target) - DistanceHelper.getFlyingHeightInTiles(attacker);
  let distance = Infinity;
  for (const position of positions)
    distance = Math.min(distance, Math.hypot(position.x - from.x, position.y - from.y, height));
  // Preserve the native whole-tile distance rule; render interpolation must not introduce a new weapon balance rule.
  distance = Math.floor(distance);
  const range = attack.range + getHighGroundRangeBonus(attacker, target, attack);
  return distance >= attack.minRange && distance <= range;
}
