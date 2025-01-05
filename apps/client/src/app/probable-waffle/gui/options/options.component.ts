import { Component, OnInit } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { VolumeSettings } from "../../game/core/volumeSettings";
import { AngularHost } from "../../../shared/consts";

@Component({
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  standalone: true,
  imports: [FormsModule, RouterLink],
  host: AngularHost.contentFlexFullHeight
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
