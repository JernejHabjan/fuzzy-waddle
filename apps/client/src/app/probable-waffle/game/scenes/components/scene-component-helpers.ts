import { GameProbableWaffleScene } from "../GameProbableWaffleScene";

export function getSceneComponent<T>(scene: Phaser.Scene, componentClass: new (...args: any[]) => T): T | undefined {
  if (!(scene instanceof GameProbableWaffleScene)) throw new Error("Scene is not of type GameProbableWaffleSceneData");
  const component = scene.getSceneGameData().components.find((c) => c instanceof componentClass);
  if (!component) {
    return undefined;
  }
  return component;
}
