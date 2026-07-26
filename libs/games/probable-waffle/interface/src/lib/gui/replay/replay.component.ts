import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import {
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleLevels,
  type GameSaveRecord,
  isSupportedGameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameLengthPipe } from "../../pipes/game-length.pipe";
import { DatePipe } from "@angular/common";

@Component({
  selector: "probable-waffle-replay",
  imports: [RouterLink, GameLengthPipe, DatePipe],
  templateUrl: "./replay.component.html",
  styleUrls: ["./replay.component.scss"]
})
export class ReplayComponent implements OnInit {
  private readonly gameSaveService = inject(GameSaveService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);
  protected gameInstanceDataRecords: GameSaveRecord[] = [];
  async ngOnInit(): Promise<void> {
    this.gameInstanceDataRecords = (await this.gameSaveService.list())
      .filter(isSupportedGameSaveRecord)
      .filter(
        (record) => record.gameInstanceData.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.Replay
      );
  }

  protected getMapName(gameInstanceData: ProbableWaffleGameInstanceData): string {
    return ProbableWaffleLevels[gameInstanceData.gameModeData!.map!].name;
  }

  protected startReplay = async (save: GameSaveRecord): Promise<void> => {
    await this.gameInstanceClientService.startReplay(save.gameInstanceData);
  };

  protected async replayCampaignMission(save: GameSaveRecord): Promise<void> {
    if (!save.campaign) return;
    await this.router.navigate(["/aota/campaign", save.campaign.chapterId, save.campaign.missionId]);
  }

  protected async deleteReplay(save: GameSaveRecord) {
    await this.gameSaveService.delete(save.id);
    this.gameInstanceDataRecords = (await this.gameSaveService.list())
      .filter(isSupportedGameSaveRecord)
      .filter(
        (record) => record.gameInstanceData.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.Replay
      );
  }
}
