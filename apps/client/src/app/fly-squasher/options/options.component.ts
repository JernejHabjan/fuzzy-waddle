import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { VolumeSettings } from "../shared/volumeSettings";

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
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
