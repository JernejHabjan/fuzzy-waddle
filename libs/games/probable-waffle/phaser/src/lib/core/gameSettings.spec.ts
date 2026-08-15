import { GameSettings } from "./gameSettings";

describe("GameSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create with default values", () => {
    const settings = new GameSettings();
    expect(settings.lockToScreen).toBe(false);
    expect(settings.enabledMouseCornerMovement).toBe(false);
    expect(settings.enableSceneLightingEffects).toBe(false);
    expect(settings.automaticallySaveReplays).toBe(false);
    expect(settings.profanityFilter).toBe(true);
    expect(settings.showPing).toBe(false);
    expect(settings.defaultCameraDistance).toBe(1);
    expect(settings.maximumCameraDistance).toBe(0.5);
    expect(settings.enableSubtitles).toBe(true);
    expect(settings.defaultSinglePlayerSpeed).toBe("normal");
  });

  it("hydrates new preferences while preserving legacy defaults", () => {
    localStorage.setItem(
      "probable-waffle-game-settings",
      JSON.stringify({ lockToScreen: true, showFps: true, defaultSinglePlayerSpeed: "fast" })
    );

    const settings = GameSettings.loadFromLocalStorage();

    expect(settings.lockToScreen).toBe(true);
    expect(settings.showFps).toBe(true);
    expect(settings.defaultSinglePlayerSpeed).toBe("fast");
    expect(settings.profanityFilter).toBe(true);
  });

  it("falls back safely for malformed storage", () => {
    localStorage.setItem("probable-waffle-game-settings", "not-json");

    expect(GameSettings.loadFromLocalStorage().showTimeElapsed).toBe(false);
  });

  it("clamps a default view that is farther than the configured maximum", () => {
    localStorage.setItem(
      "probable-waffle-game-settings",
      JSON.stringify({ defaultCameraDistance: 0.5, maximumCameraDistance: 1 })
    );

    expect(GameSettings.loadFromLocalStorage().defaultCameraDistance).toBe(1);
  });

  it("should save and load from localStorage", () => {
    const settings = new GameSettings();
    settings.lockToScreen = true;
    settings.enabledMouseCornerMovement = true;
    settings.enableSceneLightingEffects = true;
    settings.saveToLocalStorage();

    const loadedSettings = GameSettings.loadFromLocalStorage();
    expect(loadedSettings.lockToScreen).toBe(true);
    expect(loadedSettings.enabledMouseCornerMovement).toBe(true);
    expect(loadedSettings.enableSceneLightingEffects).toBe(true);
  });

  it("should return default settings when localStorage is empty", () => {
    const settings = GameSettings.loadFromLocalStorage();
    expect(settings.lockToScreen).toBe(false);
    expect(settings.enabledMouseCornerMovement).toBe(false);
    expect(settings.enableSceneLightingEffects).toBe(false);
  });

  it("should initialize from localStorage", () => {
    const settings = new GameSettings();
    settings.lockToScreen = true;
    settings.saveToLocalStorage();

    const newSettings = new GameSettings();
    newSettings.init();
    expect(newSettings.lockToScreen).toBe(true);
  });
});
