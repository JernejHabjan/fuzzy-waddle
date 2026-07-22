import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, type OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign-catalog";
import { CampaignProgressService } from "../campaign-progress.service";
import { CampaignLaunchService } from "../campaign-launch.service";
import { CampaignProfileService } from "../campaign-profile.service";
import { GameSaveService } from "../../../services/game-save/game-save.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { environment } from "@fuzzy-waddle/environments/environment";
import {
  CampaignFaction,
  type CampaignDifficulty,
  isCampaignChapterId,
  isCampaignMissionId,
  type CampaignChapterId,
  type CampaignMissionId
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  resolveCampaignEffectiveProgression
} from "@fuzzy-waddle/probable-waffle-campaign";

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
  private readonly campaignProfileService = inject(CampaignProfileService);
  private readonly gameSaveService = inject(GameSaveService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly continueSaveAvailable = signal(false);
  protected readonly launchInProgress = signal(false);
  protected readonly launchError = signal<string | undefined>(undefined);
  protected readonly difficulties: readonly CampaignDifficulty[] = ["story", "normal", "hard"];
  protected readonly difficulty = signal<CampaignDifficulty>("normal");
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
  protected readonly profile = this.campaignProfileService.profile;
  protected readonly profileError = this.campaignProfileService.error;
  protected readonly walletEntries = computed(() => Object.entries(this.profile().progression.wallet.balances));
  protected readonly heroes = AOTA_CAMPAIGN_PROGRESSION_REGISTRY.heroDefinitions();
  protected readonly upgradeOptions = computed(() =>
    AOTA_CAMPAIGN_PROGRESSION_REGISTRY.upgradeDefinitions().map((upgrade) => ({
      ...upgrade,
      discovered: this.profile().progression.discoveredUpgradeIds.includes(upgrade.id),
      permanent: this.profile().progression.permanentUpgradeIds.includes(upgrade.id),
      purchased: this.profile().progression.purchasedUpgradeIds.includes(upgrade.id)
    }))
  );
  protected readonly loadouts = computed(() => Object.values(this.profile().progression.loadouts));
  protected readonly mastery = computed(() => {
    const mission = this.selectedMission();
    return mission ? this.profile().missionMastery[mission.id] : undefined;
  });
  protected readonly archiveDialogueLines = computed(() => {
    const mission = this.selectedMission();
    return mission ? AOTA_CAMPAIGN_CONTENT_REGISTRY.getDialogue(mission.id).lines : [];
  });
  protected readonly developerOverride = computed(() => {
    const mission = this.selectedMission();
    if (!mission || environment.production) return false;
    const completed = new Set(
      this.campaignProfileService.profileData().completedMissions.map((completion) => completion.missionId)
    );
    return (
      mission.availability !== "playable" || mission.prerequisites.some((prerequisite) => !completed.has(prerequisite))
    );
  });
  protected readonly effectiveLoadout = computed(() => {
    const mission = this.selectedMission();
    if (!mission) return undefined;
    return resolveCampaignEffectiveProgression(
      {
        profile: this.profile().progression,
        selectedLoadoutIds: this.profile().activeLoadoutIds,
        allowance: AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(mission.id).progressionAllowance
      },
      AOTA_CAMPAIGN_PROGRESSION_REGISTRY
    );
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
      await this.campaignLaunchService.startMission(mission, this.difficulty());
    } catch (error) {
      console.error("Unable to start campaign mission", error);
      this.launchError.set("The mission could not be started. Please try again.");
    } finally {
      this.launchInProgress.set(false);
    }
  }

  protected selectDifficulty(difficulty: CampaignDifficulty): void {
    this.difficulty.set(difficulty);
  }

  protected async toggleLoadout(loadoutId: string): Promise<void> {
    const selected = new Set(this.profile().activeLoadoutIds);
    if (selected.has(loadoutId)) selected.delete(loadoutId);
    else selected.add(loadoutId);
    await this.campaignProfileService.selectActiveLoadouts([...selected]);
  }

  protected async createPrimaryLoadout(): Promise<void> {
    const progression = this.profile().progression;
    const saved = await this.campaignProfileService.saveLoadout({
      id: "primary",
      name: "Primary",
      upgradeIds: [...new Set([...progression.permanentUpgradeIds, ...progression.purchasedUpgradeIds])],
      unlockIds: [...progression.unlockIds],
      inventoryItemIds: progression.inventory.map((item) => item.id)
    });
    if (saved) await this.campaignProfileService.selectActiveLoadouts(["primary"]);
  }

  protected async freeRespec(): Promise<void> {
    await this.campaignProfileService.respec([]);
  }

  protected async toggleUpgrade(upgradeId: string): Promise<void> {
    const purchased = new Set(this.profile().progression.purchasedUpgradeIds);
    if (purchased.has(upgradeId)) purchased.delete(upgradeId);
    else purchased.add(upgradeId);
    await this.campaignProfileService.respec([...purchased]);
  }

  protected async continueMission(): Promise<void> {
    const mission = this.selectedMission();
    if (!mission) return;
    const save = await this.gameSaveService.continueCampaignMission(mission.id);
    if (!save) return;
    this.launchInProgress.set(true);
    this.launchError.set(undefined);
    try {
      await this.gameInstanceClientService.loadSavedGameData(save.gameInstanceData, save.campaign);
    } catch (error) {
      console.error("Unable to continue campaign mission", error);
      this.launchError.set("The save could not be loaded. Choose another save or start the mission again.");
    } finally {
      this.launchInProgress.set(false);
    }
  }
}
