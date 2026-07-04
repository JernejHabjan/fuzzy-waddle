import { getSimulationNow as getSharedSimulationNow } from "../../world/services/simulation-time";

export function getSimulationNow(scene: Phaser.Scene): number {
  return getSharedSimulationNow(scene);
}
