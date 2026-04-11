import { Injectable } from "@angular/core";

/**
 * Bridges Angular with Tauri native capabilities when running as a desktop app.
 *
 * Uses runtime detection (`window.__TAURI_INTERNALS__`) so the same service
 * code is safe to load in browser contexts — all methods become no-ops when
 * not running inside a Tauri webview.
 *
 * The Tauri Rust commands are declared in
 * `apps/probable-waffle-client/src-tauri/src/lib.rs`.
 */
@Injectable({
  providedIn: "root"
})
export class TauriService {
  /** Returns true when running inside a Tauri desktop window. */
  get isTauri(): boolean {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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
