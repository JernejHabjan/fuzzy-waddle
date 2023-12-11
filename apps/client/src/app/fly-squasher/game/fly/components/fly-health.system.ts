import { IComponent } from "../../../../probable-waffle/game/core/component.service";
import { FlyRepresentableComponent } from "./fly-representable-component";
import { Subject, Subscription } from "rxjs";
import { FlyMovementComponent } from "./fly-movement-component";
import { FlySoundComponent } from "./fly-sound-component";
import { HealthComponent } from "../../../../probable-waffle/game/entity/combat/components/health-component";
import { Fly } from "../fly";
import { DamageTypes } from "../../../../probable-waffle/game/entity/combat/damage-types";

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
    if (this.fly.killed) return;
    this.healthComponent.takeDamage(1, DamageTypes.DamageTypeNormal);
    if (this.healthComponent.isAlive()) {
      this.flySoundComponent.playHitSound();
    }
    this.onFlyHit.next(this.fly);
  };

  destroy() {
    this.flyPrefabPointerHitSubscription.unsubscribe();
    this.flyRepresentableComponent.off("pointerdown");
  }
}
