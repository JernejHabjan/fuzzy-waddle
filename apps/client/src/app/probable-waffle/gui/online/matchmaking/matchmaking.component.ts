import { Component, HostListener, inject, type OnDestroy, type OnInit } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import { RoomsService } from "../../../communicators/rooms/rooms.service";

import { FormsModule } from "@angular/forms";
import { MatchmakingService } from "./matchmaking.service";

@Component({
  selector: "probable-waffle-matchmaking",
  templateUrl: "./matchmaking.component.html",
  styleUrls: ["./matchmaking.component.scss"],
  imports: [FormsModule]
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  protected readonly FactionDefinitions = FactionDefinitions;
  protected readonly matchmakingService = inject(MatchmakingService);
  protected readonly roomsService = inject(RoomsService);

  async ngOnInit(): Promise<void> {
    await this.matchmakingService.init();
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.ngOnDestroy();
  }

  async ngOnDestroy(): Promise<void> {
    await this.matchmakingService.destroy();
  }
}
