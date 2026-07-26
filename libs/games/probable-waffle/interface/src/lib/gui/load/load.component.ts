import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import type { OnInit } from "@angular/core";

import {
  GameSaveKind,
  GameSaveScope,
  ProbableWaffleGameInstanceType,
  isCampaignMissionId,
  type CampaignMissionId,
  type GameSaveListEntry,
  type GameSaveRecord,
  type UnsupportedGameSaveRecord,
  isSupportedGameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ActivatedRoute, Router } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { DatePipe } from "@angular/common";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign/campaign-catalog";

/**
 * Defines the structured campaign save group contract for this module. Its declared surface makes mission id,
 * chapter label, mission title, newest at, saves explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
interface CampaignSaveGroup {
  /**
   * stable mission id used by {@link CampaignSaveGroup} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  missionId: CampaignMissionId;
  /**
   * human-facing chapter label for {@link CampaignSaveGroup}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  chapterLabel: string;
  /**
   * human-facing mission title for {@link CampaignSaveGroup}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  missionTitle: string;
  /**
   * temporal value for {@link CampaignSaveGroup}. It anchors ordering, expiry, or presentation timing and must
   * use the time domain declared by the enclosing contract.
   */
  newestAt: string;
  /**
   * collection value on {@link CampaignSaveGroup}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
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
  protected readonly saves = signal<GameSaveListEntry[]>([]);
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
    this.saves()
      .filter(isSupportedGameSaveRecord)
      .filter(
        (save) =>
          save.gameInstanceData.gameInstanceMetadataData?.type !== ProbableWaffleGameInstanceType.Replay &&
          (!this.scopeFilter || save.scope === this.scopeFilter) &&
          (!this.missionScopeId || save.campaign?.missionId === this.missionScopeId)
      )
  );
  protected readonly skirmishSaves = computed(() =>
    this.filteredSaves().filter((save) => save.scope === GameSaveScope.Skirmish)
  );
  protected readonly unsupportedSaves = computed(() =>
    this.saves().filter((save): save is UnsupportedGameSaveRecord => !isSupportedGameSaveRecord(save))
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
        await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData, save.campaign);
        this.gameInstanceClientService.gameInstanceToGameComponentCommunicator.next("refresh");
      }, 50);
    } else {
      await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData, save.campaign);
    }
  }

  protected async deleteSave(save: GameSaveRecord) {
    await this.gameSaveService.delete(save.id);
    await this.setData();
  }

  protected async deleteUnsupportedSave(save: UnsupportedGameSaveRecord): Promise<void> {
    await this.gameSaveService.delete(save.id);
    await this.setData();
  }

  protected async exportUnsupportedSave(save: UnsupportedGameSaveRecord): Promise<void> {
    const content = await this.gameSaveService.exportSave(save.id);
    if (!content) return;
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `probable-waffle-save-${save.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
