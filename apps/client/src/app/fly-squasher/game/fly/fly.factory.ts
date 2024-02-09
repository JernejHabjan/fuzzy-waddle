import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { Fly } from "./fly";
import { FlyHealthComponent } from "./components/fly-health-component";
import { WorldSpeedState } from "./components/fly-movement-component";
import { FlySquasherAudio } from "../audio";

export class FlyFactory {
  static spawnFly(scene: BaseScene, worldSpeedState: WorldSpeedState, audio: FlySquasherAudio): Fly {
    const fly = new Fly(scene, worldSpeedState, audio);
    fly.registerGameObject();
    fly.components.findComponent(FlyHealthComponent).setVisibilityUiComponent(false);
    return fly;
  }

  static spawnFlyBoss(scene: BaseScene, worldSpeedState: WorldSpeedState, audio: FlySquasherAudio): Fly {
    const bossFly = new Fly(scene, worldSpeedState, audio, { type: "boss" });
    bossFly.registerGameObject();
    return bossFly;
  }

  static spawnFlyLargeBoss(scene: BaseScene, worldSpeedState: WorldSpeedState, audio: FlySquasherAudio): Fly {
    const bossFly = new Fly(scene, worldSpeedState, audio, { type: "large-boss" });
    bossFly.registerGameObject();
    return bossFly;
  }
}
