import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export class SkaduweeWorker extends Phaser.GameObjects.GameObject {
  constructor(scene: Phaser.Scene) {
    super(scene, ObjectNames.SkaduweeWorker);
  }
  override name = ObjectNames.SkaduweeWorker;
}
