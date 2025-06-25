import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { OptionsService } from "./options.service";
import { LeaveButtonComponent } from "../../../shared/components/leave-button.component";

@Component({
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  imports: [FormsModule, RouterLink, LeaveButtonComponent],
  host: AngularHost.contentFlexFullHeightCenter
})
export class OptionsComponent implements OnInit {
  fromGame: boolean = false;
  dialogRef?: NgbModalRef;
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly optionsService = inject(OptionsService);
  ngOnInit() {
    this.optionsService.init();
  }

  protected saveToLocalStorage() {
    this.optionsService.saveChanges("volume");
    this.cdr.detectChanges();
  }

  backToGame() {
    this.dialogRef?.close();
  }
}
