import { BaseScene } from '../../../shared/game/phaser/scene/base.scene';
import { Fly } from './fly';
import { HealthComponent } from '../../../probable-waffle/game/entity/combat/components/health-component';
import { WorldSpeedState } from './components/fly-movement-component';

export class FlyFactory {
  static spawnFly(scene: BaseScene, worldSpeedState: WorldSpeedState): Fly {
    const fly = new Fly(scene, worldSpeedState);
    fly.registerGameObject();
    fly.components.findComponent(HealthComponent).setVisibilityUiComponent(false);
    return fly;
  }

  static spawnFlyBoss(scene: BaseScene, worldSpeedState: WorldSpeedState): Fly {
    const bossFly = new Fly(scene, worldSpeedState, { isBoss: true });
    bossFly.registerGameObject();
    return bossFly;
  }
}
