import { Component, HostListener, inject, type OnDestroy, type OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { RouterLink } from "@angular/router";
import { ScoreTableComponent } from "./table/score-table.component";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { ScoreDataService } from "../../services/score-data.service";
import { ScoreSubmissionService } from "../../services/score-submission.service";
import { AuthService } from "../../../auth/auth.service";
import { type GameScoreSnapshotDto, ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";

@Component({
  imports: [RouterLink, ScoreTableComponent, ScoreThroughTimeComponent],
  templateUrl: "./score-screen.component.html",
  styleUrls: ["./score-screen.component.scss"]
})
export class ScoreScreenComponent implements OnInit, OnDestroy {
  protected activeTab: string = "scoreTable";
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly scoreDataService = inject(ScoreDataService);
  private readonly scoreSubmissionService = inject(ScoreSubmissionService);
  private readonly authService = inject(AuthService);
  private scoreSubmissionSub?: Subscription;

  protected changeTab = (scoreTable: string) => {
    this.activeTab = scoreTable;
  };

  async ngOnInit() {
    // Submit scores if this is an online game and user is last human player
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return;

    const gameInstanceId = gameInstance.gameInstanceMetadata.data.gameInstanceId;
    if (!gameInstanceId) {
      console.log("Offline game - skipping score submission");
      return;
    }

    const session = this.authService.session;
    if (!session?.user) {
      console.log("No authenticated user - skipping score submission");
      return;
    }

    const currentUser = session.user;

    // Check if current user is the last human player
    const isLast = this.scoreSubmissionService.isLastHumanPlayer(gameInstance, currentUser.id);

    if (isLast) {
      console.log("Last human player - submitting scores for all players");
      const playerScores = this.scoreDataService.getAllPlayerScores();
      const humanPlayerCount = gameInstance.players.filter(
        (p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
      ).length;

      const rawSnapshots = gameInstance.gameState?.data?.scoreSnapshots ?? [];
      const snapshots: GameScoreSnapshotDto[] = rawSnapshots.map((s) => ({
        timestamp: s.timestamp,
        playerScores: Array.from(s.playerScores.entries()).map(([playerNumber, ps]) => ({
          playerNumber,
          ...ps
        }))
      }));

      this.scoreSubmissionSub = this.scoreSubmissionService
        .submitScores(
          gameInstanceId,
          playerScores,
          currentUser.id,
          {
            gameType: String(gameInstance.gameInstanceMetadata.data.type),
            mapId: gameInstance.gameMode?.data?.map,
            humanPlayerCount
          },
          snapshots
        )
        .subscribe({
          next: (result) => {
            if (result.success) {
              console.log("Scores submitted successfully");
            } else {
              console.warn("Score submission failed, but continuing");
            }
          },
          error: (error) => {
            console.error("Error submitting scores:", error);
          }
        });
    } else {
      console.log("Not last human player - another player will submit scores");
    }
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    await this.ngOnDestroy();
  }

  async ngOnDestroy() {
    this.scoreSubmissionSub?.unsubscribe();
    await this.gameInstanceClientService.stopGameInstance();
  }
}
