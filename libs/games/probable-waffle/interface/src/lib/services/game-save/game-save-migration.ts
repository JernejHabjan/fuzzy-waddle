import {
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
  GAME_SAVE_FORMAT_VERSION,
  GameSaveScope,
  type CampaignGameSaveContext,
  type CampaignMissionRuntimeState,
  type EncodedGameSaveRecord,
  type GameSaveRecord,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  type UnsupportedGameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  migrateCampaignMissionRevision
} from "@fuzzy-waddle/probable-waffle-campaign";

export type GameSaveMigrationResult =
  | { readonly status: "supported"; readonly record: GameSaveRecord; readonly migrated: boolean }
  | { readonly status: "unsupported"; readonly record: UnsupportedGameSaveRecord };

/** Explicitly migrates known save/runtime versions and never guesses mission-content renames. */
export function migrateGameSaveRecord(
  stored: EncodedGameSaveRecord,
  gameInstanceData: ProbableWaffleGameInstanceData
): GameSaveMigrationResult {
  if (stored.formatVersion !== 1 && stored.formatVersion !== 2 && stored.formatVersion !== GAME_SAVE_FORMAT_VERSION) {
    return unsupportedGameSaveRecord(stored, `Save format ${stored.formatVersion} is not supported`);
  }
  const migratedData = structuredClone(gameInstanceData);
  let campaignMission = migrateCampaignRuntime(migratedData.gameStateData?.campaignMission);
  if (migratedData.gameStateData?.campaignMission && !campaignMission) {
    return unsupportedGameSaveRecord(
      stored,
      `Campaign runtime schema ${migratedData.gameStateData.campaignMission.schemaVersion} is not supported`
    );
  }
  if (campaignMission && migratedData.gameStateData) migratedData.gameStateData.campaignMission = campaignMission;
  if (!migratedData.gameStateData?.randomState) {
    const safeInitialCampaign =
      campaignMission && !campaignMission.initialized && campaignMission.integrity.lastProcessedTick === 0;
    const safeInitialSkirmishOrReplay =
      !campaignMission &&
      (migratedData.gameInstanceMetadataData?.type === ProbableWaffleGameInstanceType.Replay ||
        (migratedData.gameStateData?.actors?.length ?? 0) === 0);
    if (!safeInitialCampaign && !safeInitialSkirmishOrReplay) {
      return unsupportedGameSaveRecord(stored, "Save is missing deterministic random continuation state");
    }
  }
  let campaign = resolveCampaignContext(stored, migratedData, campaignMission);
  if (stored.scope === GameSaveScope.Campaign && !campaign) {
    return unsupportedGameSaveRecord(stored, "Campaign identity or runtime metadata is incomplete");
  }
  if (
    campaignMission &&
    campaign &&
    (campaignMission.campaignId !== campaign.campaignId ||
      campaignMission.missionId !== campaign.missionId ||
      campaignMission.missionRevision !== campaign.missionRevision)
  ) {
    return unsupportedGameSaveRecord(stored, "Campaign save metadata does not match its runtime state");
  }
  if (campaignMission && campaign) {
    let content;
    try {
      content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(campaign.missionId);
    } catch {
      return unsupportedGameSaveRecord(stored, `Campaign mission '${campaign.missionId}' is no longer available`);
    }
    if (campaignMission.missionRevision !== content.revision) {
      campaignMission = migrateCampaignMissionRevision(
        campaignMission,
        content.revision,
        content.revisionMigrations ?? []
      );
      if (!campaignMission) {
        return unsupportedGameSaveRecord(
          stored,
          `Mission revision ${campaign.missionRevision} cannot be migrated to ${content.revision}`
        );
      }
      if (migratedData.gameStateData) migratedData.gameStateData.campaignMission = campaignMission;
      campaign = { ...campaign, missionRevision: content.revision };
      if (migratedData.gameInstanceMetadataData?.campaignContext) {
        migratedData.gameInstanceMetadataData.campaignContext.missionRevision = content.revision;
      }
    }
  }
  const { encodedGameInstanceData: _encodedGameInstanceData, ...metadata } = stored;
  return {
    status: "supported",
    migrated:
      stored.formatVersion !== GAME_SAVE_FORMAT_VERSION ||
      gameInstanceData.gameStateData?.campaignMission?.schemaVersion !== campaignMission?.schemaVersion ||
      gameInstanceData.gameStateData?.campaignMission?.missionRevision !== campaignMission?.missionRevision ||
      campaignMetadataChanged(stored.campaign, campaign),
    record: {
      ...metadata,
      formatVersion: GAME_SAVE_FORMAT_VERSION,
      ...(campaign ? { campaign } : { campaign: undefined }),
      gameInstanceData: migratedData
    }
  };
}

