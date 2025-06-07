import { ProbableWaffleScene } from "../../core/probable-waffle.scene";

export function getSceneComponent<T>(scene: Phaser.Scene, componentClass: new (...args: any[]) => T): T | undefined {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleSceneData");
  const component = scene.getSceneGameData().components.find((c) => c instanceof componentClass);
  if (!component) {
    return undefined;
  }
  return component;
}

export function getSceneExternalComponent<T>(
  scene: Phaser.Scene,
  componentClass: new (...args: any[]) => T
): T | undefined {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleSceneData");
  const component = scene.getSceneGameData().baseGameData.components.find((c) => c instanceof componentClass);
  if (!component) {
    return undefined;
  }
  return component;
}

export function getSceneService<T>(scene: Phaser.Scene, serviceClass: new (...args: any[]) => T): T | undefined {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleSceneData");
  const service = scene.getSceneGameData().services.find((s) => s instanceof serviceClass);
  if (!service) {
    return undefined;
  }
  return service;
}

export function getSceneSystem<T>(scene: Phaser.Scene, systemClass: new (...args: any[]) => T): T | undefined {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleSceneData");
  const system = scene.getSceneGameData().systems.find((s) => s instanceof systemClass);
  if (!system) {
    return undefined;
  }
  return system;
}

export function getSceneInitializers(scene: Phaser.Scene) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleSceneData");
  return scene.getSceneGameData().initializers;
}
