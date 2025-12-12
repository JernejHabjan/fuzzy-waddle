import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { getSelectedActors, sortActorsByPriority } from "./scene-data";
import { getSceneComponent } from "../world/services/scene-component-helpers";
import { SelectionTabHandler } from "../player/human-controller/selection-tab-handler";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Returns currently selected actors, sorted by priority, and the primary actor.
 * If a SelectionTabHandler is available, uses the current tab group.
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

  // Check if tab handler exists and has grouped actors
  const tabHandler = getSceneComponent(scene, SelectionTabHandler);
  if (tabHandler && tabHandler.currentTabActors.length > 0) {
    const currentTabActors = tabHandler.currentTabActors;
    const actorsByPriority = sortActorsByPriority(currentTabActors);
    return { selectedActors, actorsByPriority, primaryActor: actorsByPriority[0] };
  }

  // Fallback to original behaviour
  const actorsByPriority = sortActorsByPriority(selectedActors);
  return { selectedActors, actorsByPriority, primaryActor: actorsByPriority[0] };
}
