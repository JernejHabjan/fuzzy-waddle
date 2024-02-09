export class VolumeSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;

  constructor() {
    this.masterVolume = 100;
    this.sfxVolume = 100;
    this.musicVolume = 100;
  }

  init() {
    const fromLocalStorage = VolumeSettings.loadFromLocalStorage();
    this.masterVolume = fromLocalStorage.masterVolume;
    this.sfxVolume = fromLocalStorage.sfxVolume;
    this.musicVolume = fromLocalStorage.musicVolume;
  }

  saveToLocalStorage() {
    const settingsToSaveJSON = JSON.stringify(this);
    localStorage.setItem("fly-squasher-volume", settingsToSaveJSON);
  }

  static loadFromLocalStorage() {
    const savedSettingsJSON = localStorage.getItem("fly-squasher-volume");
    if (savedSettingsJSON) {
      return JSON.parse(savedSettingsJSON);
    }
    return new VolumeSettings();
  }
}
