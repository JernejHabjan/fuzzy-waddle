import { getActorComponent, hasActorComponent } from "../data/actor-component";
import { ProductionComponent } from "../entity/components/production/production-component";
import { ContainerComponent } from "../entity/components/building/container-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { ObjectDescriptorComponent } from "../entity/components/object-descriptor-component";
import GameObject = Phaser.GameObjects.GameObject;
import type { PlayerNumber } from "@fuzzy-waddle/api-interfaces";

/**
 * Determines if a game object is a building based on its components.
 * Buildings typically have production or container components.
 */
export function isBuilding(actor: GameObject): boolean {
  return hasActorComponent(actor, ProductionComponent) || hasActorComponent(actor, ContainerComponent);
}

/**
 * Counts buildings per player from a given list of actors.
 * @param actors - Array of game objects to analyze
 * @returns Map of player number to building count
 */
export function getBuildingCountsByPlayer(actors: GameObject[]): Map<number, number> {
  const buildingCounts = new Map<number, number>();

  for (const actor of actors) {
    const objectDescriptor = getActorComponent(actor, ObjectDescriptorComponent);
    if (!objectDescriptor) continue;

    const ownerComponent = getActorComponent(actor, OwnerComponent);
    const owner = ownerComponent?.getOwner();
    if (owner === undefined) continue;

    if (isBuilding(actor)) {
      buildingCounts.set(owner, (buildingCounts.get(owner) ?? 0) + 1);
    }
  }

  return buildingCounts;
}

/**
 * Determines if an actor is an enemy's last building that should be revealed.
 * @param actor - The game object to check
 * @param buildingCounts - Map of player number to building count
 * @param currentPlayerNumber - The current player's number
 * @param threshold - Maximum number of buildings to consider as "last buildings"
 * @returns True if this is a last enemy building that should be revealed
 */
export function isLastEnemyBuilding(
  actor: GameObject,
  buildingCounts: Map<number, number>,
  currentPlayerNumber: PlayerNumber | undefined,
  threshold: number
): boolean {
  if (currentPlayerNumber === undefined) return false;

  const ownerComponent = getActorComponent(actor, OwnerComponent);
  const owner = ownerComponent?.getOwner();
  if (owner === undefined || owner === currentPlayerNumber) return false;

  const buildingCount = buildingCounts.get(owner) ?? 0;
  return isBuilding(actor) && buildingCount > 0 && buildingCount <= threshold;
}
