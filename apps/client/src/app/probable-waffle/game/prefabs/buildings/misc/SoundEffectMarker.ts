// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { onSceneInitialized } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import { type SoundDefinition } from "../../../entity/components/actor-audio/audio-actor-component";
import {
  EnvironmentSfxBirdsSounds,
  EnvironmentSfxLavaSounds,
  EnvironmentSfxSeagullsSounds,
  EnvironmentSfxWaterSounds
} from "../../../sfx/environment-sfx";
/* END-USER-IMPORTS */

export default class SoundEffectMarker extends Phaser.GameObjects.Ellipse {
  constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
    super(scene, x ?? 64, y ?? 32, width ?? 128, height ?? 64);

    this.isStroked = true;

    /* START-USER-CTR-CODE */
    onSceneInitialized(scene, this.sceneInit, this);
    this.setVisible(false);
    this.removeFromUpdateList();
    this.removeFromDisplayList();
    /* END-USER-CTR-CODE */
  }

  public sfxType: "birds" | "seagulls" | "water_flowing" | "lava" = "birds";

  /* START-USER-CODE */
  private audioService?: AudioService;

  private sceneInit(): void {
    this.audioService = getSceneService(this.scene, AudioService);

    // 3 to 5 seconds
    const delay = Phaser.Math.Between(3, 5) * 1000;
    this.scene.time.delayedCall(delay, () => {
      this.playSound();
    });
  }

  private getSoundDefinitions(): SoundDefinition[] | null {
    switch (this.sfxType) {
      case "seagulls":
        return EnvironmentSfxSeagullsSounds;
      case "water_flowing":
        return EnvironmentSfxWaterSounds;
      case "birds":
        return EnvironmentSfxBirdsSounds;
      case "lava":
        return EnvironmentSfxLavaSounds;
      default:
        return null;
    }
  }

  private playSound(): void {
    if (!this.audioService) return;
    if (!this.active) return;
    const soundDefinitions = this.getSoundDefinitions();
    if (!soundDefinitions) return;
    const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
    this.audioService.playSpatialAudioSprite(this, soundDefinition.key, soundDefinition.spriteName, undefined, {
      onComplete: () => {
        this.playSound();
      }
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
