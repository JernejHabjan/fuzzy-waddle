import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'fuzzy-waddle-sw-refresh',
  templateUrl: './sw-refresh.component.html',
  styleUrls: ['./sw-refresh.component.scss']
})
export class SwRefreshComponent implements OnInit {
  protected showVersionReady = false;

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit(): void {
    this.swUpdateCheck();
  }

  private swUpdateCheck() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((versionEvent) => {
        if (versionEvent.type === 'VERSION_READY') {
          this.showVersionReady = true;
        }
      });
    }
  }

  protected onVersionRefreshClick = () => {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  };
}
