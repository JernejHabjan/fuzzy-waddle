import { ChangeDetectorRef, Component, inject, type OnInit } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { OptionsService } from "./options.service";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { CenterWrapperComponent } from "../../../shared/components/center-wrapper/center-wrapper.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

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
  ngOnInit() {
    this.optionsService.init();
  }

  protected saveToLocalStorage(type: "volume" | "game") {
    this.optionsService.saveChanges(type);
    this.cdr.detectChanges();
  }

  backToGame() {
    this.dialogRef?.close();
  }
}
