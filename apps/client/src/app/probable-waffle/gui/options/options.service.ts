import { Injectable } from "@angular/core";
import { VolumeSettings } from "../../game/core/volumeSettings";
import { Subject } from "rxjs";

type OptionsChangedType = "volume";
@Injectable({
  providedIn: "root"
})
export class OptionsService {
  volumeSettings = new VolumeSettings();
  private localOptionsChanged = new Subject<{ type: OptionsChangedType; payload: any }>();

  init() {
    this.volumeSettings.init();
  }

  optionsChanged() {
    return this.localOptionsChanged.asObservable();
  }

  saveChanges(type: OptionsChangedType) {
    this.volumeSettings.saveToLocalStorage();
    this.localOptionsChanged.next({ type, payload: this.volumeSettings });
  }
}
