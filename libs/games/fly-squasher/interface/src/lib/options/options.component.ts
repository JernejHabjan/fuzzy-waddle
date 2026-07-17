import { ChangeDetectionStrategy, Component, type OnInit } from "@angular/core";

import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { VolumeSettings } from "@fuzzy-waddle/fly-squasher-gameplay";
import { AngularHost } from "@fuzzy-waddle/portal/shared/consts";
import { HomeNavComponent } from "@fuzzy-waddle/portal/shared/components/home-nav/home-nav.component";
import { CenterWrapperComponent } from "@fuzzy-waddle/portal/shared/components/center-wrapper/center-wrapper.component";

@Component({
  imports: [RouterLink, FormsModule, HomeNavComponent, CenterWrapperComponent],
  templateUrl: "./options.component.html",
  styleUrls: ["./options.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
