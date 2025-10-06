import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export class TivaraWorker extends Phaser.GameObjects.GameObject {
  constructor(scene: Phaser.Scene) {
    super(scene, ObjectNames.TivaraWorker);
  }

  override name = ObjectNames.TivaraWorker;
}
