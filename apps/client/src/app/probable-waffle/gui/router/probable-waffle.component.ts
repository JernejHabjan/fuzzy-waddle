import { Component, HostListener, inject, OnDestroy } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Component({
  selector: "fuzzy-waddle-probable-waffle",
  templateUrl: "./probable-waffle.component.html",
  styleUrls: ["./probable-waffle.component.scss"]
})
export class ProbableWaffleComponent implements OnDestroy {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  constructor(private dEPRECATED_gameInstanceService: DEPRECATED_gameInstanceService) {}

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGame("localAndRemote");
  }

  async ngOnDestroy(): Promise<void> {
    await this.onBeforeUnload();
  }
}
