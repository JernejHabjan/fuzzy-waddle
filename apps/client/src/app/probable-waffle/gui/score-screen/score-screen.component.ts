import { Component, HostListener, inject, OnDestroy } from "@angular/core";

import { RouterLink } from "@angular/router";
import { ScoreTableComponent } from "./table/score-table.component";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Component({
  imports: [RouterLink, ScoreTableComponent, ScoreThroughTimeComponent],
  templateUrl: "./score-screen.component.html",
  styleUrls: ["./score-screen.component.scss"]
})
export class ScoreScreenComponent implements OnDestroy {
  protected activeTab: string = "scoreTable";
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  protected changeTab = (scoreTable: string) => {
    this.activeTab = scoreTable;
  };

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.ngOnDestroy();
  }

  async ngOnDestroy() {
    await this.gameInstanceClientService.stopGameInstance();
  }
}
