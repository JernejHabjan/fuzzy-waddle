declare const campaignContentIdBrand: unique symbol;

/** Stable human-authored identifier used inside versioned campaign content. */
export type CampaignContentId<TKind extends string> = string & {
  readonly [campaignContentIdBrand]: TKind;
};

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
