import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { VolumeSettings } from "../../game/core/volumeSettings";
import { AngularHost } from "../../../shared/consts";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  imports: [FormsModule, RouterLink],
  host: AngularHost.contentFlexFullHeightCenter
})
export class OptionsComponent implements OnInit {
  protected volumeSettings = new VolumeSettings();
  fromGame: boolean = false;
  dialogRef?: NgbModalRef;
  private readonly cdr = inject(ChangeDetectorRef);
  ngOnInit() {
    this.volumeSettings.init();
  }

  protected saveToLocalStorage() {
    this.volumeSettings.saveToLocalStorage();
    this.cdr.detectChanges();
  }

  backToGame() {
    this.dialogRef?.close();
  }
}
