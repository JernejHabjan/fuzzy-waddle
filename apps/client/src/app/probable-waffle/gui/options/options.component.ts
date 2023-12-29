import { Component, OnInit } from "@angular/core";
import { VolumeSettings } from "../../../fly-squasher/shared/volumeSettings";

@Component({
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"]
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
