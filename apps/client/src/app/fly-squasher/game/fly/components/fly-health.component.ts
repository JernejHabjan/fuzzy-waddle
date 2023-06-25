import { IComponent } from '../../../../probable-waffle/game/core/component.service';
import { Actor } from '../../../../probable-waffle/game/entity/actor/actor';
import { FlyRepresentableComponent } from './fly-representable-component';
import { Subject, Subscription } from 'rxjs';
import { FlyMovementComponent } from './fly-movement-component';
import { FlySoundComponent } from './fly-sound-component';

export class FlyHealthComponent implements IComponent {
  private flyPrefabPointerHitSubscription!: Subscription;
  readonly onFlyHit: Subject<void> = new Subject<void>();

  constructor(private readonly fly: Actor) {}

  start() {
    const component = this.fly.components.findComponent(FlyRepresentableComponent);
    this.flyPrefabPointerHitSubscription = component.pointerDown.subscribe(this.flyHit);
  }

  private flyHit = () => {
    const flyMovementComponent = this.fly.components.findComponent(FlyMovementComponent);
    flyMovementComponent.hit();
    const flySoundComponent = this.fly.components.findComponent(FlySoundComponent);
    flySoundComponent.hit();

    this.onFlyHit.next();
  };

  destroy() {
    const component = this.fly.components.findComponent(FlyRepresentableComponent);

    this.flyPrefabPointerHitSubscription.unsubscribe();
    component.off('pointerdown');
  }
}
