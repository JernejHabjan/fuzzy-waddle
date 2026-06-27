import { isTauri } from "../../../shared/utils/tauri";

export type HomeScreenBackground = "ashfall" | "constellation";

export class GameSettings {
  lockToScreen: boolean;
  enabledMouseCornerMovement: boolean;
  homeScreenBackground: HomeScreenBackground;

  constructor() {
    // lockToScreen is disabled by default as it may be annoying for players in a browser environment
    // Note that there's also a jump when lock is disabled, which may cause discomfort to some players
    this.lockToScreen = false;
    // In Tauri the whole window is the game canvas, so edge-scroll is always desirable
    this.enabledMouseCornerMovement = isTauri();
    this.homeScreenBackground = "ashfall";
  }

  init() {
    const fromLocalStorage = GameSettings.loadFromLocalStorage();
    this.lockToScreen = fromLocalStorage.lockToScreen;
    this.enabledMouseCornerMovement = fromLocalStorage.enabledMouseCornerMovement;
    this.homeScreenBackground = fromLocalStorage.homeScreenBackground;
  }

  saveToLocalStorage() {
    const settingsToSaveJSON = JSON.stringify(this);
    localStorage.setItem("probable-waffle-game-settings", settingsToSaveJSON);
  }

  static loadFromLocalStorage() {
    const defaults = new GameSettings();
    const savedSettingsJSON = localStorage.getItem("probable-waffle-game-settings");
    if (savedSettingsJSON) {
      const parsedSettings = JSON.parse(savedSettingsJSON) as Partial<GameSettings>;
      const settings = new GameSettings();
      settings.lockToScreen = parsedSettings.lockToScreen ?? defaults.lockToScreen;
      settings.enabledMouseCornerMovement =
        parsedSettings.enabledMouseCornerMovement ?? defaults.enabledMouseCornerMovement;
      settings.homeScreenBackground =
        parsedSettings.homeScreenBackground === "constellation" ? "constellation" : defaults.homeScreenBackground;
      return settings;
    }
    return defaults;
  }
}
