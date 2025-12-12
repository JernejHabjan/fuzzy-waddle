import { GameSettings } from "./gameSettings";

describe("GameSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should create with default values", () => {
    const settings = new GameSettings();
    expect(settings.lockToScreen).toBe(false);
    expect(settings.enabledMouseCornerMovement).toBe(false);
  });

  it("should save and load from localStorage", () => {
    const settings = new GameSettings();
    settings.lockToScreen = true;
    settings.enabledMouseCornerMovement = true;
    settings.saveToLocalStorage();

    const loadedSettings = GameSettings.loadFromLocalStorage();
    expect(loadedSettings.lockToScreen).toBe(true);
    expect(loadedSettings.enabledMouseCornerMovement).toBe(true);
  });

  it("should return default settings when localStorage is empty", () => {
    const settings = GameSettings.loadFromLocalStorage();
    expect(settings.lockToScreen).toBe(false);
    expect(settings.enabledMouseCornerMovement).toBe(false);
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
