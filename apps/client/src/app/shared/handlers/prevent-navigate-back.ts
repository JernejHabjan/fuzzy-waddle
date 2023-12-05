import { NavigationStart, Router } from "@angular/router";

export class PreventNavigateBack {
  private canNavigateBack = false;

  constructor(private readonly router: Router) {
    this.disableBrowserBackButton();
  }

  private disableBrowserBackButton() {
    // Subscribe to router events to handle back button in browser
    this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationStart && event.navigationTrigger === "popstate" && !this.canNavigateBack)) {
        return;
      }
      // noinspection JSIgnoredPromiseFromCall
      this.router.navigateByUrl(this.router.url);
    });
  }

  allowNavigateBack() {
    this.canNavigateBack = true;
  }

  navigateBack() {
    this.allowNavigateBack();
    window.history.back();
  }
}
