import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { Scene } from "phaser";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";

export function getPlayerController(scene: Scene, playerNumber?: number): ProbableWafflePlayer | undefined {
  // if not instanceof BaseScene then throw error
  if (!(scene instanceof ProbableWaffleScene)) {
    throw new Error("scene is not instanceof BaseScene");
  }
  if (playerNumber === undefined) {
    playerNumber = scene.baseGameData.user.playerNumber!;
  }
  return scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
}
