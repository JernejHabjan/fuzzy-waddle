import { Injectable, type OnDestroy } from "@angular/core";
import { LittleMuncherCommunicator } from "@fuzzy-waddle/little-muncher-gameplay";

@Injectable({
  providedIn: "root"
})
export class LittleMuncherCommunicatorService extends LittleMuncherCommunicator implements OnDestroy {
  ngOnDestroy(): void {
    this.stopCommunication();
  }
}
