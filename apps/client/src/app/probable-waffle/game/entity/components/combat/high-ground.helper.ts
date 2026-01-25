import type { AttackData } from "./attack-data";
import { HIGH_GROUND_THRESHOLD } from "./high-ground-constants";
import { getActorComponent } from "../../../data/actor-component";
import { RepresentableComponent } from "../representable-component";

/**
 * Gets the actual logical z-coordinate of an actor, including flight height for flying units.
 * @param actor The game object to get the elevation for
 * @returns The z-coordinate of the actor (including flight height), or 0 if not found
 */
export function getActorElevation(actor: Phaser.GameObjects.GameObject): number {
  const representableComponent = getActorComponent(actor, RepresentableComponent);
  if (!representableComponent) return 0;

  const logicalTransform = representableComponent.logicalWorldTransform;
  return representableComponent.getActualLogicalZ(logicalTransform);
}

/**
 * Determines if an attacker has high ground advantage over a target.
 * An attacker has high ground advantage when their z-coordinate is at least
 * HIGH_GROUND_THRESHOLD units above the target's z-coordinate.
 *
 * @param attacker The attacking game object
 * @param target The target game object
 * @returns true if the attacker has high ground advantage
 */
export function hasHighGroundAdvantage(
  attacker: Phaser.GameObjects.GameObject,
  target: Phaser.GameObjects.GameObject
): boolean {
  const attackerZ = getActorElevation(attacker);
  const targetZ = getActorElevation(target);

  return attackerZ >= targetZ + HIGH_GROUND_THRESHOLD;
}

/**
 * Calculates the high ground range bonus for a specific attack against a target.
 * The bonus is only applied when the attacker has high ground advantage.
 *
 * @param attacker The attacking game object
 * @param target The target game object
 * @param attack The attack data containing the weapon's high ground bonus
 * @returns The range bonus in tiles (0 if no high ground advantage or no bonus defined)
 */
export function getHighGroundRangeBonus(
  attacker: Phaser.GameObjects.GameObject,
  target: Phaser.GameObjects.GameObject,
  attack: AttackData
): number {
  if (!hasHighGroundAdvantage(attacker, target)) {
    return 0;
  }

  return attack.highGroundRangeBonus ?? 0;
}
