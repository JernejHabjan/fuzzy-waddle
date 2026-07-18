import { VolumeSettings } from "./volumeSettings";
import { GameSettings } from "./gameSettings";
import { Subject } from "rxjs";

type OptionsChangedType = "volume" | "game";
export class GameOptionsService {
  volumeSettings = new VolumeSettings();
  gameSettings = new GameSettings();
  private localOptionsChanged = new Subject<{ type: OptionsChangedType; payload: any }>();
  settingsChanged = this.localOptionsChanged.asObservable();

  init() {
    this.volumeSettings.init();
    this.gameSettings.init();
  }

  optionsChanged() {
    return this.localOptionsChanged.asObservable();
  }

  saveChanges(type: OptionsChangedType) {
    if (type === "volume") {
      this.volumeSettings.saveToLocalStorage();
      this.localOptionsChanged.next({ type, payload: this.volumeSettings });
    } else if (type === "game") {
      this.gameSettings.saveToLocalStorage();
      this.localOptionsChanged.next({ type, payload: this.gameSettings });
    }
  }
}
