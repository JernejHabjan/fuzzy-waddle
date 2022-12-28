import { Actor } from '../../../actor';
import { ProjectileData } from './projectile-data';
import Vector3 = Phaser.Math.Vector3;
import { Pawn } from '../../pawn';
import { SpritePlacementData } from '../../../sprite/sprite-helper';

export abstract class Projectile extends Pawn {
  private targetActor: Actor | null = null;
  private targetLocation: Vector3 | null = null;
  public abstract projectileData: ProjectileData;
  protected constructor(scene: Phaser.Scene, spritePlacementData: SpritePlacementData, public damageCauser: Actor) {
    super(scene, spritePlacementData);
  }

  fireAtActor(targetActor: Actor) {
    this.targetActor = targetActor;
    this.targetLocation = null;
  }
  fireAtLocation(targetLocation: Vector3) {
    this.targetLocation = targetLocation;
    this.targetActor = null;
  }

  tick(time: number, delta: number) {
    // todo
  }
  hitTargetActor() {
    // todo
  }

  // for area of effect
  hitTargetLocation() {
    // todo
  }
}
