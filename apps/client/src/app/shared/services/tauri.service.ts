import { inject, Injectable, NgZone, signal } from "@angular/core";
import { Subject } from "rxjs";
import { isTauri } from "../utils/tauri";

export { isTauri };

/**
 * Bridges Angular with Tauri native capabilities when running as a desktop app.
 *
 * Uses `window.__TAURI_INTERNALS__` (runtime detection) to guard all Tauri calls.
 * This makes the service a safe no-op in browser builds.
 *
 * The Tauri Rust commands are declared in `apps/client/src-tauri/src/lib.rs`.
 */

@Injectable({
  providedIn: "root"
})
export class TauriService {
  /** Emits URLs received via the registered deep-link scheme (`com.fuzzywaddle.probablewaffle://`). */
  readonly deepLink$ = new Subject<string>();

  /**
   * Reactive fullscreen state for the main window.
   * Updated by `syncWindowState()` (called on init and after each toggle).
   * Consumers (e.g. app.component) can use this to shift layout when the
   * title bar appears / disappears.
   */
  readonly windowIsFullscreen = signal(true);

  // Tauri event callbacks fire outside Angular's NgZone.  We must re-enter the
  // zone when emitting to deepLink$ so that any downstream async work (e.g.
  // Supabase exchangeCodeForSession) triggers change detection when it settles.
  private readonly ngZone = inject(NgZone);

  /** Returns true when running inside a Tauri desktop window. */
  get isTauri(): boolean {
    return isTauri();
  }

  /**
   * Registers a listener for deep-link URLs (desktop only).
   * Called once during app bootstrap — resolves immediately in browser builds.
   *
   * Deep links arrive when the OS activates the registered URI scheme, e.g.
   * `com.fuzzywaddle.probablewaffle://auth/callback?code=…` after OAuth.
   *
   * Two paths are covered:
   *  1. `onOpenUrl` — fired by the deep-link plugin when the app is the first
   *     process to receive the URL (initial launch or macOS URL events).
   *  2. `deep-link-received` event — emitted by our Rust single-instance
   *     callback when Windows spawns a second process for the protocol URL and
   *     single-instance kills it, forwarding its argv to this running instance.
   */
  async initDeepLinkListener(): Promise<void> {
    if (!this.isTauri) return;
    try {
      const [{ onOpenUrl }, { listen }] = await Promise.all([
        import("@tauri-apps/plugin-deep-link"),
        import("@tauri-apps/api/event")
      ]);

      await onOpenUrl((urls) => {
        console.log("[TauriService] onOpenUrl fired:", urls);
        this.ngZone.run(() => {
          for (const url of urls) {
            this.deepLink$.next(url);
          }
        });
      });

      await listen<string>("deep-link-received", (event) => {
        console.log("[TauriService] deep-link-received event:", event.payload);
        if (event.payload) {
          this.ngZone.run(() => {
            this.deepLink$.next(event.payload);
          });
        }
      });

      console.log("[TauriService] deep-link listeners registered");
    } catch (err) {
      console.error("[TauriService] deep-link listener failed:", err);
    }
  }

  /**
   * Opens a URL in the system default browser.
   * No-op in browser builds (URLs open directly in the same tab).
   */
  async openInBrowser(url: string): Promise<void> {
    if (!this.isTauri) return;
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
    } catch (err) {
      console.error("[TauriService] openInBrowser failed:", err);
    }
  }

  /**
   * Locks or unlocks the cursor to the application window.
   * Calls the custom Tauri Rust command `set_cursor_grab`.
   *
   * Ideal for RTS edge-scroll panning — locking the cursor to the window
   * prevents accidental clicks outside during gameplay.
   *
   * NOTE: On macOS, cursor grab may fall back to cursor hiding only due
   * to OS-level restrictions (known Tauri / WKWebView limitation).
   */
  async setCursorGrab(grab: boolean): Promise<void> {
    if (!this.isTauri) {
      return;
    }
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_cursor_grab", { grab });
    } catch (err) {
      console.error("[TauriService] set_cursor_grab failed:", err);
    }
  }

  /**
   * Releases the cursor lock.
   * Convenience wrapper around `setCursorGrab(false)`.
   * Should be called when leaving the game scene or on window blur.
   */
  async releaseCursor(): Promise<void> {
    await this.setCursorGrab(false);
  }

  /** Exits the desktop application. No-op in browser builds. */
  async quit(): Promise<void> {
    if (!this.isTauri) {
      return;
    }
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("quit");
    } catch (err) {
      console.error("[TauriService] quit failed:", err);
    }
  }

  /**
   * Toggles fullscreen on the main window.
   * Returns the new fullscreen state (true = fullscreen, false = windowed).
   *
   * Automatically releases the cursor grab when switching to windowed mode —
   * keeping the cursor locked in a resizable window would trap it.
   * No-op in browser builds.
   */
  async toggleFullscreen(): Promise<boolean> {
    if (!this.isTauri) return false;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const isNowFullscreen = await invoke<boolean>("toggle_fullscreen");
      this.windowIsFullscreen.set(isNowFullscreen);
      if (!isNowFullscreen) {
        await this.releaseCursor();
      }
      return isNowFullscreen;
    } catch (err) {
      console.error("[TauriService] toggleFullscreen failed:", err);
      return false;
    }
  }

  /** Returns whether the main window is currently in fullscreen mode. */
  async isFullscreen(): Promise<boolean> {
    if (!this.isTauri) return false;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      return await getCurrentWindow().isFullscreen();
    } catch {
      return false;
    }
  }

  /**
   * Reads actual window fullscreen state and updates the `windowIsFullscreen` signal.
   * Call once on app startup and whenever an external resize may have changed the state.
   */
  async syncWindowState(): Promise<void> {
    if (!this.isTauri) return;
    const fs = await this.isFullscreen();
    this.windowIsFullscreen.set(fs);
  }

  /**
   * Returns the application version string (e.g. "1.0.0") from Cargo.toml.
   * Returns an empty string in browser builds.
   */
  async getAppVersion(): Promise<string> {
    if (!this.isTauri) {
      return "";
    }
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<string>("get_app_version");
    } catch (err) {
      console.error("[TauriService] get_app_version failed:", err);
      return "";
    }
  }

  /**
   * Shows a native desktop notification.
   *
   * Requires `notification:default` in capabilities and `tauri-plugin-notification`
   * in Cargo.toml.
   *
   * @param title  Short notification title (e.g. "Game Saved")
   * @param body   Optional body text
   */
  async showNotification(title: string, body?: string): Promise<void> {
    if (!this.isTauri) {
      return;
    }
    try {
      const { isPermissionGranted, requestPermission, sendNotification } = await import(
        "@tauri-apps/plugin-notification"
      );
      let permission = await isPermissionGranted();
      if (!permission) {
        const result = await requestPermission();
        permission = result === "granted";
      }
      if (permission) {
        sendNotification({ title, body });
      }
    } catch (err) {
      console.error("[TauriService] showNotification failed:", err);
    }
  }

  /**
   * Sends a "Game Saved" desktop notification.
   * Wire this into the game save flow to notify the player even when the window
   * is in the background or minimised to the system tray.
   */
  async notifyGameSaved(slotName?: string): Promise<void> {
    const body = slotName ? `Saved to slot: ${slotName}` : "Your progress has been saved.";
    await this.showNotification("Game Saved", body);
  }
}
