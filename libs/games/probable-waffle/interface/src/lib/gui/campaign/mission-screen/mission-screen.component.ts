import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, type OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign-catalog";
import { CampaignProgressService } from "../campaign-progress.service";
import { CampaignLaunchService } from "../campaign-launch.service";
import { GameSaveService } from "../../../services/game-save/game-save.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import {
  CampaignFaction,
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
  protected readonly campaignFaction = CampaignFaction;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly campaignProgressService = inject(CampaignProgressService);
  private readonly campaignLaunchService = inject(CampaignLaunchService);
  private readonly gameSaveService = inject(GameSaveService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly continueSaveAvailable = signal(false);
  protected readonly launchInProgress = signal(false);
  protected readonly launchError = signal<string | undefined>(undefined);
  private readonly chapterId = signal<CampaignChapterId | undefined>(undefined);
  private readonly missionId = signal<CampaignMissionId | undefined>(undefined);
  private readonly requestedMissionId = signal<string | null>(null);
  protected readonly chapter = computed(() =>
    AOTA_CAMPAIGN_CATALOG.chapters.find((chapter) => chapter.id === this.chapterId())
  );
  protected readonly selectedMission = computed(() =>
    this.missionId()
      ? this.chapter()?.missions.find((mission) => mission.id === this.missionId())
      : this.chapter()?.missions[0]
  );
  protected readonly missionProgress = computed(() => {
    const mission = this.selectedMission();
    return mission ? this.campaignProgressService.getMissionProgress(mission.id) : undefined;
  });

  /** Returns the authoritative unlock state used to style and disable each mission node. */
  protected missionState(missionId: CampaignMissionId) {
    return this.campaignProgressService.getMissionProgress(missionId)?.state ?? "locked";
  }

  private readChapterId(value: string | null): CampaignChapterId | undefined {
    return isCampaignChapterId(value) ? value : undefined;
  }

  private readMissionId(value: string | null): CampaignMissionId | undefined {
    return isCampaignMissionId(value) ? value : undefined;
  }

  async ngOnInit(): Promise<void> {
    await this.campaignProgressService.load();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.chapterId.set(this.readChapterId(params.get("chapterId")));
      this.requestedMissionId.set(params.get("missionId"));
      this.missionId.set(this.readMissionId(params.get("missionId")));
      void this.resolveMissionRoute();
    });
  }

  /** Updates the briefing and continue state whenever Angular reuses this screen for another mission URL. */
  private async resolveMissionRoute(): Promise<void> {
    const mission = this.selectedMission();
    if (!this.chapter() || !mission || (this.requestedMissionId() !== null && !this.missionId())) {
      const recommended = this.campaignProgressService.recommendedMission()?.mission;
      await this.router.navigate(
        recommended ? ["/aota/campaign", recommended.chapterId, recommended.id] : ["/aota/campaign"],
        { replaceUrl: true }
      );
      return;
    }
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
    if (!save) return;
    this.launchInProgress.set(true);
    this.launchError.set(undefined);
    try {
      await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData);
    } catch (error) {
      console.error("Unable to continue campaign mission", error);
      this.launchError.set("The save could not be loaded. Choose another save or start the mission again.");
    } finally {
      this.launchInProgress.set(false);
    }
  }
}
