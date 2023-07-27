import { Subject, Subscription } from 'rxjs';
import { BaseScene } from '../../../shared/game/phaser/scene/base.scene';
import { Actor } from '../../../probable-waffle/game/entity/actor/actor';
import { FlySoundComponent } from './components/fly-sound-component';
import { FlyMovementComponent, WorldSpeedState } from './components/fly-movement-component';
import { FlyHealthSystem } from './components/fly-health.system';
import { FlyRepresentableComponent } from './components/fly-representable-component';
import { HealthComponent } from '../../../probable-waffle/game/entity/combat/components/health-component';

export class Fly extends Actor {
  override despawnTime = 4;

  readonly onFlyHit: Subject<void> = new Subject<void>();
  readonly onFlyKill: Subject<void> = new Subject<void>();

  private flyHitSubscription!: Subscription;
  private flyRepresentableComponent!: FlyRepresentableComponent;
  private flySoundComponent: FlySoundComponent;
  private flyHealthSystem: FlyHealthSystem;
  private flyMovementComponent: FlyMovementComponent;

  constructor(
    private readonly scene: BaseScene,
    private readonly worldSpeedState: WorldSpeedState,
    private readonly actorOptions?: {
      isBoss: boolean;
    }
  ) {
    super({ scene });

    this.flySoundComponent = this.components.addComponent(new FlySoundComponent(this, scene));
    this.flyMovementComponent = this.components.addComponent(new FlyMovementComponent(this, scene, worldSpeedState));
    this.flyRepresentableComponent = this.components.addComponent(new FlyRepresentableComponent(this, scene));
    this.components.addComponent(
      new HealthComponent(this, scene, { maxHealth: actorOptions?.isBoss ? 6 : 1 }, this.healthBarOptions)
    );

    this.flyHealthSystem = this.components.addComponent(new FlyHealthSystem(this)); // todo add system?
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
    this.flyHitSubscription = this.components.findComponent(FlyHealthSystem).onFlyHit.subscribe(this.onFlyHit);
  }

  get y() {
    return this.components.findComponent(FlyRepresentableComponent).y;
  }

  override destroy() {
    super.destroy();
    this.flyHitSubscription.unsubscribe();
  }

  override kill() {
    super.kill();
    this.flySoundComponent.kill();
    this.flyMovementComponent.kill();
    this.flyRepresentableComponent.kill();
    this.onFlyKill.next();
  }

  despawn() {
    this.destroy();
  }
}
