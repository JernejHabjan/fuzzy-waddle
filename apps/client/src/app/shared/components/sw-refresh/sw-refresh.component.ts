import { Component, inject, OnInit } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "fuzzy-waddle-sw-refresh",
  templateUrl: "./sw-refresh.component.html",
  styleUrls: ["./sw-refresh.component.scss"]
})
export class SwRefreshComponent implements OnInit {
  protected readonly faSpinner = faSpinner;
  protected showNewVersion = false;
  protected showVersionReady = false;

  private readonly swUpdate = inject(SwUpdate);

  ngOnInit(): void {
    this.swUpdateCheck();
  }

  private swUpdateCheck() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((versionEvent) => {
        // if version available show version ready modal
        if (versionEvent.type === "VERSION_DETECTED") {
          this.showNewVersion = true;
        }
        if (versionEvent.type === "VERSION_READY") {
          this.showVersionReady = true;
        }
      });
    }
  }

  protected onVersionRefreshClick = () => {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  };
}
