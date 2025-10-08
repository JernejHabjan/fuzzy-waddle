import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";

import {
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceSaveData,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";
import { Router } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { GameInstanceStorageServiceInterface } from "../../communicators/storage/game-instance-storage.service.interface";
import { DatePipe } from "@angular/common";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "fuzzy-waddle-load",
  imports: [DatePipe],
  templateUrl: "./load.component.html",
  styleUrls: ["./load.component.scss"]
})
export class LoadComponent implements OnInit {
  private readonly gameInstanceStorageService = inject(GameInstanceStorageServiceInterface);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);
  protected gameInstanceDataRecords: ProbableWaffleGameInstanceSaveData[] = [];
  fromGame: boolean = false;
  dialogRef?: NgbModalRef;

  async ngOnInit(): Promise<void> {
    await this.setData();
  }

  private async setData() {
    this.gameInstanceDataRecords = await this.gameInstanceStorageService.getFromStorage();
    // sort descending
    this.gameInstanceDataRecords.sort((a, b) => {
      const aCreated = a.created;
      const bCreated = b.created;
      if (aCreated < bCreated) {
        return 1;
      } else if (aCreated > bCreated) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  protected getMapName(gameInstanceData: ProbableWaffleGameInstanceData): string {
    return ProbableWaffleLevels[gameInstanceData.gameModeData!.map!].name;
  }

  protected async loadSave(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData) {
    if (this.fromGame) {
      this.dialogRef?.close();
      // if we are loading from the game, we need to stop the current game instance
      await this.gameInstanceClientService.stopGameInstance();
      setTimeout(async () => {
        await this.gameInstanceClientService.loadGameInstance(gameInstanceSaveData);
        this.gameInstanceClientService.gameInstanceToGameComponentCommunicator.next("refresh");
      }, 50);
    } else {
      await this.gameInstanceClientService.loadGameInstance(gameInstanceSaveData);
    }
  }

  protected async deleteSave(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData) {
    await this.gameInstanceStorageService.deleteFromStorage(gameInstanceSaveData);
    await this.setData();
  }

  handleLeave() {
    if (this.fromGame) {
      this.dialogRef?.close();
    } else {
      this.router.navigate(["/aota"]);
    }
  }
}
