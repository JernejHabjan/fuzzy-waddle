import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import {
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleLevels,
  type GameSaveRecord
} from "@fuzzy-waddle/api-interfaces";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameLengthPipe } from "@fuzzy-waddle/portal/shared/pipes/game-length.pipe";
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
  protected gameInstanceDataRecords: GameSaveRecord[] = [];
  async ngOnInit(): Promise<void> {
    this.gameInstanceDataRecords = (await this.gameSaveService.list()).filter(
      (record) => record.gameInstanceData.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.Replay
    );
  }

  protected getMapName(gameInstanceData: ProbableWaffleGameInstanceData): string {
    return ProbableWaffleLevels[gameInstanceData.gameModeData!.map!].name;
  }

  protected startReplay = async (save: GameSaveRecord): Promise<void> => {
    await this.gameInstanceClientService.startReplay(save.gameInstanceData);
  };

  protected async deleteReplay(save: GameSaveRecord) {
    await this.gameSaveService.delete(save.id);
    this.gameInstanceDataRecords = (await this.gameSaveService.list()).filter(
      (record) => record.gameInstanceData.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.Replay
    );
  }
}
