import { IFlyBase } from "../component.service";
import { BaseScene } from "../../../../shared/game/phaser/scene/base.scene";
import { FlyBase } from "../FlyBase";
import { FlySquasherAudio } from "../../audio";

export class FlySoundComponent implements IFlyBase {
  constructor(
    private readonly fly: FlyBase,
    private readonly scene: BaseScene,
    private readonly audio: FlySquasherAudio
  ) {}

  start() {
    this.scene.sound.play("flying", {
      loop: true,
      volume: this.audio.sfxVolumeNormalized
    });
  }

  playHitSound() {
    this.scene.sound.play("tap", { volume: this.audio.sfxVolumeNormalized });
  }

  kill() {
    this.scene.sound.play("squish", { volume: this.audio.sfxVolumeNormalized });
    this.stopFlyingSound();
  }

  destroy() {
    this.stopFlyingSound();
  }

  stopFlyingSound() {
    if (!this.scene) return;
    if (this.scene.sound.get("flying")) {
      this.scene.sound.removeByKey("flying");
    }
  }
}
