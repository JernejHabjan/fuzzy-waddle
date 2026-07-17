import { inject, Injectable, type OnDestroy } from "@angular/core";
import { type VersionServiceInterface } from "./version.service.interface";
import { SwUpdate } from "@angular/service-worker";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

export enum VersionState {
  Checking,
  NewVersionDetected,
  VersionOk,
  UpdatingApp // New state for when we're clearing cache
}

@Injectable({
  providedIn: "root"
})
export class VersionService implements VersionServiceInterface, OnDestroy {
  private readonly swUpdate = inject(SwUpdate);
  private unrecoverableSubscription?: Subscription;
  private versionUpdateSubscription?: Subscription;
  private readonly localVersionState = new BehaviorSubject(VersionState.Checking);

  constructor() {
    this.subscribeToSwEvents();
    if (this.swUpdate.isEnabled) {
      // noinspection JSIgnoredPromiseFromCall
      this.swUpdate.checkForUpdate();
    }
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

  private async clearAllCaches(): Promise<void> {
    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log("All caches cleared");
    } catch (error) {
      console.error("Error clearing caches:", error);
    }
  }

  private async unregisterServiceWorker(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      console.log("Service worker unregistered");
    } catch (error) {
      console.error("Error unregistering service worker:", error);
    }
  }

  private async forceReload(): Promise<void> {
    this.localVersionState.next(VersionState.UpdatingApp);

    try {
      // 1. Clear all caches first
      await this.clearAllCaches();

      // 2. Unregister service worker
      await this.unregisterServiceWorker();

      // 4. Hard reload the page
      window.location.reload();
    } catch (error) {
      console.error("Error during force reload:", error);
      // Fallback to regular reload
      window.location.reload();
    }
  }

  private subscribeToSwEvents() {
    if (!this.swUpdate.isEnabled) {
      this.localVersionState.next(VersionState.VersionOk);
      return;
    }

    this.versionUpdateSubscription = this.swUpdate.versionUpdates.subscribe((versionEvent) => {
      switch (versionEvent.type) {
        case "VERSION_DETECTED":
          this.localVersionState.next(VersionState.NewVersionDetected);
          // Immediately start force reload process
          // noinspection JSIgnoredPromiseFromCall
          this.forceReload();
          break;
        case "NO_NEW_VERSION_DETECTED":
          this.localVersionState.next(VersionState.VersionOk);
          break;
        // We don't handle VERSION_READY since we're doing aggressive updates
      }
    });

    this.unrecoverableSubscription = this.swUpdate.unrecoverable.subscribe(() => {
      // On unrecoverable error, also force reload
      // noinspection JSIgnoredPromiseFromCall
      this.forceReload();
    });
  }

  ngOnDestroy(): void {
    this.versionUpdateSubscription?.unsubscribe();
    this.unrecoverableSubscription?.unsubscribe();
  }
}
