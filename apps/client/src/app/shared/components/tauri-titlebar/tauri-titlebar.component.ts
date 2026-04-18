import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type OnDestroy,
  type OnInit
} from "@angular/core";
import { TauriService, isTauri } from "../../services/tauri.service";

/**
 * Custom frameless window title bar for the Tauri desktop app.
 *
 * Replaces the OS native chrome (which is disabled via `decorations: false` in
 * tauri.conf.json). Provides:
 *   - A `data-tauri-drag-region` area so the user can drag the window.
 *   - Minimize, maximize/restore, and close buttons.
 *   - A fullscreen toggle button (the game primarily runs fullscreen).
 *
 * The bar auto-hides when the window is in fullscreen mode and reappears when
 * returning to windowed mode.
 */
@Component({
  selector: "fuzzy-waddle-tauri-titlebar",
  templateUrl: "./tauri-titlebar.component.html",
  styleUrl: "./tauri-titlebar.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TauriTitlebarComponent implements OnInit, OnDestroy {
  protected readonly shouldRender = isTauri();
  protected readonly isMaximized = signal(false);

  private readonly tauriService = inject(TauriService);

  /** Shared signal — kept in sync by TauriService so app.component can also react to it. */
  protected readonly isFullscreen = this.tauriService.windowIsFullscreen;

  private unlistenResize?: () => void;

  async ngOnInit(): Promise<void> {
    if (!this.shouldRender) return;
    await this.syncWindowState();
    await this.listenForWindowChanges();
  }

  async ngOnDestroy(): Promise<void> {
    this.unlistenResize?.();
  }

  protected async minimize(): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch (err) {
      console.error("[TitleBar] minimize failed:", err);
    }
  }

  protected async toggleMaximize(): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      if (this.isMaximized()) {
        await win.unmaximize();
      } else {
        await win.maximize();
      }
      await this.syncWindowState();
    } catch (err) {
      console.error("[TitleBar] toggleMaximize failed:", err);
    }
  }

  protected async toggleFullscreen(): Promise<void> {
    // Route through TauriService so cursor is released when going windowed.
    const isNowFullscreen = await this.tauriService.toggleFullscreen();
    this.isFullscreen.set(isNowFullscreen);
  }

  protected async close(): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch (err) {
      console.error("[TitleBar] close failed:", err);
    }
  }

  private async syncWindowState(): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const [fs, max] = await Promise.all([win.isFullscreen(), win.isMaximized()]);
      this.tauriService.windowIsFullscreen.set(fs);
      this.isMaximized.set(max);
    } catch {
      // Ignore — state display is cosmetic
    }
  }

  private async listenForWindowChanges(): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      this.unlistenResize = await getCurrentWindow().onResized(async () => {
        await this.syncWindowState();
      });
    } catch {
      // Ignore — fallback is to always show the bar
    }
  }
}
