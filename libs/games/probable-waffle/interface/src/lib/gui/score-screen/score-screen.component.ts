import { Component, HostListener, inject, type OnDestroy, type OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { ScoreTableComponent } from "./table/score-table.component";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { ScoreDataService } from "../../services/score-data.service";
import { ScoreSubmissionService } from "../../services/score-submission.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import {
  CampaignMissionOutcome,
  type CampaignMissionRuntimeState,
  type CampaignGameContext,
  type CampaignVictoryCommitRequest,
  GameResultStatus,
  type GameScoreSnapshotDto,
  ProbableWafflePlayerType,
  ProbableWaffleGameInstanceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CampaignProgressService } from "../campaign/campaign-progress.service";

@Component({
  imports: [ScoreTableComponent, ScoreThroughTimeComponent],
  templateUrl: "./score-screen.component.html",
  styleUrls: ["./score-screen.component.scss"]
})
export class ScoreScreenComponent implements OnInit, OnDestroy {
  protected activeTab: string = "scoreTable";
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly scoreDataService = inject(ScoreDataService);
  private readonly scoreSubmissionService = inject(ScoreSubmissionService);
  private readonly authService = inject(AuthService);
  private readonly campaignProgressService = inject(CampaignProgressService);
  private scoreSubmissionSub?: Subscription;

  protected changeTab = (scoreTable: string) => {
    this.activeTab = scoreTable;
  };

  protected leave = async () => {
    await this.gameInstanceClientService.leaveScoreScreen();
  };

  async ngOnInit() {
    // Submit scores if this is an online game and user is last human player
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (!gameInstance) return;

    const campaignContext = gameInstance.gameInstanceMetadata.data.campaignContext;
    if (campaignContext) {
      const campaignState = gameInstance.gameState?.data.campaignMission;
      const playerResult = this.scoreDataService
        .getAllPlayerScores()
        .find((score) => score.playerNumber === this.gameInstanceClientService.currentPlayerNumber)?.gameResult;
      const outcome =
        playerResult === GameResultStatus.Win
          ? CampaignMissionOutcome.Victory
          : playerResult === GameResultStatus.Quit
            ? CampaignMissionOutcome.Abandoned
            : CampaignMissionOutcome.Defeat;
      await this.campaignProgressService.recordResult(
        campaignResultCommitRequest(
          campaignContext,
          campaignState,
          outcome,
          gameInstance.gameInstanceMetadata.data.type === ProbableWaffleGameInstanceType.Replay
        )
      );
    }

    const gameInstanceId = gameInstance.gameInstanceMetadata.data.gameInstanceId!;

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
    // Best-effort score-screen exit. This should remove only the current player
    // from the finished match, not force-stop the session for other viewers.
    await this.gameInstanceClientService.leaveScoreScreen(false);
  }

  async ngOnDestroy() {
    this.scoreSubmissionSub?.unsubscribe();
  }
}

export function completedCampaignObjectiveIds(state?: CampaignMissionRuntimeState): string[] {
  return Object.entries(state?.objectives ?? {})
    .filter(([, objective]) => objective.status === "completed")
    .map(([objectiveId]) => objectiveId)
    .sort();
}

export function campaignResultCommitRequest(
  context: CampaignGameContext,
  state: CampaignMissionRuntimeState | undefined,
  outcome: CampaignMissionOutcome,
  replayPlayback: boolean
): CampaignVictoryCommitRequest {
  return {
    runId: context.runId,
    missionId: context.missionId,
    missionRevision: context.missionRevision,
    baseProfileRevision: state?.progression?.baseProfileRevision ?? 0,
    outcome,
    completedObjectiveIds: completedCampaignObjectiveIds(state),
    discoveredRewardIds: [...(state?.claimedRewardIds ?? [])].sort(),
    difficulty: state?.difficulty.difficulty ?? context.difficulty ?? "normal",
    replayPlayback,
    integrity: state?.rewardIntegrity ?? { eligibleForRewards: true, invalidationReasons: [] }
  };
}
