import { ChangeDetectionStrategy, Component, computed, inject, signal, type OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign-catalog";
import { CampaignProgressService } from "../campaign-progress.service";
import { CampaignLaunchService } from "../campaign-launch.service";
import { GameSaveService } from "../../../services/game-save/game-save.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import {
  isCampaignChapterId,
  isCampaignMissionId,
  type CampaignChapterId,
  type CampaignMissionId
} from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "fuzzy-waddle-campaign-mission-screen",
  templateUrl: "./mission-screen.component.html",
  styleUrls: ["./mission-screen.component.scss"],
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissionScreenComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaignProgressService = inject(CampaignProgressService);
  private readonly campaignLaunchService = inject(CampaignLaunchService);
  private readonly gameSaveService = inject(GameSaveService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly continueSaveAvailable = signal(false);
  protected readonly launchInProgress = signal(false);
  protected readonly launchError = signal<string | undefined>(undefined);
  private readonly chapterId = this.readChapterId();
  private readonly missionId = this.readMissionId();
  protected readonly chapter = AOTA_CAMPAIGN_CATALOG.chapters.find((chapter) => chapter.id === this.chapterId);
  protected readonly selectedMission = computed(
    () => this.chapter?.missions.find((mission) => mission.id === this.missionId) ?? this.chapter?.missions[0]
  );
  protected readonly missionProgress = computed(() => {
    const mission = this.selectedMission();
    return mission ? this.campaignProgressService.getMissionProgress(mission.id) : undefined;
  });

  /** Returns the authoritative unlock state used to style and disable each mission node. */
  protected missionState(missionId: CampaignMissionId) {
    return this.campaignProgressService.getMissionProgress(missionId)?.state ?? "locked";
  }

  constructor() {
    if (!this.chapter || (this.missionId && !this.selectedMission())) {
      void this.router.navigate(["/aota/campaign"], { replaceUrl: true });
    }
  }

  private readChapterId(): CampaignChapterId | undefined {
    const value = this.route.snapshot.paramMap.get("chapterId");
    return isCampaignChapterId(value) ? value : undefined;
  }

  private readMissionId(): CampaignMissionId | undefined {
    const value = this.route.snapshot.paramMap.get("missionId");
    return isCampaignMissionId(value) ? value : undefined;
  }

  async ngOnInit(): Promise<void> {
    await this.campaignProgressService.load();
    const mission = this.selectedMission();
    if (mission)
      this.continueSaveAvailable.set(Boolean(await this.gameSaveService.continueCampaignMission(mission.id)));
  }

  protected async startMission(): Promise<void> {
    const mission = this.selectedMission();
    if (!mission || this.launchInProgress()) return;
    this.launchInProgress.set(true);
    this.launchError.set(undefined);
    try {
      await this.campaignLaunchService.startMission(mission);
    } catch (error) {
      console.error("Unable to start campaign mission", error);
      this.launchError.set("The mission could not be started. Please try again.");
    } finally {
      this.launchInProgress.set(false);
    }
  }

  protected async continueMission(): Promise<void> {
    const mission = this.selectedMission();
    if (!mission) return;
    const save = await this.gameSaveService.continueCampaignMission(mission.id);
    if (save) await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData);
  }
}
