import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";

export interface DesktopAuthBridge {
  readonly isDesktop: boolean;
  readonly deepLink$: Observable<string>;
  /** Ensures native deep-link events are connected before an external auth flow starts. */
  initDeepLinkListener(): Promise<void>;
  /** Opens an external URL and rejects if the native opener cannot launch it. */
  openInBrowser(url: string): Promise<void>;
}

export const DESKTOP_AUTH_BRIDGE = new InjectionToken<DesktopAuthBridge>("DESKTOP_AUTH_BRIDGE");
