import { Component, effect, inject } from "@angular/core";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { NgbAlert } from "@ng-bootstrap/ng-bootstrap";
import { VersionService, VersionState } from "./version.service";

@Component({
  selector: "fuzzy-waddle-sw-refresh",
  templateUrl: "./sw-refresh.component.html",
  styleUrls: ["./sw-refresh.component.scss"],
  imports: [FaIconComponent, NgbAlert]
})
export class SwRefreshComponent {
  protected readonly faSpinner = faSpinner;
  protected showNewVersion = false;
  protected showVersionReady = false;
  protected showInstallationFailed = false;

  private readonly versionService = inject(VersionService);

  private readonly versionChangeEffect = effect(() => {
    const versionState = this.versionService.versionState();
    if (versionState === VersionState.NewVersionDetected) {
      this.showNewVersion = true;
    } else if (versionState === VersionState.NewVersionDownloaded) {
      this.showVersionReady = true;
    } else if (versionState === VersionState.VersionInstallationFailed) {
      this.showInstallationFailed = true;
    } else if (versionState === VersionState.VersionOk) {
      this.showNewVersion = false;
    } else if (versionState === VersionState.Checking) {
      this.showNewVersion = false;
    }
  });

  protected recover() {
    window.location.reload();
  }

  protected onVersionRefreshClick() {
    this.versionService.onVersionRefreshClick();
  }
}
