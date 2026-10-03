import { type IFlyBase } from "../component.service";
import { FlyRepresentableComponent } from "./fly-representable-component";
import { Subject, Subscription } from "rxjs";
import { FlyMovementComponent } from "./fly-movement-component";
import { FlySoundComponent } from "./fly-sound-component";
import { FlyHealthComponent } from "./fly-health-component";
import { Fly } from "../fly";

export class FlyHealthSystem implements IFlyBase {
  private flyPrefabPointerHitSubscription!: Subscription;
  readonly onFlyHit: Subject<Fly> = new Subject<Fly>();
  private flyRepresentableComponent!: FlyRepresentableComponent;
  private flySoundComponent!: FlySoundComponent;
  private healthComponent!: FlyHealthComponent;

  constructor(private readonly fly: Fly) {}

  start() {
    this.flyRepresentableComponent = this.fly.components.findComponent(FlyRepresentableComponent);
    this.fly.components.findComponent(FlyMovementComponent);
    this.flySoundComponent = this.fly.components.findComponent(FlySoundComponent);
    this.healthComponent = this.fly.components.findComponent(FlyHealthComponent);

    this.flyPrefabPointerHitSubscription = this.flyRepresentableComponent.pointerDown.subscribe(this.flyHit);
  }

  private flyHit = () => {
    if (this.fly.killed) return;
    this.healthComponent.takeDamage(1);
    if (this.healthComponent.isAlive()) {
      this.flySoundComponent.playHitSound();
    }
    this.onFlyHit.next(this.fly);
  };

  kill() {
    this.healthComponent.killActor();
  }

  destroy() {
    this.flyPrefabPointerHitSubscription.unsubscribe();
    this.flyRepresentableComponent.off("pointerdown");
  }
}
