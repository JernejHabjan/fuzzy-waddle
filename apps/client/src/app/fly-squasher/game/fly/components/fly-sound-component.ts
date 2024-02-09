import { IComponent } from "../../../../probable-waffle/game/core/component.service";
import { BaseScene } from "../../../../shared/game/phaser/scene/base.scene";
import { Actor } from "../../../../probable-waffle/game/entity/actor/actor";
import { FlySquasherAudio } from "../../audio";

export class FlySoundComponent implements IComponent {
  constructor(
    private readonly fly: Actor,
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
