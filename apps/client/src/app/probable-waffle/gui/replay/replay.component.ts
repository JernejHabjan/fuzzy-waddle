import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { GameInstanceStorageService } from "../../communicators/storage/game-instance-storage.service";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import {
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "probable-waffle-replay",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./replay.component.html",
  styleUrls: ["./replay.component.scss"]
})
export class ReplayComponent implements OnInit {
  private readonly gameInstanceStorageService = inject(GameInstanceStorageService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected gameInstanceDataRecords: ProbableWaffleGameInstanceSaveData[] = [];
  async ngOnInit(): Promise<void> {
    this.gameInstanceDataRecords = await this.gameInstanceStorageService.getFromStorage();
  }

  protected getMapName(gameInstanceData: ProbableWaffleGameInstanceData): string {
    return ProbableWaffleLevels[gameInstanceData.gameModeData!.map!].name;
  }

  protected startReplay = async (gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> => {
    await this.gameInstanceClientService.startReplay(gameInstanceSaveData);
  };

  protected async deleteReplay(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData) {
    await this.gameInstanceStorageService.deleteFromStorage(gameInstanceSaveData);
    this.gameInstanceDataRecords = await this.gameInstanceStorageService.getFromStorage();
  }
}
