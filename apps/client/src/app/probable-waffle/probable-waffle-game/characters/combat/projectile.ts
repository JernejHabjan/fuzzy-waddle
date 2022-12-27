import { DamageType } from './damage-type';
import { Actor } from '../../actor';
import Vector3 = Phaser.Math.Vector3;
import { ProjectileData } from './projectile-data';

export class Projectile {
  private targetActor: Actor | null = null;
  private targetLocation: Vector3 | null = null;
  constructor(public projectileData: ProjectileData, public damageCauser: Actor) {}

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
