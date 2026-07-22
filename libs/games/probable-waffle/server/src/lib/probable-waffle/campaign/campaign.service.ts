import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import type { Json } from "@fuzzy-waddle/platform-database-schema";
import {
  type CampaignMissionId,
  type CampaignProfile,
  type CampaignProfileData,
  type CampaignRewardCommitResult,
  type CampaignVictoryCommitResponse,
  type MissionRunIntegrityState
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_CATALOG,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  applyCampaignMissionMastery,
  campaignLoadoutSnapshotHash,
  CampaignRewardCommitService,
  createInitialCampaignProfile,
  isCampaignProfile,
  mergeCampaignProfileData,
  respecCampaignProgression,
  saveCampaignLoadout
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignResultDto, StartCampaignRunDto } from "./campaign.dto";
import type { CampaignProfileServerServiceInterface } from "./campaign.service.interface";

@Injectable()
/** Persists authenticated campaign runs and idempotent mission completion progress. */
export class CampaignServerService implements CampaignProfileServerServiceInterface {
  private readonly rewardCommitter = new CampaignRewardCommitService(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);

  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async profile(userId: string): Promise<CampaignProfileData> {
    const client = this.supabaseProviderService.supabaseClient;
    const { data: completionRows, error: progressError } = await client
      .from("probable_waffle_campaign_progress")
      .select("mission_id, completed_at, result_metadata")
      .eq("user_id", userId);
    if (progressError) throw progressError;
    const completedMissions = (completionRows ?? []).map((row) => ({
      missionId: row.mission_id,
      completedAt: row.completed_at
    }));
    const { data: row, error } = await client
      .from("probable_waffle_campaign_profiles")
      .select("profile_document")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    let storedProfile: CampaignProfile | undefined;
    if (row) {
      if (!isCampaignProfile(row.profile_document)) {
        throw new ConflictException("Campaign profile migration failed; the original profile was preserved");
      }
      storedProfile = row.profile_document;
    }
    const initial = storedProfile ?? createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const profile = addLegacyMastery(initial, completionRows ?? []);
    if (!row) {
      const { error: createError } = await client.from("probable_waffle_campaign_profiles").upsert(
        {
          user_id: userId,
          schema_version: profile.schemaVersion,
          revision: profile.progression.revision,
          profile_document: profile as unknown as Json,
          active_loadout_ids: [...profile.activeLoadoutIds],
          seen_cinematic_ids: [...profile.seenCinematicIds]
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
      if (createError) throw createError;
    } else if (profile !== initial) {
      const { error: migrationError } = await client
        .from("probable_waffle_campaign_profiles")
        .update({ profile_document: profile as unknown as Json })
        .eq("user_id", userId)
        .eq("revision", profile.progression.revision);
      if (migrationError) throw migrationError;
    }
    return { profile, completedMissions };
  }

  async updateProfile(
    userId: string,
    baseProfileRevision: number,
    profile: CampaignProfile
  ): Promise<CampaignProfileData> {
    if (!isCampaignProfile(profile) || profile.progression.revision !== baseProfileRevision + 1) {
      throw new ConflictException("Campaign profile revision is invalid");
    }
    const current = (await this.profile(userId)).profile;
    if (current.progression.revision !== baseProfileRevision) {
      throw new ConflictException("Campaign profile changed on another device");
    }
    const respec = respecCampaignProgression(
      current.progression,
      profile.progression.purchasedUpgradeIds,
      AOTA_CAMPAIGN_PROGRESSION_REGISTRY
    );
    if (!respec.accepted) throw new ConflictException(respec.reason ?? "Campaign respec is invalid");
    for (const loadout of Object.values(profile.progression.loadouts)) {
      const validation = saveCampaignLoadout(respec.profile, loadout);
      if (!validation.accepted) throw new ConflictException(validation.reason ?? "Campaign loadout is invalid");
    }
    const expectedProgression = { ...respec.profile, loadouts: profile.progression.loadouts };
    if (
      canonicalJson(expectedProgression) !== canonicalJson(profile.progression) ||
      profile.activeLoadoutIds.some((id) => !profile.progression.loadouts[id]) ||
      canonicalJson(profile.activeLoadoutIds) !== canonicalJson([...new Set(profile.activeLoadoutIds)].sort()) ||
      canonicalJson(profile.seenCinematicIds) !== canonicalJson(current.seenCinematicIds) ||
      canonicalJson(profile.committedRunIds) !== canonicalJson(current.committedRunIds) ||
      canonicalJson(profile.missionMastery) !== canonicalJson(current.missionMastery)
    ) {
      throw new ConflictException("Campaign profile update contains server-owned changes");
    }
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("probable_waffle_campaign_profiles")
      .update({
        schema_version: profile.schemaVersion,
        revision: profile.progression.revision,
        profile_document: profile as unknown as Json,
        active_loadout_ids: [...profile.activeLoadoutIds],
        seen_cinematic_ids: [...profile.seenCinematicIds],
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("revision", baseProfileRevision)
      .select("user_id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ConflictException("Campaign profile changed on another device");
    return this.profile(userId);
  }

  async start(userId: string, request: StartCampaignRunDto): Promise<void> {
    const profile = await this.profile(userId);
    if (profile.profile.progression.revision !== request.baseProfileRevision) {
      throw new ConflictException("Campaign run profile revision is stale");
    }
    const mission = AOTA_CAMPAIGN_CATALOG.chapters
      .flatMap((chapter) => chapter.missions)
      .find((candidate) => candidate.id === request.missionId);
    if (!mission) throw new NotFoundException("Campaign mission was not found");
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(request.missionId);
    if (content.revision !== request.missionRevision) {
      throw new ConflictException("Campaign mission revision is stale");
    }
    if (
      request.loadoutSnapshotHash !==
        campaignLoadoutSnapshotHash(request.baseProfileRevision, request.selectedLoadoutIds) ||
      request.selectedLoadoutIds.some((id) => !profile.profile.activeLoadoutIds.includes(id))
    ) {
      throw new ConflictException("Campaign loadout snapshot identity is invalid");
    }
    const completed = new Set(profile.completedMissions.map((completion) => completion.missionId));
    const requiresDeveloperOverride =
      mission.availability !== "playable" ||
      mission.prerequisites.some((prerequisite) => !completed.has(prerequisite));
    if (requiresDeveloperOverride && !request.developerOverride) {
      throw new ConflictException("Campaign mission is locked or planned");
    }
    const { data: existing, error: readError } = await this.supabaseProviderService.supabaseClient
      .from("probable_waffle_campaign_runs")
      .select("user_id, mission_id")
      .eq("id", request.runId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing && (existing.user_id !== userId || existing.mission_id !== request.missionId)) {
      throw new ConflictException("Campaign run ID belongs to another run");
    }
    const { error } = await this.supabaseProviderService.supabaseClient
      .from("probable_waffle_campaign_runs")
      .upsert(
        {
          id: request.runId,
          user_id: userId,
          mission_id: request.missionId,
          mission_revision: request.missionRevision,
          difficulty: request.difficulty,
          base_profile_revision: request.baseProfileRevision,
          selected_loadout_ids: [...request.selectedLoadoutIds],
          loadout_snapshot_hash: request.loadoutSnapshotHash,
          integrity: request.developerOverride
            ? { eligibleForRewards: false, invalidationReasons: ["developer-content-override"] }
            : { eligibleForRewards: true, invalidationReasons: [] }
        },
        { onConflict: "id" }
      );
    if (error) throw error;
  }

  /** Result writes are owner-scoped and idempotent; only victories add completion progress. */
  async result(userId: string, request: CampaignResultDto): Promise<CampaignVictoryCommitResponse> {
    const client = this.supabaseProviderService.supabaseClient;
    const { data: run, error: readError } = await client
      .from("probable_waffle_campaign_runs")
      .select("id, mission_id, mission_revision, base_profile_revision, outcome, integrity, commit_status, commit_result")
      .eq("id", request.runId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    if (!run || run.mission_id !== request.missionId) throw new NotFoundException("Campaign run was not found");
    if (run.mission_revision !== request.missionRevision || run.base_profile_revision !== request.baseProfileRevision) {
      throw new ConflictException("Campaign run identity does not match its launch snapshot");
    }
    if (run.commit_status === "committed" && isRewardCommitResult(run.commit_result)) {
      return { result: { ...run.commit_result, status: "already-committed" }, profileData: await this.profile(userId) };
    }
    const current = await this.profile(userId);
    const runIntegrity = missionRunIntegrity(run.integrity);
    const commitRequest: CampaignResultDto = runIntegrity.eligibleForRewards
      ? request
      : {
          ...request,
          integrity: {
            eligibleForRewards: false,
            invalidationReasons: [
              ...new Set([...request.integrity.invalidationReasons, ...runIntegrity.invalidationReasons])
            ].sort()
          }
        };
    const result = this.rewardCommitter.commit(
      userId,
      current.profile.progression,
      commitRequest,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getRewards(request.missionId)
    );
    if (result.status === "rejected") {
      const seenCinematicIds = [
        ...new Set([...current.profile.seenCinematicIds, ...(request.seenCinematicIds ?? [])])
      ].sort();
      if (JSON.stringify(seenCinematicIds) !== JSON.stringify(current.profile.seenCinematicIds)) {
        const profile = { ...current.profile, seenCinematicIds };
        const { error: profileError } = await client
          .from("probable_waffle_campaign_profiles")
          .update({
            profile_document: profile as unknown as Json,
            seen_cinematic_ids: seenCinematicIds,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .eq("revision", current.profile.progression.revision);
        if (profileError) throw profileError;
      }
      const { error } = await client
        .from("probable_waffle_campaign_runs")
        .update({
          outcome: request.outcome,
          completed_at: new Date().toISOString(),
          commit_status: "rejected",
          commit_result: result as unknown as Json,
          result_metadata: campaignResultMetadata(request)
        })
        .eq("id", request.runId)
        .eq("user_id", userId);
      if (error) throw error;
      return { result, profileData: await this.profile(userId) };
    }
    const completedAt = new Date().toISOString();
    let profile = { ...current.profile, progression: result.profile };
    profile = {
      ...profile,
      seenCinematicIds: [...new Set([...profile.seenCinematicIds, ...(request.seenCinematicIds ?? [])])].sort()
    };
    profile = applyCampaignMissionMastery(profile, commitRequest, completedAt, request.durationSeconds);
    profile = { ...profile, committedRunIds: [...new Set([...profile.committedRunIds, request.runId])].sort() };
    const newClaimIds = profile.progression.rewardClaimIds.filter(
      (claimId) => !current.profile.progression.rewardClaimIds.includes(claimId)
    );
    const commitResult: CampaignRewardCommitResult = { ...result, profile: profile.progression };
    const { error: commitError } = await client.rpc("commit_probable_waffle_campaign_victory", {
      p_user_id: userId,
      p_run_id: request.runId,
      p_mission_id: request.missionId,
      p_base_profile_revision: request.baseProfileRevision,
      p_profile_document: profile as unknown as Json,
      p_reward_claims: newClaimIds.map((claimId) => ({
        claimId,
        missionId: request.missionId,
        committedDelta: progressionDelta(current.profile, profile, result.appliedRewardIds)
      })) as unknown as Json,
      p_progress_metadata: masteryMetadata(profile, request.missionId),
      p_result_metadata: campaignResultMetadata(request),
      p_commit_result: commitResult as unknown as Json
    });
    if (commitError) throw commitError;
    return { result: commitResult, profileData: await this.profile(userId) };
  }

  async merge(
    userId: string,
    guestProfile: CampaignProfile,
    completions: Array<{ missionId: CampaignMissionId; completedAt: string }>
  ): Promise<CampaignProfileData> {
    if (!isCampaignProfile(guestProfile)) throw new ConflictException("Guest campaign profile is not supported");
    const current = await this.profile(userId);
    const merged = mergeCampaignProfileData(current, { profile: guestProfile, completedMissions: completions });
    const profileChanged = JSON.stringify(merged.profile) !== JSON.stringify(current.profile);
    if (profileChanged) {
      const progressionChanged =
        JSON.stringify(merged.profile.progression) !== JSON.stringify(current.profile.progression);
      if (progressionChanged) {
        const profile = {
          ...merged.profile,
          progression: { ...merged.profile.progression, revision: current.profile.progression.revision + 1 }
        };
        const { data, error } = await this.supabaseProviderService.supabaseClient
          .from("probable_waffle_campaign_profiles")
          .update({
            revision: profile.progression.revision,
            profile_document: profile as unknown as Json,
            active_loadout_ids: [...profile.activeLoadoutIds],
            seen_cinematic_ids: [...profile.seenCinematicIds],
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .eq("revision", current.profile.progression.revision)
          .select("user_id")
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new ConflictException("Campaign profile changed during merge");
      } else {
        const { error } = await this.supabaseProviderService.supabaseClient
          .from("probable_waffle_campaign_profiles")
          .update({
            profile_document: merged.profile as unknown as Json,
            active_loadout_ids: [...merged.profile.activeLoadoutIds],
            seen_cinematic_ids: [...merged.profile.seenCinematicIds],
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .eq("revision", current.profile.progression.revision);
        if (error) throw error;
      }
    }
    const progress = clientTable(this.supabaseProviderService, "probable_waffle_campaign_progress");
    for (const completion of merged.completedMissions) {
      const { data: existing, error: readError } = await progress
        .select("completed_at")
        .eq("user_id", userId)
        .eq("mission_id", completion.missionId)
        .maybeSingle();
      if (readError) throw readError;
      const completedAt =
        existing?.completed_at && existing.completed_at < completion.completedAt
          ? existing.completed_at
          : completion.completedAt;
      const { error } = await progress.upsert(
        { user_id: userId, mission_id: completion.missionId, completed_at: completedAt },
        { onConflict: "user_id,mission_id" }
      );
      if (error) throw error;
    }
    return this.profile(userId);
  }
}

function addLegacyMastery(
  profile: CampaignProfile,
  rows: readonly Array<{ mission_id: CampaignMissionId; completed_at: string; result_metadata: Json }>
): CampaignProfile {
  let result = profile;
  for (const row of rows) {
    if (result.missionMastery[row.mission_id]) continue;
    const metadata = jsonObject(row.result_metadata);
    result = {
      ...result,
      missionMastery: {
        ...result.missionMastery,
        [row.mission_id]: {
          firstCompletedAt: row.completed_at,
          completionCount: 1,
          bestDifficulty: difficultyValue(metadata?.["difficulty"]),
          ...(typeof metadata?.["durationSeconds"] === "number"
            ? { bestDurationSeconds: metadata["durationSeconds"] }
            : {}),
          completedObjectiveIds: stringArray(metadata?.["completedObjectiveIds"])
        }
      }
    };
  }
  return result;
}

function campaignResultMetadata(request: CampaignResultDto): Json {
  return {
    missionRevision: request.missionRevision,
    baseProfileRevision: request.baseProfileRevision,
    difficulty: request.difficulty,
    durationSeconds: request.durationSeconds ?? null,
    completedObjectiveIds: [...request.completedObjectiveIds].sort(),
    seenCinematicIds: [...(request.seenCinematicIds ?? [])].sort(),
    discoveredRewardIds: [...request.discoveredRewardIds].sort(),
    replayPlayback: request.replayPlayback,
    integrity: request.integrity
  };
}

function masteryMetadata(profile: CampaignProfile, missionId: CampaignMissionId): Json {
  return (profile.missionMastery[missionId] ?? {}) as unknown as Json;
}

function progressionDelta(
  before: CampaignProfile,
  after: CampaignProfile,
  appliedRewardIds: readonly string[]
): Json {
  return {
    beforeRevision: before.progression.revision,
    afterRevision: after.progression.revision,
    walletBefore: before.progression.wallet.balances,
    walletAfter: after.progression.wallet.balances,
    appliedRewardIds: [...appliedRewardIds].sort()
  };
}

function isRewardCommitResult(value: Json | null): value is CampaignRewardCommitResult & Json {
  const object = jsonObject(value);
  return Boolean(
    object &&
      typeof object["runId"] === "string" &&
      ["committed", "already-committed", "rejected"].includes(String(object["status"])) &&
      object["profile"]
  );
}

function jsonObject(value: Json | null | undefined): { [key: string]: Json | undefined } | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as { [key: string]: Json | undefined })
    : undefined;
}

function stringArray(value: Json | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string").sort() : [];
}

function difficultyValue(value: Json | undefined): "story" | "normal" | "hard" {
  return value === "story" || value === "hard" ? value : "normal";
}

function missionRunIntegrity(value: Json): MissionRunIntegrityState {
  const object = jsonObject(value);
  return {
    eligibleForRewards: object?.["eligibleForRewards"] === true,
    invalidationReasons: stringArray(object?.["invalidationReasons"])
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function clientTable(
  provider: SupabaseProviderService,
  table: "probable_waffle_campaign_progress"
) {
  return provider.supabaseClient.from(table);
}
