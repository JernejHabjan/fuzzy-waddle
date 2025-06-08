import { ObjectNames } from "../../../data/object-names";

export class SkaduweeWorker extends Phaser.GameObjects.GameObject {
  constructor(scene: Phaser.Scene) {
    super(scene, ObjectNames.SkaduweeWorker);
  }
  name = ObjectNames.SkaduweeWorker;
}
