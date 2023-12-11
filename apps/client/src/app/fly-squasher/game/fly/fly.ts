import { Subject, Subscription } from "rxjs";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { Actor } from "../../../probable-waffle/game/entity/actor/actor";
import { FlySoundComponent } from "./components/fly-sound-component";
import { FlyMovementComponent, WorldSpeedState } from "./components/fly-movement-component";
import { FlyHealthSystem } from "./components/fly-health.system";
import { FlyRepresentableComponent } from "./components/fly-representable-component";
import { HealthComponent } from "../../../probable-waffle/game/entity/combat/components/health-component";
import { FlySquasherAudio } from "../audio";

export type FlyOptions = {
  type: "normal" | "boss" | "large-boss";
};
export class Fly extends Actor {
  override despawnTime = 4;

  readonly onFlyHit: Subject<Fly> = new Subject<Fly>();
  readonly onFlyKill: Subject<Fly> = new Subject<Fly>();

  private subscriptions: Subscription[] = [];

  private flyHitSubscription!: Subscription;
  private flyRepresentableComponent!: FlyRepresentableComponent;
  private flySoundComponent: FlySoundComponent;
  private flyHealthSystem: FlyHealthSystem;
  private flyMovementComponent: FlyMovementComponent;

  constructor(
    private readonly scene: BaseScene,
    private readonly worldSpeedState: WorldSpeedState,
    private readonly audio: FlySquasherAudio,
    private readonly actorOptions?: FlyOptions
  ) {
    super({ scene });

    this.flySoundComponent = this.components.addComponent(new FlySoundComponent(this, scene, audio));
    this.flyMovementComponent = this.components.addComponent(new FlyMovementComponent(this, scene, worldSpeedState));
    this.flyRepresentableComponent = this.components.addComponent(
      new FlyRepresentableComponent(this, scene, actorOptions)
    );
    this.components.addComponent(
      new HealthComponent(this, scene, { maxHealth: this.maxHealth }, this.healthBarOptions)
    );

    this.flyHealthSystem = this.components.addComponent(new FlyHealthSystem(this)); // todo add system?
  }

  get maxHealth(): number {
    let health = 1;
    switch (this.actorOptions?.type) {
      case "boss":
        health = 6;
        break;
      case "large-boss":
        health = 10;
        break;
    }
    return health;
  }

  addSubscription(subscription: Subscription) {
    this.subscriptions.push(subscription);
  }

  private healthBarOptions = () => ({
    spriteDepth: 1,
    spriteWidth: this.flyRepresentableComponent.width,
    spriteHeight: this.flyRepresentableComponent.height,
    spriteObjectCenterX: this.flyRepresentableComponent.x,
    spriteObjectCenterY: this.flyRepresentableComponent.y
  });

  override initComponents() {
    super.initComponents();
    this.flyHitSubscription = this.components.findComponent(FlyHealthSystem).onFlyHit.subscribe(this._onFlyHit);
  }

  get y() {
    return this.components.findComponent(FlyRepresentableComponent).y;
  }

  override destroy() {
    super.destroy();
    this.flyHitSubscription.unsubscribe();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  override kill() {
    if (this.killed) return;
    super.kill();
    this.flySoundComponent.kill();
    this.flyRepresentableComponent.kill();
    this.flyHealthSystem.kill();
    this.onFlyKill.next(this);
  }

  despawn() {
    this.destroy();
  }

  private _onFlyHit = () => {
    this.onFlyHit.next(this);
  };
}
