import { environment } from "@fuzzy-waddle/environments/environment";
import { isTauri } from "@fuzzy-waddle/platform-game-host/tauri";
import type {
  ProbableWaffleCameraDistance,
  ProbableWafflePlayerPreferences,
  ProbableWaffleSinglePlayerSpeed
} from "@fuzzy-waddle/probable-waffle-protocol";

export type HomeScreenBackground = "ashfall" | "constellation";

export class GameSettings implements ProbableWafflePlayerPreferences {
  readonly version = 1 as const;
  lockToScreen: boolean;
  enabledMouseCornerMovement: boolean;
  enableSceneLightingEffects: boolean;
  homeScreenBackground: HomeScreenBackground;
  automaticallySaveReplays = false;
  profanityFilter = true;
  showPing = false;
  showActionsPerMinute = false;
  showFps = false;
  showTimeElapsed = false;
  defaultCameraDistance: ProbableWaffleCameraDistance = 1;
  maximumCameraDistance: ProbableWaffleCameraDistance = 0.5;
  enableSubtitles = true;
  defaultSinglePlayerSpeed: ProbableWaffleSinglePlayerSpeed = "normal";

  constructor() {
    // lockToScreen is disabled by default as it may be annoying for players in a browser environment
    // Note that there's also a jump when lock is disabled, which may cause discomfort to some players
    this.lockToScreen = false;
    // In Tauri the whole window is the game canvas, so edge-scroll is always desirable
    this.enabledMouseCornerMovement = isTauri();
    this.enableSceneLightingEffects = environment.production;
    this.homeScreenBackground = "ashfall";
  }

  init() {
    this.apply(GameSettings.loadFromLocalStorage());
  }

  /** Applies validated persisted values without replacing this observable settings instance. */
  apply(settings: ProbableWafflePlayerPreferences): void {
    Object.assign(this, settings, { version: 1 as const });
  }

  saveToLocalStorage() {
    if (this.defaultCameraDistance < this.maximumCameraDistance) {
      this.defaultCameraDistance = this.maximumCameraDistance;
    }
    const settingsToSaveJSON = JSON.stringify(this);
    localStorage.setItem("probable-waffle-game-settings", settingsToSaveJSON);
  }

  static loadFromLocalStorage(): GameSettings {
    const defaults = new GameSettings();
    const savedSettingsJSON = localStorage.getItem("probable-waffle-game-settings");
    if (savedSettingsJSON) {
      try {
        return GameSettings.fromUnknown(JSON.parse(savedSettingsJSON), defaults);
      } catch {
        return defaults;
      }
    }
    return defaults;
  }

  /** Narrows untrusted local or server JSON to the supported preference domain. */
  static fromUnknown(value: unknown, defaults = new GameSettings()): GameSettings {
    if (!value || typeof value !== "object") return defaults;
    const raw = value as Partial<Record<keyof ProbableWafflePlayerPreferences, unknown>>;
    const settings = new GameSettings();
    settings.lockToScreen = typeof raw.lockToScreen === "boolean" ? raw.lockToScreen : defaults.lockToScreen;
    settings.enabledMouseCornerMovement =
      typeof raw.enabledMouseCornerMovement === "boolean"
        ? raw.enabledMouseCornerMovement
        : defaults.enabledMouseCornerMovement;
    settings.enableSceneLightingEffects =
      typeof raw.enableSceneLightingEffects === "boolean"
        ? raw.enableSceneLightingEffects
        : defaults.enableSceneLightingEffects;
    settings.homeScreenBackground =
      raw.homeScreenBackground === "constellation" || raw.homeScreenBackground === "ashfall"
        ? raw.homeScreenBackground
        : defaults.homeScreenBackground;
    settings.automaticallySaveReplays =
      typeof raw.automaticallySaveReplays === "boolean"
        ? raw.automaticallySaveReplays
        : defaults.automaticallySaveReplays;
    settings.profanityFilter =
      typeof raw.profanityFilter === "boolean" ? raw.profanityFilter : defaults.profanityFilter;
    settings.showPing = typeof raw.showPing === "boolean" ? raw.showPing : defaults.showPing;
    settings.showActionsPerMinute =
      typeof raw.showActionsPerMinute === "boolean" ? raw.showActionsPerMinute : defaults.showActionsPerMinute;
    settings.showFps = typeof raw.showFps === "boolean" ? raw.showFps : defaults.showFps;
    settings.showTimeElapsed =
      typeof raw.showTimeElapsed === "boolean" ? raw.showTimeElapsed : defaults.showTimeElapsed;
    settings.defaultCameraDistance = isCameraDistance(raw.defaultCameraDistance)
      ? raw.defaultCameraDistance
      : defaults.defaultCameraDistance;
    settings.maximumCameraDistance = isCameraDistance(raw.maximumCameraDistance)
      ? raw.maximumCameraDistance
      : defaults.maximumCameraDistance;
    settings.enableSubtitles =
      typeof raw.enableSubtitles === "boolean" ? raw.enableSubtitles : defaults.enableSubtitles;
    settings.defaultSinglePlayerSpeed = isSinglePlayerSpeed(raw.defaultSinglePlayerSpeed)
      ? raw.defaultSinglePlayerSpeed
      : defaults.defaultSinglePlayerSpeed;
    if (settings.defaultCameraDistance < settings.maximumCameraDistance) {
      settings.defaultCameraDistance = settings.maximumCameraDistance;
    }
    return settings;
  }
}

function isCameraDistance(value: unknown): value is ProbableWaffleCameraDistance {
  return value === 0.5 || value === 1 || value === 2 || value === 4 || value === 8;
}

function isSinglePlayerSpeed(value: unknown): value is ProbableWaffleSinglePlayerSpeed {
  return value === "slow" || value === "normal" || value === "fast";
}