function campaignMetadataChanged(
  stored: EncodedGameSaveRecord["campaign"],
  migrated: CampaignGameSaveContext | undefined
): boolean {
  if (!stored || !migrated) return stored !== migrated;
  return (
    stored.campaignId !== migrated.campaignId ||
    stored.chapterId !== migrated.chapterId ||
    stored.missionId !== migrated.missionId ||
    stored.runId !== migrated.runId ||
    stored.missionRevision !== migrated.missionRevision ||
    stored.runtimeSchemaVersion !== migrated.runtimeSchemaVersion ||
    stored.profileRevision !== migrated.profileRevision ||
    JSON.stringify(stored.selectedLoadoutIds ?? []) !== JSON.stringify(migrated.selectedLoadoutIds ?? []) ||
    stored.loadoutSnapshotHash !== migrated.loadoutSnapshotHash ||
    stored.checkpointId !== migrated.checkpointId ||
    stored.participantCount !== migrated.participantCount
  );
}

function resolveCampaignContext(
  stored: EncodedGameSaveRecord,
  data: ProbableWaffleGameInstanceData,
  runtime: CampaignMissionRuntimeState | undefined
): CampaignGameSaveContext | undefined {
  if (stored.scope !== GameSaveScope.Campaign) return undefined;
  const metadata = data.gameInstanceMetadataData?.campaignContext;
  const campaignId = stored.campaign?.campaignId ?? metadata?.campaignId ?? runtime?.campaignId;
  const chapterId = stored.campaign?.chapterId ?? metadata?.chapterId;
  const missionId = stored.campaign?.missionId ?? metadata?.missionId ?? runtime?.missionId;
  const runId = stored.campaign?.runId ?? metadata?.runId;
  const missionRevision = stored.campaign?.missionRevision ?? metadata?.missionRevision ?? runtime?.missionRevision;
  if (!campaignId || !chapterId || !missionId || !runId || !missionRevision || !runtime) return undefined;
  return {
    campaignId,
    chapterId,
    missionId,
    runId,
    missionRevision,
    runtimeSchemaVersion: runtime.schemaVersion,
    profileRevision:
      stored.campaign?.profileRevision ?? runtime.progression?.baseProfileRevision ?? metadata?.progressionSnapshot?.baseProfileRevision ?? 0,
    selectedLoadoutIds: [...(stored.campaign?.selectedLoadoutIds ?? metadata?.selectedLoadoutIds ?? [])].sort(),
    loadoutSnapshotHash: stored.campaign?.loadoutSnapshotHash ?? metadata?.loadoutSnapshotHash ?? "",
    ...(stored.campaign?.checkpointId ? { checkpointId: stored.campaign.checkpointId } : {}),
    participantCount: Math.max(1, stored.campaign?.participantCount ?? data.players?.length ?? 1)
  };
}

function migrateCampaignRuntime(
  runtime: CampaignMissionRuntimeState | undefined
): CampaignMissionRuntimeState | undefined {
  if (!runtime) return undefined;
  if (runtime.schemaVersion === CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION) return runtime;
  const legacy = runtime as unknown as Record<string, unknown>;
  if (legacy["schemaVersion"] !== 5) return undefined;
  return {
    ...structuredClone(runtime),
    schemaVersion: CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
    rewardIntegrity: runtime.rewardIntegrity ?? { eligibleForRewards: true, invalidationReasons: [] }
  };
}

export function unsupportedGameSaveRecord(
  stored: EncodedGameSaveRecord,
  reason: string
): GameSaveMigrationResult {
  const { encodedGameInstanceData: _encodedGameInstanceData, ...metadata } = stored;
  return {
    status: "unsupported",
    record: {
      ...metadata,
      compatibility: {
        status: "unsupported",
        reason,
        recoveryOptions: ["earlier-autosave", "restart-mission", "export", "delete"]
      }
    }
  };
}
