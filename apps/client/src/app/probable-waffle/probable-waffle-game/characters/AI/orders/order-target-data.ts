import { Actor } from '../../../actor';
import Vector3 = Phaser.Math.Vector3;

export class OrderTargetData {
  constructor(private targetActor: Actor, private targetLocation: Vector3) {}
}
