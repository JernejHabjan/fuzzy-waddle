import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";

export interface DesktopAuthBridge {
  readonly isDesktop: boolean;
  readonly deepLink$: Observable<string>;
  openInBrowser(url: string): Promise<void>;
}

export const DESKTOP_AUTH_BRIDGE = new InjectionToken<DesktopAuthBridge>("DESKTOP_AUTH_BRIDGE");
