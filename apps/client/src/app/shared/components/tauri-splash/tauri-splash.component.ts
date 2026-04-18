import { ChangeDetectionStrategy, Component, signal, type OnDestroy, type OnInit } from "@angular/core";
import { isTauri } from "../../services/tauri.service";

/**
 * Cinematic splash screen overlay shown on Tauri desktop app launch.
 *
 * Shown only when running inside a Tauri window. Automatically fades out after
 * ~3 seconds and removes itself from the DOM so it has zero runtime cost after startup.
 *
 * Sequence: fade-in (0.6s) → hold → fade-out (0.8s) → hidden.
 */
@Component({
  selector: "fuzzy-waddle-tauri-splash",
  templateUrl: "./tauri-splash.component.html",
  styleUrl: "./tauri-splash.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TauriSplashComponent implements OnInit, OnDestroy {
  protected readonly shouldRender = isTauri();

  /** Controls CSS animation phase: 'entering' | 'visible' | 'leaving' | 'gone' */
  protected readonly phase = signal<"entering" | "visible" | "leaving" | "gone">("entering");

  protected readonly appVersion = signal<string>("");

  private readonly HOLD_MS = 1800;
  private readonly FADE_OUT_MS = 800;

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    if (!this.shouldRender) {
      this.phase.set("gone");
      return;
    }

    this.loadVersion();

    // entering → visible after CSS fade-in (600ms)
    this.timers.push(
      setTimeout(() => {
        this.phase.set("visible");
      }, 600)
    );

    // visible → leaving after hold time
    this.timers.push(
      setTimeout(() => {
        this.phase.set("leaving");
      }, 600 + this.HOLD_MS)
    );

    // leaving → gone after fade-out
    this.timers.push(
      setTimeout(() => {
        this.phase.set("gone");
      }, 600 + this.HOLD_MS + this.FADE_OUT_MS)
    );
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  private async loadVersion(): Promise<void> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const version = await invoke<string>("get_app_version");
      this.appVersion.set(version);
    } catch {
      // Silently ignore — version display is cosmetic
    }
  }
}
