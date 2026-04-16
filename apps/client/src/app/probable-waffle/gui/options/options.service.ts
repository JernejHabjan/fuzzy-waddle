import { Injectable } from "@angular/core";
import { VolumeSettings } from "../../game/core/volumeSettings";
import { GameSettings } from "../../game/core/gameSettings";
import { Subject } from "rxjs";

type OptionsChangedType = "volume" | "game";
@Injectable({
  providedIn: "root"
})
export class OptionsService {
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
