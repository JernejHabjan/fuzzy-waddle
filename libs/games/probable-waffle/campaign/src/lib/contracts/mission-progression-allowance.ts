import type { CampaignChapterId, ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignUnlockId } from "./campaign-content-id";

export interface MissionUnitLevelCap {
  readonly objectName: ObjectNames;
  readonly maximumLevel: number;
}

export interface MissionProgressionAllowance {
  readonly maxStoryChapter?: CampaignChapterId;
  readonly allowedUnlockIds?: readonly CampaignUnlockId[];
  readonly deniedUnlockIds?: readonly CampaignUnlockId[];
  readonly allowedActorIds?: readonly ObjectNames[];
  readonly deniedActorIds?: readonly ObjectNames[];
  readonly allowedResearchIds?: readonly ResearchType[];
  readonly deniedResearchIds?: readonly ResearchType[];
  readonly unitLevelCaps?: readonly MissionUnitLevelCap[];
  readonly maxUnitLevels?: Readonly<Partial<Record<ObjectNames, number>>>;
  readonly loadoutSlotCount: number;
}
