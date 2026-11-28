import Phaser from "phaser";

/** Scene-local ambient targets. These are presentation objects, not synchronized actor state. */
const targets = new WeakMap<Phaser.Scene, Set<Phaser.GameObjects.Sprite>>();

export function registerAmbientTarget(target: Phaser.GameObjects.Sprite): void {
  let sceneTargets = targets.get(target.scene);
  if (!sceneTargets) {
    sceneTargets = new Set();
    targets.set(target.scene, sceneTargets);
  }
  sceneTargets.add(target);
}

export function unregisterAmbientTarget(target: Phaser.GameObjects.Sprite): void {
  targets.get(target.scene)?.delete(target);
}

export function getAmbientTargets(scene: Phaser.Scene): Iterable<Phaser.GameObjects.Sprite> {
  return targets.get(scene) ?? [];
}
