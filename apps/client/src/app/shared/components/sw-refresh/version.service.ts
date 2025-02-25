import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { VersionServiceInterface } from "./version.service.interface";
import { SwUpdate } from "@angular/service-worker";
import { Subscription } from "rxjs";

export enum VersionState {
  Checking,
  NewVersionDetected,
  NewVersionDownloaded,
  VersionInstallationFailed,
  VersionOk
}

@Injectable({
  providedIn: "root"
})
export class VersionService implements VersionServiceInterface, OnDestroy {
  private readonly swUpdate = inject(SwUpdate);
  private unrecoverableSubscription?: Subscription;
  private versionUpdateSubscription?: Subscription;
  private readonly localVersionState = signal(VersionState.Checking);

  constructor() {
    this.subscribeToSwEvents();
    // noinspection JSIgnoredPromiseFromCall
    this.swUpdate.checkForUpdate();
  }

  versionState = this.localVersionState.asReadonly();

  onVersionRefreshClick = () => {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  };

  private subscribeToSwEvents() {
    this.versionUpdateSubscription = this.swUpdate.versionUpdates.subscribe((versionEvent) => {
      // if version available show version ready modal
      switch (versionEvent.type) {
        case "VERSION_DETECTED":
          this.localVersionState.set(VersionState.NewVersionDetected);
          break;
        case "VERSION_READY":
          this.localVersionState.set(VersionState.NewVersionDownloaded);
          break;
        case "VERSION_INSTALLATION_FAILED":
          this.localVersionState.set(VersionState.VersionInstallationFailed);
          break;
        case "NO_NEW_VERSION_DETECTED":
          this.localVersionState.set(VersionState.VersionOk);
          break;
      }
    });
    this.unrecoverableSubscription = this.swUpdate.unrecoverable.subscribe(() =>
      this.localVersionState.set(VersionState.VersionInstallationFailed)
    );
  }

  ngOnDestroy(): void {
    this.versionUpdateSubscription?.unsubscribe();
    this.unrecoverableSubscription?.unsubscribe();
  }
}
