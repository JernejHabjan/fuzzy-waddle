import { Component, inject, OnInit } from "@angular/core";

import {
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";
import { RouterLink } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { GameInstanceStorageServiceInterface } from "../../communicators/storage/game-instance-storage.service.interface";
import { DatePipe } from "@angular/common";

@Component({
  selector: "fuzzy-waddle-load",
  imports: [RouterLink, DatePipe],
  templateUrl: "./load.component.html",
  styleUrls: ["./load.component.scss"]
})
export class LoadComponent implements OnInit {
  private readonly gameInstanceStorageService = inject(GameInstanceStorageServiceInterface);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected gameInstanceDataRecords: ProbableWaffleGameInstanceSaveData[] = [];
  async ngOnInit(): Promise<void> {
    this.gameInstanceDataRecords = await this.gameInstanceStorageService.getFromStorage();
    // sort descending
    this.gameInstanceDataRecords.sort((a, b) => a.created - b.created);
  }

  protected getMapName(gameInstanceData: ProbableWaffleGameInstanceData): string {
    return ProbableWaffleLevels[gameInstanceData.gameModeData!.map!].name;
  }

  protected async loadSave(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData) {
    await this.gameInstanceClientService.loadGameInstance(gameInstanceSaveData);
  }

  protected async deleteSave(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData) {
    await this.gameInstanceStorageService.deleteFromStorage(gameInstanceSaveData);
    this.gameInstanceDataRecords = await this.gameInstanceStorageService.getFromStorage();
  }
}
