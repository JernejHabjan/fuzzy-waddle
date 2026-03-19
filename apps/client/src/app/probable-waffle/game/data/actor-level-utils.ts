import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { TechTreeService } from "./tech-tree/tech-tree.service";
import { getSceneService } from "../world/services/scene-component-helpers";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { AnimationActorComponent } from "../entity/components/animation/animation-actor-component";
import { AttackComponent } from "../entity/components/combat/components/attack-component";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import { LevelComponent } from "../entity/components/level/level-component";
import { getPwActorDefinition } from "../prefabs/definitions/actor-definitions";
import { VisionComponent } from "../entity/components/vision-component";
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

export function upgradeActorToLevel(actor: GameObject, newLevel: number) {
  const levelComponent = getActorComponent(actor, LevelComponent);
  if (!levelComponent) {
    console.error("Cannot upgrade actor without LevelComponent");
    return;
  }

  if (newLevel < 1 || newLevel > levelComponent.maxLevel) {
    console.error(`Invalid level ${newLevel}, must be 1-${levelComponent.maxLevel}`);
    return;
  }

  // Get definition with level overrides applied
  const levelConfig = getPwActorDefinition(actor.name, newLevel);
  if (!levelConfig) {
    console.error(`No definition found for ${actor.name}`);
    return;
  }
  const components = levelConfig.components;

  // Update animations if changed
  if (components?.animatable) {
    const animComp = getActorComponent(actor, AnimationActorComponent);
    animComp?.swapAnimationSet(components.animatable.animations, components.animatable.defaultDirection);
  }

  // Update weapons if changed
  if (components?.attack) {
    const attackComp = getActorComponent(actor, AttackComponent);
    attackComp?.setData(components.attack);
  }

  // Update health if changed
  if (components?.health) {
    const healthComp = getActorComponent(actor, HealthComponent);
    if (healthComp) {
      healthComp.setHealthDefinition(components.health);
    }
  }

  // Update vision range if changed
  if (components?.vision?.range !== undefined) {
    const visionComp = getActorComponent(actor, VisionComponent);
    if (visionComp) {
      visionComp.visionDefinition = components.vision;
    }
  }

  // Finally update level component
  levelComponent.setData({ level: newLevel });
}
