import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";

import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { VolumeSettings } from "../shared/volumeSettings";
import { AngularHost } from "../../shared/consts";
import { LeaveButtonComponent } from "../../shared/components/leave-button.component";

@Component({
  imports: [RouterLink, FormsModule, LeaveButtonComponent],
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: AngularHost.contentFlexFullHeightCenter
})
export class OptionsComponent implements OnInit {
  protected volumeSettings = new VolumeSettings();

  ngOnInit() {
    this.volumeSettings.init();
  }

  protected saveToLocalStorage() {
    this.volumeSettings.saveToLocalStorage();
  }
}
