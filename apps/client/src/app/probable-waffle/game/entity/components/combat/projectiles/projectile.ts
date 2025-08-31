import { FlyBase } from "../../../../../../fly-squasher/game/fly/FlyBase";
import { ProjectileData } from "./projectile-data";
import { RepresentableActor_old } from "../../actor/representable-actor_old";
import { Scene } from "phaser";
import { TransformComponent } from "../../transformable-component";

export abstract class Projectile extends RepresentableActor_old {
  public abstract projectileData: ProjectileData;
  private targetActor: FlyBase | null = null;
  private targetLocation: Phaser.Math.Vector3 | null = null;

  protected constructor(
    scene: Scene,
    public damageCauser: RepresentableActor_old
  ) {
    const tilePlacementData = damageCauser.components.findComponent(TransformComponent).tilePlacementData;
    super(scene, tilePlacementData);
  }

  fireAtActor(targetActor: FlyBase) {
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
