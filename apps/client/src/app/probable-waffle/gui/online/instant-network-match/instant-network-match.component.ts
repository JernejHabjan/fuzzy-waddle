import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";

import { LoaderComponent } from "../../../../shared/loader/loader.component";
import { MatchmakingService } from "../matchmaking/matchmaking.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../../../shared/consts";
import { CenterWrapperComponent } from "../../../../shared/components/center-wrapper/center-wrapper.component";

@Component({
  selector: "fuzzy-waddle-instant-network-match",
  imports: [LoaderComponent, RouterLink, CenterWrapperComponent],
  host: AngularHost.contentFlexFullHeight,
  template: `
    @if (errorText) {
      <fuzzy-waddle-center-wrapper>
        <p class="text-danger">{{ errorText }}</p>
        <button routerLink="/aota" class="btn btn-primary m-1" type="button">Home</button>
      </fuzzy-waddle-center-wrapper>
    } @else if (!matchmakingService.gameFound) {
      <fuzzy-waddle-loader />
    } @else {
      <fuzzy-waddle-center-wrapper>{{ matchmakingService.navigatingText }}</fuzzy-waddle-center-wrapper>
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
