import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { VolumeSettings } from "../../game/core/volumeSettings";

@Component({
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink]
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
