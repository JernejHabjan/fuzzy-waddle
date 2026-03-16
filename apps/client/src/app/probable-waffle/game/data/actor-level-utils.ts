import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { TechTreeService } from "./tech-tree/tech-tree.service";
import { getSceneService } from "../world/services/scene-component-helpers";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Returns the researched level for a game object based on the owning player's tech tree,
 * or null if the actor has no owner or the level is 1 (base level).
 */
export function getResearchedLevelForActor(actor: GameObject): number | null {
  const ownerComponent = getActorComponent(actor, OwnerComponent);
  if (!ownerComponent) return null;
  const owner = ownerComponent.getOwner();
  if (owner === undefined) return null;
  const techTreeService = getSceneService(actor.scene, TechTreeService);
  if (!techTreeService) return null;
  const level = techTreeService.getResearchedLevelForUnit(owner, actor.name as ObjectNames);
  return level > 1 ? level : null;
}
