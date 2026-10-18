import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

export class SkaduweeWorker extends Phaser.GameObjects.GameObject {
  constructor(scene: Phaser.Scene) {
    super(scene, ObjectNames.SkaduweeWorker);
  }
  override name = ObjectNames.SkaduweeWorker;
}
