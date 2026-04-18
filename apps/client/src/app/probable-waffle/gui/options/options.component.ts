import { ChangeDetectorRef, Component, inject, signal, type OnInit } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { OptionsService } from "./options.service";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { CenterWrapperComponent } from "../../../shared/components/center-wrapper/center-wrapper.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { isTauri, TauriService } from "../../../shared/services/tauri.service";

@Component({
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  imports: [FormsModule, RouterLink, HomeNavComponent, CenterWrapperComponent, FaIconComponent],
  host: AngularHost.contentFlexFullHeight
})
export class OptionsComponent implements OnInit {
  protected readonly faInfoCircle = faInfoCircle;
  fromGame: boolean = false;
  dialogRef?: NgbModalRef;
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly optionsService = inject(OptionsService);
  private readonly tauriService = inject(TauriService);
  protected readonly isTauri = isTauri();
  protected readonly isFullscreen = signal(false);

  async ngOnInit() {
    this.optionsService.init();
    if (this.isTauri) {
      this.isFullscreen.set(await this.tauriService.isFullscreen());
    }
  }

  protected saveToLocalStorage(type: "volume" | "game") {
    this.optionsService.saveChanges(type);
    this.cdr.detectChanges();
  }

  protected async toggleFullscreen(): Promise<void> {
    const newState = await this.tauriService.toggleFullscreen();
    this.isFullscreen.set(newState);
    this.cdr.detectChanges();
  }

  backToGame() {
    this.dialogRef?.close();
  }
}
