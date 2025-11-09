import { getActorComponent } from "../../../../data/actor-component";
import { ProductionComponent } from "./production-component";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Find the production building with the least total remaining production time from a list of actors.
 * This implements SC2-style production cycling across multiple buildings.
 *
 * @param actors - List of game objects to search for production components
 * @returns The production component with the least remaining time, or null if none found
 */
export function findProductionBuildingWithLeastRemainingTime(
  actors: GameObject[]
): ProductionComponent | null {
  // Get all production components from selected actors
  const productionBuildings = actors
    .map((a) => getActorComponent(a, ProductionComponent))
    .filter((component): component is ProductionComponent => component !== null && component.isFinished);

  if (productionBuildings.length === 0) return null;
  if (productionBuildings.length === 1) return productionBuildings[0]!;

  let minTime = Number.MAX_SAFE_INTEGER;
  let targetBuilding = productionBuildings[0]!;

  for (const building of productionBuildings) {
    const totalRemainingTime = building.getTotalRemainingProductionTime();
    if (totalRemainingTime < minTime) {
      minTime = totalRemainingTime;
      targetBuilding = building;
    }
  }

  return targetBuilding;
}
