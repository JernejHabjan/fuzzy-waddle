import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoaderComponent } from "../../../../shared/loader/loader.component";
import { MatchmakingService } from "../matchmaking/matchmaking.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../../shared/consts";

@Component({
  selector: "fuzzy-waddle-instant-network-match",
  standalone: true,
  imports: [CommonModule, LoaderComponent, RouterLink],
  host: AngularHost.contentFlexFullHeight,
  template: `
    @if (errorText) {
      <div class="d-flex justify-content-center align-items-center h-100 flex-column">
        <p class="text-danger">{{ errorText }}</p>
        <button routerLink="/probable-waffle" class="btn btn-primary m-1" type="button">Home</button>
      </div>
    } @else if (!matchmakingService.gameFound) {
      <fuzzy-waddle-loader />
    } @else {
      <div class="d-flex justify-content-center align-items-center h-100">{{ matchmakingService.navigatingText }}</div>
    }
  `
})
export class InstantNetworkMatchComponent implements OnInit, OnDestroy {
  protected readonly matchmakingService = inject(MatchmakingService);
  private readonly serverHealthService = inject(ServerHealthService);
  protected errorText: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.serverHealthService.checkHealth();
    if (this.serverHealthService.serverUnavailable) {
      this.errorText = "Server is unavailable";
      return;
    }
    await this.matchmakingService.init();
    await this.matchmakingService.startSearching();
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.ngOnDestroy();
  }

  async ngOnDestroy(): Promise<void> {
    await this.matchmakingService.destroy();
  }
}
