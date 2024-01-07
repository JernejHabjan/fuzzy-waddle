import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameInstanceStorageService } from "../../communicators/storage/game-instance-storage.service";
import {
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";
import { RouterLink } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Component({
  selector: "fuzzy-waddle-load",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./load.component.html",
  styleUrls: ["./load.component.scss"]
})
export class LoadComponent implements OnInit {
  private readonly gameInstanceStorageService = inject(GameInstanceStorageService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected gameInstanceDataRecords: ProbableWaffleGameInstanceSaveData[] = [];
  async ngOnInit(): Promise<void> {
    this.gameInstanceDataRecords = await this.gameInstanceStorageService.getFromStorage();
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
