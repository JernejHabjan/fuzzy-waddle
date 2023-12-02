import { IComponent } from "../../../../probable-waffle/game/core/component.service";
import { Actor } from "../../../../probable-waffle/game/entity/actor/actor";
import { FlyRepresentableComponent } from "./fly-representable-component";
import { Subject, Subscription } from "rxjs";
import { FlyMovementComponent } from "./fly-movement-component";
import { FlySoundComponent } from "./fly-sound-component";
import { HealthComponent } from "../../../../probable-waffle/game/entity/combat/components/health-component";
import { Fly } from "../fly";

export class FlyHealthSystem implements IComponent {
  private flyPrefabPointerHitSubscription!: Subscription;
  readonly onFlyHit: Subject<Fly> = new Subject<Fly>();
  private flyRepresentableComponent!: FlyRepresentableComponent;
  private flyMovementComponent!: FlyMovementComponent;
  private flySoundComponent!: FlySoundComponent;
  private healthComponent!: HealthComponent;

  constructor(private readonly fly: Fly) {}

  start() {
    this.flyRepresentableComponent = this.fly.components.findComponent(FlyRepresentableComponent);
    this.flyMovementComponent = this.fly.components.findComponent(FlyMovementComponent);
    this.flySoundComponent = this.fly.components.findComponent(FlySoundComponent);
    this.healthComponent = this.fly.components.findComponent(HealthComponent);

    this.flyPrefabPointerHitSubscription = this.flyRepresentableComponent.pointerDown.subscribe(this.flyHit);
  }

  private flyHit = () => {
    this.healthComponent.setCurrentHealth(this.healthComponent.getCurrentHealth() - 1);
    if (this.healthComponent.getCurrentHealth() > 0) {
      this.flySoundComponent.playHitSound();
    }
    this.onFlyHit.next(this.fly);
  };

  destroy() {
    this.flyPrefabPointerHitSubscription.unsubscribe();
    this.flyRepresentableComponent.off("pointerdown");
  }
}
