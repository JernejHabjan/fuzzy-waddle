import { Actor } from '../../../actor';
import { ProjectileData } from './projectile-data';
import Vector3 = Phaser.Math.Vector3;

export abstract class Projectile {
  private targetActor: Actor | null = null;
  private targetLocation: Vector3 | null = null;
  public abstract projectileData: ProjectileData;
  constructor(public damageCauser: Actor) {}

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
