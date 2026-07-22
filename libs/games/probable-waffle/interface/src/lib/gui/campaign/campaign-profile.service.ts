import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import {
  CampaignMissionOutcome,
  CampaignProfileSyncState,
  type CampaignDifficulty,
  type CampaignLoadout,
  type CampaignMissionId,
  type CampaignProfile,
  type CampaignProfileData,
  type CampaignProfileMergeRequest,
  type CampaignProfileUpdateRequest,
  type CampaignProgressData,
  type CampaignProgressionUpgradeId,
  type CampaignRewardCommitResult,
  type CampaignRunStartRequest,
  type CampaignVictoryCommitRequest,
  type CampaignVictoryCommitResponse
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  applyCampaignMissionMastery,
  campaignLoadoutSnapshotHash,
  CampaignRewardCommitService,
  createInitialCampaignProfile,
  isCampaignProfile,
  mergeCampaignProfileData,
  profileDataFromLegacyCompletions,
  respecCampaignProgression,
  saveCampaignLoadout
} from "@fuzzy-waddle/probable-waffle-campaign";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { environment } from "@fuzzy-waddle/environments/environment";
import { CampaignProfileServiceInterface } from "./campaign-profile.service.interface";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";

const GUEST_PROFILE_KEY = "aota-campaign-profile-v1";
const LEGACY_PROGRESS_KEY = "aota-campaign-progress-v1";

