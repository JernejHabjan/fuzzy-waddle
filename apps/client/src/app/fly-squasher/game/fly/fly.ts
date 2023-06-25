import { Subject, Subscription } from 'rxjs';
import { BaseScene } from '../../../shared/game/phaser/scene/base.scene';
import { Actor } from '../../../probable-waffle/game/entity/actor/actor';
import { FlySoundComponent } from './components/fly-sound-component';
import { FlyMovementComponent } from './components/fly-movement-component';
import { FlyHealthComponent } from './components/fly-health.component';
import { FlyRepresentableComponent } from './components/fly-representable-component';

export class Fly extends Actor {
  readonly onFlyHit: Subject<void> = new Subject<void>();
  private flyHitSubscription!: Subscription;

  constructor(private readonly scene: BaseScene) {
    super({ scene });

    this.components.addComponent(new FlySoundComponent(scene));
    this.components.addComponent(new FlyHealthComponent(this));
    this.components.addComponent(new FlyMovementComponent(this, scene));
    this.components.addComponent(new FlyRepresentableComponent(scene));
  }

  override initComponents() {
    super.initComponents();
    this.flyHitSubscription = this.components.findComponent(FlyHealthComponent).onFlyHit.subscribe(this.onFlyHit);
  }

  get y() {
    return this.components.findComponent(FlyRepresentableComponent).y;
  }

  generateCoordinates() {
    this.components.findComponent(FlyMovementComponent).setFlyRandomPosition();
  }

  reset() {
    this.components.findComponent(FlyMovementComponent).reset();
    this.components.findComponent(FlySoundComponent).resume();
  }

  gameOver() {
    this.components.findComponent(FlySoundComponent).pause();
  }

  override destroy() {
    super.destroy();
    this.flyHitSubscription.unsubscribe();
  }
}
