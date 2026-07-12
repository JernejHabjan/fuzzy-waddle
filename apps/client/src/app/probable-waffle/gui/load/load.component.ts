import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import type { OnInit } from "@angular/core";

import type { GameSaveRecord } from "@fuzzy-waddle/api-interfaces";
import { Router } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { DatePipe } from "@angular/common";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "fuzzy-waddle-load",
  imports: [DatePipe],
  templateUrl: "./load.component.html",
  styleUrls: ["./load.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadComponent implements OnInit {
  private readonly gameSaveService = inject(GameSaveService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);
  protected readonly saves = signal<GameSaveRecord[]>([]);
  protected readonly campaignGroups = computed(() => {
    const groups = new Map<string, GameSaveRecord[]>();
    for (const save of this.saves().filter((save) => save.scope === "campaign")) {
      const key = save.campaign!.missionId;
      groups.set(key, [...(groups.get(key) ?? []), save]);
    }
    return [...groups.entries()].sort(([, a], [, b]) => b[0].updatedAt.localeCompare(a[0].updatedAt));
  });
  protected readonly skirmishSaves = computed(() => this.saves().filter((save) => save.scope === "skirmish"));
  fromGame: boolean = false;
  dialogRef?: NgbModalRef;

  async ngOnInit(): Promise<void> {
    await this.setData();
  }

  private async setData() {
    this.saves.set(await this.gameSaveService.list());
  }

  protected async loadSave(save: GameSaveRecord) {
    if (this.fromGame) {
      this.dialogRef?.close();
      // if we are loading from the game, we need to stop the current game instance
      await this.gameInstanceClientService.stopGameInstance();
      setTimeout(async () => {
        await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData);
        this.gameInstanceClientService.gameInstanceToGameComponentCommunicator.next("refresh");
      }, 50);
    } else {
      await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData);
    }
  }

  protected async deleteSave(save: GameSaveRecord) {
    await this.gameSaveService.delete(save.id);
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
import { GameSaveService } from "../../services/game-save/game-save.service";
