import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { getSelectedActors, sortActorsByPriority } from "./scene-data";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Returns currently selected actors, sorted by priority, and the primary actor.
 */
export function getPrimarySelectedActor(scene: ProbableWaffleScene): {
  selectedActors: GameObject[];
  actorsByPriority: GameObject[];
  primaryActor?: GameObject;
} {
  const selectedActors = getSelectedActors(scene);
  if (selectedActors.length === 0) {
    return { selectedActors, actorsByPriority: [], primaryActor: undefined };
  }
  const actorsByPriority = sortActorsByPriority(selectedActors);
  return { selectedActors, actorsByPriority, primaryActor: actorsByPriority[0] };
}
