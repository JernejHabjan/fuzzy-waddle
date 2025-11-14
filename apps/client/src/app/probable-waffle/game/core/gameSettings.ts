import { environment } from "../../../../environments/environment";

export class GameSettings {
  lockToScreen: boolean;
  enabledMouseCornerMovement: boolean;

  constructor() {
    // lockToScreen is disabled in production as it's not working yet
    this.lockToScreen = environment.production ? false : false;
    this.enabledMouseCornerMovement = false;
  }

  init() {
    const fromLocalStorage = GameSettings.loadFromLocalStorage();
    this.lockToScreen = fromLocalStorage.lockToScreen;
    this.enabledMouseCornerMovement = fromLocalStorage.enabledMouseCornerMovement;
  }

  saveToLocalStorage() {
    const settingsToSaveJSON = JSON.stringify(this);
    localStorage.setItem("probable-waffle-game-settings", settingsToSaveJSON);
  }

  static loadFromLocalStorage() {
    const savedSettingsJSON = localStorage.getItem("probable-waffle-game-settings");
    if (savedSettingsJSON) {
      return JSON.parse(savedSettingsJSON);
    }
    return new GameSettings();
  }
}
