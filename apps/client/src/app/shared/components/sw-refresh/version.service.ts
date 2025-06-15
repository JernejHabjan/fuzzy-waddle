import { inject, Injectable, OnDestroy } from "@angular/core";
import { VersionServiceInterface } from "./version.service.interface";
import { SwUpdate } from "@angular/service-worker";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

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
  private readonly localVersionState = new BehaviorSubject(VersionState.Checking);
  private autoRefresh = true;

  constructor() {
    this.subscribeToSwEvents();
    if (this.swUpdate.isEnabled)
      // noinspection JSIgnoredPromiseFromCall
      this.swUpdate.checkForUpdate();
  }

  async ready(): Promise<void> {
    return new Promise<void>((resolve) => {
      const subscription = this.localVersionState.subscribe((state) => {
        if (state !== VersionState.VersionOk) return;
        subscription.unsubscribe();
        resolve();
      });
    });
  }

  get versionState(): Observable<VersionState> {
    return this.localVersionState.asObservable();
  }

  onVersionRefreshClick = () => {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  };

  private subscribeToSwEvents() {
    if (!this.swUpdate.isEnabled) {
      this.localVersionState.next(VersionState.VersionOk);
      return;
    }
    this.versionUpdateSubscription = this.swUpdate.versionUpdates.subscribe((versionEvent) => {
      // if version available, then show version ready modal
      switch (versionEvent.type) {
        case "VERSION_DETECTED":
          this.localVersionState.next(VersionState.NewVersionDetected);
          break;
        case "VERSION_READY":
          this.localVersionState.next(VersionState.NewVersionDownloaded);
          // Auto-refresh when version is ready
          if (this.autoRefresh) {
            this.swUpdate.activateUpdate().then(() => document.location.reload());
          }
          break;
        case "VERSION_INSTALLATION_FAILED":
          this.localVersionState.next(VersionState.VersionInstallationFailed);
          break;
        case "NO_NEW_VERSION_DETECTED":
          this.localVersionState.next(VersionState.VersionOk);
          break;
      }
    });
    this.unrecoverableSubscription = this.swUpdate.unrecoverable.subscribe(() => {
      this.localVersionState.next(VersionState.VersionInstallationFailed);
    });
  }

  ngOnDestroy(): void {
    this.versionUpdateSubscription?.unsubscribe();
    this.unrecoverableSubscription?.unsubscribe();
  }
}
