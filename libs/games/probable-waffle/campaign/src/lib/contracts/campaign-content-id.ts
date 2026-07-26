declare const campaignContentIdBrand: unique symbol;

/** Defines the campaign content id contract used by this module; its declared members form the compatible boundary for linked consumers. */
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

/**
 * Defines the mission phase id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionPhaseId = CampaignContentId<"phase">;
/**
 * Defines the mission transition id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionTransitionId = CampaignContentId<"transition">;
/**
 * Defines the mission action id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionActionId = CampaignContentId<"action">;
/**
 * Defines the mission condition id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionConditionId = CampaignContentId<"condition">;
/**
 * Defines the mission trigger id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionTriggerId = CampaignContentId<"trigger">;
/**
 * Defines the mission objective id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionObjectiveId = CampaignContentId<"objective">;
/**
 * Defines the mission objective checklist id alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionObjectiveChecklistId = CampaignContentId<"objective-checklist">;
/**
 * Defines the mission dialogue line id alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionDialogueLineId = CampaignContentId<"dialogue-line">;
/**
 * Defines the mission speaker id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionSpeakerId = CampaignContentId<"speaker">;
/**
 * Defines the mission text id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionTextId = CampaignContentId<"text">;
/**
 * Defines the mission portrait id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionPortraitId = CampaignContentId<"portrait">;
/**
 * Defines the mission cinematic id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionCinematicId = CampaignContentId<"cinematic">;
/**
 * Defines the mission encounter id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionEncounterId = CampaignContentId<"encounter">;
/**
 * Defines the mission encounter wave id alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionEncounterWaveId = CampaignContentId<"encounter-wave">;
/**
 * Defines the mission encounter branch id alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionEncounterBranchId = CampaignContentId<"encounter-branch">;
/**
 * Defines the mission reward id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionRewardId = CampaignContentId<"reward">;
/**
 * Defines the mission fact id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionFactId = CampaignContentId<"fact">;
/**
 * Defines the mission counter id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionCounterId = CampaignContentId<"counter">;
/**
 * Defines the mission timer id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionTimerId = CampaignContentId<"timer">;
/**
 * Defines the mission checkpoint id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionCheckpointId = CampaignContentId<"checkpoint">;
/**
 * Defines the mission participant slot id alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionParticipantSlotId = CampaignContentId<"participant-slot">;
/**
 * Defines the mission team id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionTeamId = CampaignContentId<"team">;
/**
 * Defines the mission reason id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionReasonId = CampaignContentId<"reason">;
/**
 * Defines the mission trusted hook id alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionTrustedHookId = CampaignContentId<"trusted-hook">;
/**
 * Defines the campaign unlock id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignUnlockId = CampaignContentId<"unlock">;
/**
 * Defines the scenario actor id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioActorId = CampaignContentId<"scenario-actor">;
/**
 * Defines the scenario point id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioPointId = CampaignContentId<"scenario-point">;
/**
 * Defines the scenario region id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioRegionId = CampaignContentId<"scenario-region">;
/**
 * Defines the scenario route id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioRouteId = CampaignContentId<"scenario-route">;
/**
 * Defines the scenario group id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioGroupId = CampaignContentId<"scenario-group">;
/**
 * Defines the scenario camera shot id alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioCameraShotId = CampaignContentId<"scenario-camera-shot">;
/**
 * Defines the scenario spawn set id alias used by this module. Keep values in this named domain so linked APIs
 * and storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioSpawnSetId = CampaignContentId<"scenario-spawn-set">;
/**
 * Defines the scenario tag id alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
export type ScenarioTagId = CampaignContentId<"scenario-tag">;
