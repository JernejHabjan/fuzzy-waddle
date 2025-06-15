import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { NgbAlert } from "@ng-bootstrap/ng-bootstrap";
import { VersionService, VersionState } from "./version.service";
import { Subscription } from "rxjs";

@Component({
  selector: "fuzzy-waddle-sw-refresh",
  templateUrl: "./sw-refresh.component.html",
  styleUrls: ["./sw-refresh.component.scss"],
  imports: [FaIconComponent, NgbAlert]
})
export class SwRefreshComponent implements OnInit, OnDestroy {
  protected readonly faSpinner = faSpinner;
  protected showNewVersion = false;
  protected showVersionReady = false;
  protected showInstallationFailed = false;
  private versionStateSubscription?: Subscription;

  private readonly versionService = inject(VersionService);

  ngOnInit(): void {
    this.versionStateSubscription = this.versionService.versionState.subscribe(this.applyVersionState);
  }

  private applyVersionState = (versionState: VersionState) => {
    if (versionState === VersionState.NewVersionDetected) {
      this.showNewVersion = true;
    } else if (versionState === VersionState.VersionOk) {
      this.showNewVersion = false;
    } else if (versionState === VersionState.Checking) {
      this.showNewVersion = false;
    }
  };

  protected recover() {
    window.location.reload();
  }

  protected onVersionRefreshClick() {
    // this.versionService.onVersionRefreshClick();
  }

  ngOnDestroy(): void {
    this.versionStateSubscription?.unsubscribe();
  }
}
