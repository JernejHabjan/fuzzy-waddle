import { ObjectNames } from "../../../data/object-names";

export class TivaraWorker extends Phaser.GameObjects.GameObject {
  constructor(scene: Phaser.Scene) {
    super(scene, ObjectNames.TivaraWorker);
  }

  name = ObjectNames.TivaraWorker;
}
