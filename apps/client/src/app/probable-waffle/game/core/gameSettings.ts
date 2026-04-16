export class GameSettings {
  lockToScreen: boolean;
  enabledMouseCornerMovement: boolean;

  constructor() {
    // lockToScreen is disabled by default as it may be annoying for players in a browser environment
    // Note that there's also a jump when lock is disabled, which may cause discomfort to some players
    this.lockToScreen = false;
    // enabledMouseCornerMovement is disabled by default as it works well only with lockToScreen
    this.enabledMouseCornerMovement = false;
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
