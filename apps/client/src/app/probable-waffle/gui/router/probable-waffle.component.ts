import { Component, HostListener, inject, type OnDestroy, type OnInit } from "@angular/core";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { UserInstanceService } from "../../../home/profile/user-instance.service";
import { RouterOutlet } from "@angular/router";
import { AngularHost } from "../../../shared/consts";
import { TauriService } from "../../../shared/services/tauri.service";

@Component({
  templateUrl: "./probable-waffle.component.html",
  styleUrls: ["./probable-waffle.component.scss"],
  imports: [RouterOutlet],
  host: {
    ...AngularHost.contentFlexFullHeight,
    "(window:focus)": "onWindowFocus()",
    "(window:blur)": "onWindowBlur()"
  }
})
export class ProbableWaffleComponent implements OnInit, OnDestroy {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly userInstanceService = inject(UserInstanceService);
  private readonly tauriService = inject(TauriService);

  ngOnInit(): void {
    this.userInstanceService.setVisitedGame("aota");
    // Lock cursor to window for edge-scroll panning (Tauri desktop only — no-op in browser)
    // noinspection JSIgnoredPromiseFromCall
    this.tauriService.setCursorGrab(true);
  }

  protected onWindowFocus(): void {
    // noinspection JSIgnoredPromiseFromCall
    this.tauriService.setCursorGrab(true);
  }

  /** Release cursor lock when the window loses focus (e.g. Alt+Tab). */
  protected onWindowBlur(): void {
    // noinspection JSIgnoredPromiseFromCall
    this.tauriService.releaseCursor();
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGameInstance();
  }

  async ngOnDestroy(): Promise<void> {
    // Release cursor lock when leaving the game scene
    // noinspection ES6MissingAwait
    this.tauriService.releaseCursor();
    await this.onBeforeUnload();
  }
}
