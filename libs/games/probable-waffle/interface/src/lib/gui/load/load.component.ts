import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import type { OnInit } from "@angular/core";

import { GameSaveKind, GameSaveScope, ProbableWaffleGameInstanceType, isCampaignMissionId, type CampaignMissionId, type GameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import { ActivatedRoute, Router } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { DatePipe } from "@angular/common";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign/campaign-catalog";

interface CampaignSaveGroup {
  missionId: CampaignMissionId;
  chapterLabel: string;
  missionTitle: string;
  newestAt: string;
  saves: GameSaveRecord[];
}

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
  private readonly route = inject(ActivatedRoute);
  protected readonly saves = signal<GameSaveRecord[]>([]);
  protected readonly renameSaveId = signal<string | undefined>(undefined);
  protected readonly renameValue = signal("");
  missionScopeId?: CampaignMissionId;
  scopeFilter?: GameSaveScope;
  protected readonly campaignGroups = computed(() => {
    const groups = new Map<CampaignMissionId, GameSaveRecord[]>();
    for (const save of this.filteredSaves()) {
      if (save.scope !== GameSaveScope.Campaign || !save.campaign) continue;
      const key = save.campaign.missionId;
      groups.set(key, [...(groups.get(key) ?? []), save]);
    }
    return [...groups.entries()]
      .map(([missionId, saves]): CampaignSaveGroup => {
        const chapter = AOTA_CAMPAIGN_CATALOG.chapters.find((candidate) =>
          candidate.missions.some((mission) => mission.id === missionId)
        );
        const mission = chapter?.missions.find((candidate) => candidate.id === missionId);
        return {
          missionId,
          chapterLabel: chapter?.subtitle ?? "Campaign",
          missionTitle: mission?.title ?? missionId,
          newestAt: saves.at(0)?.updatedAt ?? "",
          saves
        };
      })
      .sort((a, b) => b.newestAt.localeCompare(a.newestAt));
  });
  protected readonly filteredSaves = computed(() =>
    this.saves().filter(
      (save) =>
        save.gameInstanceData.gameInstanceMetadataData?.type !== ProbableWaffleGameInstanceType.Replay &&
        (!this.scopeFilter || save.scope === this.scopeFilter) &&
        (!this.missionScopeId || save.campaign?.missionId === this.missionScopeId)
    )
  );
  protected readonly skirmishSaves = computed(() =>
    this.filteredSaves().filter((save) => save.scope === GameSaveScope.Skirmish)
  );
  fromGame: boolean = false;
  dialogRef?: NgbModalRef;

  async ngOnInit(): Promise<void> {
    const requestedMissionId = this.route.snapshot.queryParamMap.get("missionId");
    this.missionScopeId ??= isCampaignMissionId(requestedMissionId) ? requestedMissionId : undefined;
    if (this.missionScopeId) this.scopeFilter = "campaign";
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

  protected beginRename(save: GameSaveRecord): void {
    if (save.kind !== GameSaveKind.Manual) return;
    this.renameSaveId.set(save.id);
    this.renameValue.set(save.name ?? "");
  }

  protected updateRenameValue(event: Event): void {
    this.renameValue.set((event.target as HTMLInputElement).value);
  }

  protected async confirmRename(): Promise<void> {
    const id = this.renameSaveId();
    const name = this.renameValue().trim();
    if (!id || !name) return;
    await this.gameSaveService.rename(id, name);
    this.renameSaveId.set(undefined);
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
