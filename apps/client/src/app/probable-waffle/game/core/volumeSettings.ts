import { environment } from "../../../../environments/environment";

export class VolumeSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;

  constructor() {
    this.masterVolume = environment.production ? 100 : 0;
    this.sfxVolume = 100;
    this.musicVolume = 60;
  }

  init() {
    const fromLocalStorage = VolumeSettings.loadFromLocalStorage();
    this.masterVolume = fromLocalStorage.masterVolume;
    this.sfxVolume = fromLocalStorage.sfxVolume;
    this.musicVolume = fromLocalStorage.musicVolume;
  }

  saveToLocalStorage() {
    const settingsToSaveJSON = JSON.stringify(this);
    localStorage.setItem("probable-waffle-volume", settingsToSaveJSON);
  }

  static loadFromLocalStorage() {
    const savedSettingsJSON = localStorage.getItem("probable-waffle-volume");
    if (savedSettingsJSON) {
      return JSON.parse(savedSettingsJSON);
    }
    return new VolumeSettings();
  }
}