@Injectable({ providedIn: "root" })
/** Owns the versioned campaign profile and reconciles guest state with the authenticated account. */
export class CampaignProfileService implements CampaignProfileServiceInterface {
  private readonly authService = inject(AuthService);
  private readonly httpClient = inject(HttpClient);
  private readonly rewardCommitter = new CampaignRewardCommitService(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
  private readonly data = signal<CampaignProfileData>(this.readGuestProfile());
  private readonly loadedState = signal(false);
  private readonly errorState = signal<string | undefined>(undefined);
  private readonly syncStateValue = signal<CampaignProfileSyncState>(CampaignProfileSyncState.Guest);
  private readonly lastCommitResultValue = signal<CampaignRewardCommitResult | undefined>(undefined);

  readonly loaded = this.loadedState.asReadonly();
  readonly profileData = this.data.asReadonly();
  readonly profile = computed(() => this.data().profile);
  readonly error = this.errorState.asReadonly();
  readonly syncState = this.syncStateValue.asReadonly();
  readonly lastCommitResult = this.lastCommitResultValue.asReadonly();

  async load(): Promise<void> {
    if (this.loadedState() && this.syncStateValue() !== CampaignProfileSyncState.Error) return;
    const guest = this.readGuestProfile();
    if (!this.authService.isAuthenticated) {
      this.data.set(guest);
      this.loadedState.set(true);
      this.syncStateValue.set(CampaignProfileSyncState.Guest);
      return;
    }
    this.syncStateValue.set(CampaignProfileSyncState.Loading);
    try {
      const remote = await firstValueFrom(
        this.httpClient.get<CampaignProfileData>(`${environment.api}api/probable-waffle/campaign/profile`)
      );
      const merged = mergeCampaignProfileData(guest, remote);
      this.data.set(merged);
      this.writeGuestProfile(merged);
      const reconciled = await firstValueFrom(
        this.httpClient.post<CampaignProfileData>(`${environment.api}api/probable-waffle/campaign/merge`, {
          profile: guest.profile,
          completedMissions: guest.completedMissions
        } satisfies CampaignProfileMergeRequest)
      );
      this.data.set(reconciled);
      this.writeGuestProfile(reconciled);
      this.errorState.set(undefined);
      this.syncStateValue.set(CampaignProfileSyncState.Synced);
    } catch {
      this.errorState.set(
        "Campaign profile could not be synchronized. Reconnect before starting a reward-bearing run."
      );
      this.syncStateValue.set(CampaignProfileSyncState.Error);
    } finally {
      this.loadedState.set(true);
    }
  }

  async startRun(
    missionId: CampaignMissionId,
    difficulty: CampaignDifficulty = "normal"
  ): Promise<CampaignRunStartRequest> {
    await this.load();
    if (this.authService.isAuthenticated && this.errorState()) throw new Error(this.errorState());
    const profile = this.profile();
    const selectedLoadoutIds = [...profile.activeLoadoutIds].sort();
    const mission = AOTA_CAMPAIGN_CATALOG.chapters
      .flatMap((chapter) => chapter.missions)
      .find((candidate) => candidate.id === missionId);
    if (!mission) throw new Error(`Campaign mission ${missionId} is not in the catalogue`);
    const completed = new Set(this.data().completedMissions.map((completion) => completion.missionId));
    const requiresDeveloperOverride =
      mission.availability !== "playable" || mission.prerequisites.some((prerequisite) => !completed.has(prerequisite));
    if (environment.production && requiresDeveloperOverride) {
      throw new Error(`Campaign mission ${missionId} is locked or planned`);
    }
    const request: CampaignRunStartRequest = {
      runId: crypto.randomUUID(),
      missionId,
      missionRevision: AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(missionId).revision,
      difficulty,
      baseProfileRevision: profile.progression.revision,
      selectedLoadoutIds,
      loadoutSnapshotHash: campaignLoadoutSnapshotHash(profile.progression.revision, selectedLoadoutIds),
      developerOverride: !environment.production && requiresDeveloperOverride
    };
    if (this.authService.isAuthenticated) {
      await firstValueFrom(this.httpClient.post(`${environment.api}api/probable-waffle/campaign/runs`, request));
    }
    return request;
  }

  async commitVictory(request: CampaignVictoryCommitRequest): Promise<CampaignRewardCommitResult | undefined> {
    await this.load();
    if (request.replayPlayback) {
      const result: CampaignRewardCommitResult = {
        runId: request.runId,
        status: "rejected",
        profile: this.profile().progression,
        appliedRewardIds: [],
        skippedRewardIds: [...request.discoveredRewardIds].sort(),
        warnings: [],
        rejectionReason: "Replay playback cannot commit rewards"
      };
      this.lastCommitResultValue.set(result);
      return result;
    }
    if (this.authService.isAuthenticated) {
      this.syncStateValue.set(CampaignProfileSyncState.Pending);
      try {
        const response = await firstValueFrom(
          this.httpClient.post<CampaignVictoryCommitResponse>(
            `${environment.api}api/probable-waffle/campaign/results`,
            sortedCommitRequest(request)
          )
        );
        this.data.set(response.profileData);
        this.writeGuestProfile(response.profileData);
        this.errorState.set(undefined);
        this.syncStateValue.set(CampaignProfileSyncState.Synced);
        this.lastCommitResultValue.set(response.result);
        return response.result;
      } catch {
        this.errorState.set("Campaign rewards are pending synchronization. Retrying this run is safe.");
        this.syncStateValue.set(CampaignProfileSyncState.Error);
        return undefined;
      }
    }
    const current = this.data();
    if (current.profile.committedRunIds.includes(request.runId)) {
      const result: CampaignRewardCommitResult = {
        runId: request.runId,
        status: "already-committed",
        profile: current.profile.progression,
        appliedRewardIds: [],
        skippedRewardIds: [],
        warnings: []
      };
      this.lastCommitResultValue.set(result);
      return result;
    }
    const result = this.rewardCommitter.commit(
      "guest",
      current.profile.progression,
      request,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getRewards(request.missionId)
    );
    let profile: CampaignProfile = {
      ...current.profile,
      progression: result.profile,
      seenCinematicIds: [...new Set([...current.profile.seenCinematicIds, ...(request.seenCinematicIds ?? [])])].sort()
    };
    if (result.status === "committed") {
      profile = applyCampaignMissionMastery(profile, request, new Date().toISOString());
      profile = { ...profile, committedRunIds: [...profile.committedRunIds, request.runId].sort() };
    }
    const completedMissions =
      request.outcome === CampaignMissionOutcome.Victory
        ? mergeCampaignProfileData(current, {
            profile,
            completedMissions: [{ missionId: request.missionId, completedAt: new Date().toISOString() }]
          }).completedMissions
        : current.completedMissions;
    const next = { profile, completedMissions };
    this.data.set(next);
    this.writeGuestProfile(next);
    this.lastCommitResultValue.set(result);
    return result;
  }

  async selectActiveLoadouts(loadoutIds: readonly string[]): Promise<void> {
    const current = this.data();
    const selected = [...new Set(loadoutIds)]
      .filter((id) => current.profile.progression.loadouts[id] !== undefined)
      .sort();
    const next: CampaignProfileData = {
      ...current,
      profile: {
        ...current.profile,
        activeLoadoutIds: selected,
        progression: { ...current.profile.progression, revision: current.profile.progression.revision + 1 }
      }
    };
    await this.persistProfile(current.profile.progression.revision, next);
  }

  async saveLoadout(loadout: CampaignLoadout): Promise<boolean> {
    const current = this.data();
    const result = saveCampaignLoadout(current.profile.progression, loadout);
    if (!result.accepted) {
      this.errorState.set(result.reason);
      return false;
    }
    return this.persistProfile(current.profile.progression.revision, {
      ...current,
      profile: { ...current.profile, progression: result.profile }
    });
  }

  async respec(upgradeIds: readonly CampaignProgressionUpgradeId[]): Promise<boolean> {
    const current = this.data();
    const result = respecCampaignProgression(
      current.profile.progression,
      upgradeIds,
      AOTA_CAMPAIGN_PROGRESSION_REGISTRY
    );
    if (!result.accepted) {
      this.errorState.set(result.reason);
      return false;
    }
    return this.persistProfile(current.profile.progression.revision, {
      ...current,
      profile: { ...current.profile, progression: result.profile }
    });
  }

  async markCinematicSeen(cinematicId: string): Promise<void> {
    const current = this.data();
    if (current.profile.seenCinematicIds.includes(cinematicId)) return;
    const next = {
      ...current,
      profile: {
        ...current.profile,
        seenCinematicIds: [...current.profile.seenCinematicIds, cinematicId].sort()
      }
    };
    this.data.set(next);
    this.writeGuestProfile(next);
    if (this.authService.isAuthenticated) {
      const profileData = await firstValueFrom(
        this.httpClient.post<CampaignProfileData>(`${environment.api}api/probable-waffle/campaign/merge`, {
          profile: next.profile,
          completedMissions: next.completedMissions
        } satisfies CampaignProfileMergeRequest)
      );
      this.data.set(profileData);
      this.writeGuestProfile(profileData);
    }
  }

  private async persistProfile(baseProfileRevision: number, next: CampaignProfileData): Promise<boolean> {
    if (this.authService.isAuthenticated) {
      this.syncStateValue.set(CampaignProfileSyncState.Pending);
      try {
        const profileData = await firstValueFrom(
          this.httpClient.put<CampaignProfileData>(`${environment.api}api/probable-waffle/campaign/profile`, {
            baseProfileRevision,
            profile: next.profile
          } satisfies CampaignProfileUpdateRequest)
        );
        this.data.set(profileData);
        this.writeGuestProfile(profileData);
        this.errorState.set(undefined);
        this.syncStateValue.set(CampaignProfileSyncState.Synced);
        return true;
      } catch {
        this.errorState.set("Campaign profile changed on another device. Reload before editing loadouts.");
        this.syncStateValue.set(CampaignProfileSyncState.Error);
        return false;
      }
    }
    this.data.set(next);
    this.writeGuestProfile(next);
    return true;
  }

  private readGuestProfile(): CampaignProfileData {
    try {
      const stored = JSON.parse(
        localStorage.getItem(GUEST_PROFILE_KEY) ?? "null"
      ) as Partial<CampaignProfileData> | null;
      if (stored && isCampaignProfile(stored.profile) && Array.isArray(stored.completedMissions)) {
        return { profile: stored.profile, completedMissions: stored.completedMissions };
      }
      const legacy = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY) ?? "null") as CampaignProgressData | null;
      return profileDataFromLegacyCompletions(legacy?.completedMissions ?? [], AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    } catch {
      return { profile: createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY), completedMissions: [] };
    }
  }

  private writeGuestProfile(data: CampaignProfileData): void {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(data));
  }
}

function sortedCommitRequest(request: CampaignVictoryCommitRequest): CampaignVictoryCommitRequest {
  return {
    ...request,
    completedObjectiveIds: [...request.completedObjectiveIds].sort(),
    seenCinematicIds: [...(request.seenCinematicIds ?? [])].sort(),
    discoveredRewardIds: [...request.discoveredRewardIds].sort(),
    integrity: { ...request.integrity, invalidationReasons: [...request.integrity.invalidationReasons].sort() }
  };
}
