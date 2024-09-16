import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoaderComponent } from "../../../../shared/loader/loader.component";
import { MatchmakingService } from "../matchmaking/matchmaking.service";

@Component({
  selector: "fuzzy-waddle-instant-network-match",
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  template: `
    @if (!matchmakingService.gameFound) {
      <fuzzy-waddle-loader />
    } @else {
      <div class="d-flex justify-content-center align-items-center h-100">{{ matchmakingService.navigatingText }}</div>
    }
  `
})
export class InstantNetworkMatchComponent implements OnInit, OnDestroy {
  protected readonly matchmakingService = inject(MatchmakingService);

  async ngOnInit(): Promise<void> {
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
