import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

/**
 * Service that bridges Angular with Tauri native capabilities.
 * Provides cursor grab/lock for RTS edge-scroll panning and other desktop-specific features.
 *
 * Uses both `environment.isDesktop` (build-time flag for tree-shaking) and
 * `window.__TAURI_INTERNALS__` (runtime detection) to guard all Tauri calls.
 *
 * On non-desktop builds (`environment.isDesktop === false`) all methods are no-ops
 * so the same Angular code compiles for both web and desktop targets.
 */
@Injectable({
  providedIn: "root"
})
export class TauriService {
  /** Returns true when both the build flag and the Tauri runtime are present. */
  get isTauri(): boolean {
    return environment.isDesktop && typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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
}
