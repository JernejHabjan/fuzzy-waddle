import { Injectable } from "@angular/core";

/**
 * Bridges Angular with Tauri native capabilities when running as a desktop app.
 *
 * Uses `window.__TAURI_INTERNALS__` (runtime detection) to guard all Tauri calls.
 * This makes the service a safe no-op in browser builds.
 *
 * The Tauri Rust commands are declared in `apps/client/src-tauri/src/lib.rs`.
 */
/** Returns true when running inside a Tauri desktop window. */
export function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

@Injectable({
  providedIn: "root"
})
export class TauriService {
  /** Returns true when running inside a Tauri desktop window. */
  get isTauri(): boolean {
    return isTauri();
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
}
