import { Component, HostListener, inject, OnDestroy, OnInit } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { UserInstanceService } from "../../../home/profile/user-instance.service";

@Component({
  templateUrl: "./probable-waffle.component.html",
  styleUrls: ["./probable-waffle.component.scss"]
})
export class ProbableWaffleComponent implements OnInit, OnDestroy {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly userInstanceService = inject(UserInstanceService);

  private readonly dEPRECATED_gameInstanceService = inject(DEPRECATED_gameInstanceService);

  ngOnInit(): void {
    this.userInstanceService.setVisitedGame("probable-waffle");
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGame("localAndRemote");
  }

  async ngOnDestroy(): Promise<void> {
    await this.onBeforeUnload();
  }
}
