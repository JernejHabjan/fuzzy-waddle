import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";

export function getSimulationNow(scene: Phaser.Scene): number {
  const tickService = getSceneService(scene, SimulationTickService);
  if (!tickService) {
    return scene.time.now;
  }

  return tickService.currentTick * SimulationTickService.TICK_INTERVAL_MS;
}
