import { VolumeSettings } from "../../core/volumeSettings";
import { getSceneService } from "../components/scene-component-helpers";

export class AudioService {
  private volumeSettings = new VolumeSettings();

  constructor() {
    this.volumeSettings.init();
  }

  private get volumeRatio() {
    return this.volumeSettings.masterVolume / 100;
  }

  get sfxVolumeNormalized() {
    return (this.volumeSettings.sfxVolume * this.volumeRatio) / 100;
  }

  get musicVolumeNormalized() {
    return (this.volumeSettings.musicVolume * this.volumeRatio) / 100;
  }
}

export function getSfxVolumeNormalized(scene: Phaser.Scene) {
  return getSceneService(scene, AudioService)?.sfxVolumeNormalized;
}

export function getMusicVolumeNormalized(scene: Phaser.Scene) {
  return getSceneService(scene, AudioService)?.musicVolumeNormalized;
}
