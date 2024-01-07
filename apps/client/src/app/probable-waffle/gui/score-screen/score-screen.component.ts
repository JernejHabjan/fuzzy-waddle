import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ScoreTableComponent } from "./table/score-table.component";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ScoreTableComponent, ScoreThroughTimeComponent],
  templateUrl: "./score-screen.component.html",
  styleUrls: ["./score-screen.component.scss"]
})
export class ScoreScreenComponent {
  protected activeTab: string = "scoreTable";

  protected changeTab = (scoreTable: string) => {
    this.activeTab = scoreTable;
  };
}
