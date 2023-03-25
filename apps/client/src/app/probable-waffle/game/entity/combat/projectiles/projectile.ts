import { Actor } from '../../actor/actor';
import { ProjectileData } from './projectile-data';
import { RepresentableActor } from '../../actor/representable-actor';
import { Scene } from 'phaser';

export abstract class Projectile extends RepresentableActor {
  public abstract projectileData: ProjectileData;
  private targetActor: Actor | null = null;
  private targetLocation: Phaser.Math.Vector3 | null = null;

  protected constructor(scene: Scene, public damageCauser: RepresentableActor) {
    super(scene, damageCauser.transformComponent.tilePlacementData);
  }

  fireAtActor(targetActor: Actor) {
    this.targetActor = targetActor;
    this.targetLocation = null;
  }

  fireAtLocation(targetLocation: Phaser.Math.Vector3) {
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
