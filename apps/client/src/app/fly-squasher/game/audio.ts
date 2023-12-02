import { VolumeSettings } from "../shared/volumeSettings";

export class FlySquasherAudio {
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
