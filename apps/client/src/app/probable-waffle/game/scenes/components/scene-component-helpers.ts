import GameProbableWaffleScene from "../GameProbableWaffleScene";

export function getSceneComponent<T>(scene: Phaser.Scene, componentClass: new (...args: any[]) => T): T | undefined {
  if (!(scene instanceof GameProbableWaffleScene)) throw new Error("Scene is not of type GameProbableWaffleSceneData");
  const component = scene.getSceneGameData().components.find((c) => c instanceof componentClass);
  if (!component) {
    return undefined;
  }
  return component;
}

export function getSceneService<T>(scene: Phaser.Scene, serviceClass: new (...args: any[]) => T): T | undefined {
  if (!(scene instanceof GameProbableWaffleScene)) throw new Error("Scene is not of type GameProbableWaffleSceneData");
  const service = scene.getSceneGameData().services.find((s) => s instanceof serviceClass);
  if (!service) {
    return undefined;
  }
  return service;
}

export function getSceneInitializers(scene: Phaser.Scene) {
  if (!(scene instanceof GameProbableWaffleScene)) throw new Error("Scene is not of type GameProbableWaffleSceneData");
  return scene.getSceneGameData().initializers;
}
