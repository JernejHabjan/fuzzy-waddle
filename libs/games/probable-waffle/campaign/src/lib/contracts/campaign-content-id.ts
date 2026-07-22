declare const campaignContentIdBrand: unique symbol;

/** Stable human-authored identifier used inside versioned campaign content. */
export type CampaignContentId<TKind extends string> = string & {
  readonly [campaignContentIdBrand]: TKind;
};

export const CAMPAIGN_CONTENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isCampaignContentId(value: string): boolean {
  return CAMPAIGN_CONTENT_ID_PATTERN.test(value);
}

export function asCampaignContentId<TKind extends string>(value: string): CampaignContentId<TKind> {
  return value as CampaignContentId<TKind>;
}

export type MissionPhaseId = CampaignContentId<"phase">;
export type MissionTransitionId = CampaignContentId<"transition">;
export type MissionActionId = CampaignContentId<"action">;
export type MissionConditionId = CampaignContentId<"condition">;
export type MissionTriggerId = CampaignContentId<"trigger">;
export type MissionObjectiveId = CampaignContentId<"objective">;
export type MissionObjectiveChecklistId = CampaignContentId<"objective-checklist">;
export type MissionDialogueLineId = CampaignContentId<"dialogue-line">;
export type MissionSpeakerId = CampaignContentId<"speaker">;
export type MissionTextId = CampaignContentId<"text">;
export type MissionPortraitId = CampaignContentId<"portrait">;
export type MissionCinematicId = CampaignContentId<"cinematic">;
export type MissionEncounterId = CampaignContentId<"encounter">;
export type MissionEncounterWaveId = CampaignContentId<"encounter-wave">;
export type MissionEncounterBranchId = CampaignContentId<"encounter-branch">;
export type MissionRewardId = CampaignContentId<"reward">;
export type MissionFactId = CampaignContentId<"fact">;
export type MissionCounterId = CampaignContentId<"counter">;
export type MissionTimerId = CampaignContentId<"timer">;
export type MissionCheckpointId = CampaignContentId<"checkpoint">;
export type MissionParticipantSlotId = CampaignContentId<"participant-slot">;
export type MissionTeamId = CampaignContentId<"team">;
export type MissionReasonId = CampaignContentId<"reason">;
export type MissionTrustedHookId = CampaignContentId<"trusted-hook">;
export type CampaignUnlockId = CampaignContentId<"unlock">;
export type ScenarioActorId = CampaignContentId<"scenario-actor">;
export type ScenarioPointId = CampaignContentId<"scenario-point">;
export type ScenarioRegionId = CampaignContentId<"scenario-region">;
export type ScenarioRouteId = CampaignContentId<"scenario-route">;
export type ScenarioGroupId = CampaignContentId<"scenario-group">;
export type ScenarioCameraShotId = CampaignContentId<"scenario-camera-shot">;
export type ScenarioSpawnSetId = CampaignContentId<"scenario-spawn-set">;
export type ScenarioTagId = CampaignContentId<"scenario-tag">;
