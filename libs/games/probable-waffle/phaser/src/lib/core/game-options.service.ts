import { VolumeSettings } from "./volumeSettings";
import { GameSettings } from "./gameSettings";
import { Subject } from "rxjs";

export type OptionsChangedEvent = { type: "volume"; payload: VolumeSettings } | { type: "game"; payload: GameSettings };
export class GameOptionsService {
  volumeSettings = new VolumeSettings();
  gameSettings = new GameSettings();
  private localOptionsChanged = new Subject<OptionsChangedEvent>();
  settingsChanged = this.localOptionsChanged.asObservable();

  init() {
    this.volumeSettings.init();
    this.gameSettings.init();
  }

  /** Applies a synchronized preference snapshot and notifies live Phaser consumers. */
  applyGameSettings(settings: GameSettings): void {
    this.gameSettings.apply(settings);
    this.gameSettings.saveToLocalStorage();
    this.localOptionsChanged.next({ type: "game", payload: this.gameSettings });
  }

  optionsChanged() {
    return this.localOptionsChanged.asObservable();
  }

  saveChanges(type: OptionsChangedEvent["type"]) {
    if (type === "volume") {
      this.volumeSettings.saveToLocalStorage();
      this.localOptionsChanged.next({ type, payload: this.volumeSettings });
    } else if (type === "game") {
      this.gameSettings.saveToLocalStorage();
      this.localOptionsChanged.next({ type, payload: this.gameSettings });
    }
  }
}
