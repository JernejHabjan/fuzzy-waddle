import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

export class TivaraWorker extends Phaser.GameObjects.GameObject {
  constructor(scene: Phaser.Scene) {
    super(scene, ObjectNames.TivaraWorker);
  }

  override name = ObjectNames.TivaraWorker;
}
