import { inject, Injectable } from "@angular/core";
import { VolumeSettings } from "../../game/core/volumeSettings";
import { GameSettings } from "../../game/core/gameSettings";
import { Subject } from "rxjs";
import { TauriService } from "../../../shared/services/tauri.service";

type OptionsChangedType = "volume" | "game";
@Injectable({
  providedIn: "root"
})
export class OptionsService {
  private readonly tauriService = inject(TauriService);
  volumeSettings = new VolumeSettings();
  gameSettings = new GameSettings();
  private localOptionsChanged = new Subject<{ type: OptionsChangedType; payload: any }>();
  settingsChanged = this.localOptionsChanged.asObservable();

  init() {
    this.volumeSettings.init();
    this.gameSettings.init();
    // In Tauri desktop, mouse corner movement is always on and cursor is managed natively
    if (this.tauriService.isTauri && !this.gameSettings.existGameSettings()) {
      this.gameSettings.enabledMouseCornerMovement = true;
      this.saveChanges("game");
    }
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
