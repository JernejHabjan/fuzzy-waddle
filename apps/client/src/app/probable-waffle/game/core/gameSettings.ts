import { isTauri } from "../../../shared/utils/tauri";

export class GameSettings {
  lockToScreen: boolean;
  enabledMouseCornerMovement: boolean;

  constructor() {
    // lockToScreen is disabled by default as it may be annoying for players in a browser environment
    // Note that there's also a jump when lock is disabled, which may cause discomfort to some players
    this.lockToScreen = false;
    // In Tauri the whole window is the game canvas, so edge-scroll is always desirable
    this.enabledMouseCornerMovement = isTauri();
  }

  init() {
    const fromLocalStorage = GameSettings.loadFromLocalStorage();
    this.lockToScreen = fromLocalStorage.lockToScreen;
    this.enabledMouseCornerMovement = fromLocalStorage.enabledMouseCornerMovement;
  }

  existGameSettings(): boolean {
    return localStorage.getItem("probable-waffle-game-settings") !== null;
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
