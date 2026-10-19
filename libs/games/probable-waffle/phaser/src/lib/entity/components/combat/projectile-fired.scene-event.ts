import type Phaser from "phaser";

/**
 * Identifies the local scene notification emitted after a ranged attack has actually created a projectile.
 * Consumers must treat this as presentation state only; it is not a simulation command or persisted event.
 */
export const ProjectileFiredSceneEvent = "combat.projectile-fired";

/**
 * Describes the actors involved in a projectile that was successfully created by {@link AttackComponent}.
 * The target is the intended attack target rather than the projectile's eventual impact victim.
 */
export interface ProjectileFiredSceneEventPayload {
  /** Actor that created the projectile. */
  readonly attacker: Phaser.GameObjects.GameObject;
  /** Actor captured as the attack target when the projectile was fired. */
  readonly target: Phaser.GameObjects.GameObject;
}
